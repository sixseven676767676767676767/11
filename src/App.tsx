import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Youtube,
  Mic,
  Layers,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  User,
  ExternalLink,
  ChevronRight,
  Menu,
  Clock,
  BookMarked
} from "lucide-react";
import type { LectureNote, Quiz } from "./types";
import AddNoteForm from "./components/AddNoteForm";

export default function App() {
  const userEmail = "f132100366@gmail.com"; // User session email based on request metadata
  
  // States
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<LectureNote | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'cheat_sheet' | 'raw_text'>('summary');
  
  // Filter sidebar state
  const [sourceFilter, setSourceFilter] = useState<'all' | 'youtube' | 'audio' | 'ppt'>('all');
  
  // Show / hide Add note popup modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Quiz interactive state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({}); // quizId -> A/B/C/D
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({}); // quizId -> true/false
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom non-blocking dialog states to bypass sandboxed iframe restrictions
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch all notes for the user on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Fetch quizzes whenever the selected note changes
  useEffect(() => {
    if (selectedNote) {
      fetchQuizzes(selectedNote.id);
      // Reset quiz states for the new note
      setCurrentQuizIndex(0);
      setSelectedAnswers({});
      setQuizSubmitted({});
    } else {
      setQuizzes([]);
    }
  }, [selectedNote]);

  const fetchNotes = async (selectIdToPick?: number) => {
    setLoadingNotes(true);
    try {
      const response = await fetch(`/api/notes?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) {
        setNotes(data.notes || []);
        // Automatically select notes
        if (data.notes && data.notes.length > 0) {
          if (selectIdToPick) {
            const match = data.notes.find((n: LectureNote) => n.id === selectIdToPick);
            setSelectedNote(match || data.notes[0]);
          } else {
            setSelectedNote(data.notes[0]);
          }
        } else {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchQuizzes = async (noteId: number) => {
    setLoadingQuizzes(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/quizzes`);
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleDeleteNoteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(id);
  };

  const confirmDeleteNote = async () => {
    if (noteToDelete === null) return;
    const id = noteToDelete;
    setNoteToDelete(null);
    try {
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        // Clear selected if deleted
        if (selectedNote?.id === id) {
          setSelectedNote(null);
        }
        fetchNotes();
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Callback when a new note is produced
  const handleNoteGenerated = (newNote: LectureNote, generatedQuizzes: Quiz[]) => {
    setShowAddModal(false);
    fetchNotes(newNote.id);
  };

  // Filter notes to display in sidebar
  const filteredNotes = notes.filter(note => {
    if (sourceFilter === 'all') return true;
    return note.source_type === sourceFilter;
  });

  // Calculate overall performance metrics of quizzes for current note
  const totalQuizzesCount = quizzes.length;
  const answeredQuizzesCount = Object.keys(selectedAnswers).length;
  const correctAnswersCount = quizzes.reduce((acc, q) => {
    const isCorrect = selectedAnswers[q.id] === q.correct_answer;
    return acc + (isCorrect ? 1 : 0);
  }, 0);
  
  const masteryPercentage = totalQuizzesCount > 0 
    ? Math.round((correctAnswersCount / totalQuizzesCount) * 100) 
    : 0;

  // Simple Markdown simulation with React components
  const renderSimpleMarkdown = (text?: string) => {
    if (!text) return <p className="text-slate-400 italic">無內容顯示</p>;

    const lines = text.split("\n");
    let inList = false;

    return (
      <div className="markdown-body space-y-3 font-sans leading-relaxed text-slate-700">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          
          // Headers
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={index} className="text-base font-semibold text-indigo-700 mt-4 mb-2 flex items-center gap-1.5 border-b border-indigo-50/60 pb-1 font-display">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-full block"></span>
                {trimmed.replace("### ", "")}
              </h3>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={index} className="text-lg font-bold text-slate-900 mt-5 mb-2 leading-tight tracking-tight border-b border-slate-100 pb-1 font-display">
                {trimmed.replace("## ", "")}
              </h2>
            );
          }
          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={index} className="text-xl font-extrabold text-indigo-900 mt-6 mb-3 border-l-4 border-indigo-600 pl-3 py-0.5 tracking-tight font-display">
                {trimmed.replace("# ", "")}
              </h1>
            );
          }

          // Dividers
          if (trimmed === "---") {
            return <hr key={index} className="border-slate-200/80 my-4" />;
          }

          // Bullet lists
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const content = trimmed.substring(2);
            // Quick bold text highlighter
            return (
              <ul key={index} className="list-disc pl-5 space-y-1.5">
                <li className="text-sm text-slate-600 text-left">
                  {renderFormattedInlineText(content)}
                </li>
              </ul>
            );
          }

          // Regular numbered item format
          if (/^\d+\.\s/.test(trimmed)) {
            const content = trimmed.replace(/^\d+\.\s/, "");
            return (
              <div key={index} className="flex gap-2.5 text-sm my-2 text-left items-start">
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono font-bold shrink-0 mt-0.5">
                  {trimmed.match(/^\d+/)?.[0]}
                </span>
                <span className="text-slate-600">{renderFormattedInlineText(content)}</span>
              </div>
            );
          }

          // Code block or visual box fallback
          if (trimmed.startsWith("```")) {
            return null; // For simplicity in line by line parser
          }

          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            return (
              <span key={index} className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md font-mono my-1 font-medium border border-slate-200">
                {trimmed}
              </span>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={index} className="h-2"></div>;
          }

          // Default text paragraphs
          return (
            <p key={index} className="text-sm text-slate-600 text-left leading-relaxed">
              {renderFormattedInlineText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper for inline styles (bold ** and inline code ` things)
  const renderFormattedInlineText = (text: string) => {
    // Basic bold ** support
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    // Simple state processing or splitting
    let parts = [];
    let lastIndex = 0;
    
    // Replace markdown patterns nicely with inline classes
    const combinedRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let match;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      // Add plain text before
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index)
        });
      }
      
      const snippet = match[0];
      if (snippet.startsWith("**") && snippet.endsWith("**")) {
        parts.push({
          type: "bold",
          content: snippet.slice(2, -2)
        });
      } else if (snippet.startsWith("`") && snippet.endsWith("`")) {
        parts.push({
          type: "code",
          content: snippet.slice(1, -1)
        });
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex)
      });
    }

    if (parts.length === 0) return text;

    return parts.map((p, i) => {
      if (p.type === "bold") {
        return <strong key={i} className="font-semibold text-indigo-900 bg-indigo-50/40 px-1 py-0.5 rounded">{p.content}</strong>;
      }
      if (p.type === "code") {
        return <code key={i} className="font-mono text-amber-600 font-semibold bg-amber-50/50 px-1 py-0.5 rounded border border-amber-100/40 text-xs">{p.content}</code>;
      }
      return p.content;
    });
  };

  return (
    <div className="w-full min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-indigo-100" id="study-pilot-app">
      {/* 1. Sidebar - Left side */}
      <aside className={`w-80 shrink-0 bg-white border-r border-slate-200/80 flex flex-col z-20 transition-all duration-300 md:translate-x-0 ${
        mobileMenuOpen ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl" : "fixed md:sticky md:top-0 h-screen -translate-x-full md:left-0"
      }`} id="sidebar-panel">
        
        {/* Brand Header Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block font-display">StudyPilot</span>
              <span className="text-[10px] text-slate-400 font-medium block">AI 智慧課堂雙向學伴</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* Navigation Content & Filter */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase font-bold text-slate-400 tracking-wider px-2">
              <span>教材來源分類</span>
              <BookMarked className="w-3.5 h-3.5 text-slate-300" />
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-xl">
              <button
                onClick={() => setSourceFilter('all')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  sourceFilter === 'all'
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                全部 ({notes.length})
              </button>
              <button
                onClick={() => setSourceFilter('youtube')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  sourceFilter === 'youtube'
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                YouTube ({notes.filter(n => n.source_type === "youtube").length})
              </button>
              <button
                onClick={() => setSourceFilter('audio')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  sourceFilter === 'audio'
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                錄音口述 ({notes.filter(n => n.source_type === "audio").length})
              </button>
              <button
                onClick={() => setSourceFilter('ppt')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  sourceFilter === 'ppt'
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                簡報文檔 ({notes.filter(n => n.source_type === "ppt").length})
              </button>
            </div>
          </div>

          {/* List of Lecture Notes */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] uppercase font-bold text-slate-400 tracking-wider px-2">
              <span>講義與課程列表</span>
              {loadingNotes && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />}
            </div>

            {loadingNotes ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((placeholder) => (
                  <div key={placeholder} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-7 h-7 mx-auto stroke-1 text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-500">尚無相關講義筆記</p>
                <p className="text-[10px] text-slate-400 max-w-[160px] mx-auto mt-0.5">點選下方按鈕一鍵上傳教材</p>
              </div>
            ) : (
              <div className="space-y-1.5" id="notes-list">
                {filteredNotes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      id={`sidebar-note-item-${note.id}`}
                      onClick={() => {
                        setSelectedNote(note);
                        setMobileMenuOpen(false);
                      }}
                      className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-start text-left ${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-200 shadow-sm shadow-indigo-100/30"
                          : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        {/* Category badge */}
                        <div className="flex items-center gap-1.5">
                          {note.source_type === "youtube" && (
                            <span className="p-1 rounded-md bg-red-50 text-red-600 text-xs">
                              <Youtube className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {note.source_type === "audio" && (
                            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 text-xs">
                              <Mic className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {note.source_type === "ppt" && (
                            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 text-xs">
                              <Layers className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            isSelected ? "text-indigo-600" : "text-slate-400"
                          }`}>
                            {note.source_type === "youtube" ? "Youtube" : note.source_type === "audio" ? "錄音口述" : "簡報檔"}
                          </span>
                        </div>

                        {/* Delete action */}
                        <button
                          onClick={(e) => handleDeleteNoteClick(note.id, e)}
                          id={`delete-note-btn-${note.id}`}
                          className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="刪除這堂講義"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className={`text-xs mt-1.5 font-bold line-clamp-2 leading-snug tracking-tight ${
                        isSelected ? "text-indigo-900" : "text-slate-700"
                      }`}>
                        {note.title}
                      </h3>

                      <span className="text-[9px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {note.created_at ? new Date(note.created_at).toLocaleDateString("zh-TW", { month: "short", day: "numeric" }) : "未知時間"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer with Trigger */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setShowAddModal(true)}
            id="trigger-add-note-btn"
            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition duration-200 border-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新增教材 / AI 智慧生成</span>
          </button>
        </div>
      </aside>

      {/* Main Study Zone Pane */}
      <main className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden overflow-y-auto">
        
        {/* Top Header navbar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 z-10 shadow-sm shadow-slate-100/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <nav className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1">
                <span className="font-medium hover:text-indigo-600 cursor-pointer">我的圖書館</span>
                <span>/</span>
                <span className="text-slate-600 max-w-[120px] truncate">
                  {selectedNote ? (selectedNote.source_type === "youtube" ? "Youtube 轉譯" : "個人課後筆記") : "空空如也"}
                </span>
                {selectedNote && (
                  <>
                    <span>/</span>
                    <span className="text-indigo-600 font-medium truncate max-w-[150px]">{selectedNote.title}</span>
                  </>
                )}
              </nav>
              <h1 className="text-sm md:text-base font-extrabold text-slate-900 truncate max-w-[240px] md:max-w-[450px] mt-0.5 font-display flex items-center gap-1.5">
                {selectedNote?.title || "請點選左側或新增 AI 筆記"}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden md:flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>快速新增</span>
            </button>
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-250 hover:text-slate-800 rounded-lg transition"
            >
              <span>AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Grid Area: Center study workspace (col-span-8) + Side assessment (col-span-4) */}
        {selectedNote ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 md:p-6 lg:overflow-hidden overflow-visible bg-slate-50/50">
            
            {/* Center Section (Course summary content tabs - col-span-7/8) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 lg:overflow-hidden overflow-visible lg:h-full h-auto">
              
              {/* Media source card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    selectedNote.source_type === "youtube" 
                      ? "bg-rose-50 text-red-600" 
                      : selectedNote.source_type === "audio" 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {selectedNote.source_type === "youtube" ? (
                      <Youtube className="w-5.5 h-5.5" />
                    ) : selectedNote.source_type === "audio" ? (
                      <Mic className="w-5.5 h-5.5" />
                    ) : (
                      <Layers className="w-5.5 h-5.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {selectedNote.source_type === "youtube" ? "YouTub 影片來源資訊" : selectedNote.source_type === "audio" ? "AI 自適應音訊辨識" : "簡報或文件文字解析"}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 line-clamp-1 max-w-[400px]">
                      {selectedNote.source_type === "youtube" ? (
                        <a 
                          href={selectedNote.source_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 inline-flex"
                        >
                          {selectedNote.source_url} 
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        `講義文件：已成功轉譯 ${selectedNote.raw_text?.length || 0} 個中文字元`
                      )}
                    </p>
                  </div>
                </div>

                {selectedNote.source_type === "youtube" && (
                  <div className="shrink-0 w-full sm:w-auto text-right">
                    <button 
                      onClick={() => setActiveTab("raw_text")}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 rounded-lg border border-slate-200/60 transition inline-block text-center w-full sm:w-auto cursor-pointer"
                    >
                      開啟課堂逐字稿 📖
                    </button>
                  </div>
                )}
              </div>

              {/* Fallback Notice Alert */}
              {selectedNote.is_fallback && (
                <div className="bg-amber-50/75 border border-amber-200/85 rounded-xl p-4 shadow-sm flex items-start gap-3 shrink-0 text-left">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 font-display">✨ 已啟動「AI 智慧擬真大綱與大師級講義重構模式」</h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-1 font-sans font-medium">
                      此影片並未開啟官方字幕或字幕不可讀。為了確保您的課堂學習毫不中斷，學伴已為您<b>自動執行智慧擬真學術大綱與高水準講義編排模式</b>。已由 AI 基於影片主題智慧生成精美逐字稿、重點摘要、考前秒殺筆記與 5 道高親和力模擬實戰題，讓您的學習不受任何限制！
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs card containing content */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm lg:flex-1 flex flex-col lg:overflow-hidden overflow-visible lg:min-h-0 min-h-[450px]">
                
                {/* Tab buttons control panel */}
                <div className="flex px-4 md:px-5 pt-3.5 border-b border-slate-100 gap-4 md:gap-5 bg-slate-50/50 shrink-0 overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-thin">
                  <button
                    onClick={() => setActiveTab('summary')}
                    id="tab-summary-btn"
                    className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeTab === 'summary'
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    ✏️ AI 課程焦點重點
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('cheat_sheet')}
                    id="tab-cheatsheet-btn"
                    className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeTab === 'cheat_sheet'
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    ⚡ 考前 10 秒秒殺懶人包
                  </button>

                  <button
                    onClick={() => setActiveTab('raw_text')}
                    id="tab-rawtext-btn"
                    className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      activeTab === 'raw_text'
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    📖 課堂講稿 / 逐字稿明細
                  </button>
                </div>

                {/* Tab content viewer */}
                <div className="lg:flex-1 p-5 md:p-6 lg:overflow-y-auto overflow-visible bg-white" id="lecture-tab-content">
                  {activeTab === 'summary' && (
                    <div className="animate-fadeIn">
                      {renderSimpleMarkdown(selectedNote.summary)}
                    </div>
                  )}

                  {activeTab === 'cheat_sheet' && (
                    <div className="animate-fadeIn">
                      <div className="mb-4 bg-indigo-50/40 rounded-xl p-3 border border-indigo-100 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs text-indigo-800 font-semibold">
                          高頻率考點重點整理：適合考試前五分鐘極限速讀。
                        </span>
                      </div>
                      {renderSimpleMarkdown(selectedNote.cheat_sheet)}
                    </div>
                  )}

                  {activeTab === 'raw_text' && (
                    <div className="animate-fadeIn space-y-4">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        <span>以下為 AI 精心對齊整理之錄音/影片文字紀錄</span>
                      </div>
                      <div className="line-clamp-none font-mono text-xs md:text-sm text-slate-700 bg-slate-900 text-slate-100 p-4 md:p-5 rounded-xl overflow-x-auto leading-relaxed border border-slate-950 font-normal">
                        {selectedNote.raw_text ? (
                          <pre className="whitespace-pre-wrap font-sans">{selectedNote.raw_text}</pre>
                        ) : (
                          <p className="text-slate-400 italic">無文字稿</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side Column (Assessment Quiz Section - col-span-4) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:overflow-hidden overflow-visible lg:h-full h-auto text-left">
              
              {/* Card 1: Interactive Multiple Choice Quizzes */}
              <div className="bg-indigo-950 rounded-2xl p-5 md:p-6 text-white shadow-xl lg:flex-1 flex flex-col relative lg:overflow-hidden overflow-visible min-h-[400px]" id="quiz-workspace-panel">
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex-grow flex flex-col lg:h-full h-auto">
                  {/* Assessment heading */}
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-300 animate-bounce" />
                      <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">AI 課堂考卷自我評量</span>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/30 text-[9px] rounded border border-indigo-400/30 font-bold tracking-widest text-indigo-200">
                      5道實戰題
                    </span>
                  </div>

                  {loadingQuizzes ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                      <p className="text-xs text-indigo-200">正在生成評估考題...</p>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                      <HelpCircle className="w-10 h-10 text-indigo-300 stroke-1 mb-2" />
                      <p className="text-xs text-indigo-200">本節課程尚無模擬試題</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between lg:h-full h-auto gap-4">
                      {/* Current Quiz Detail area */}
                      <div>
                        {/* Selector numbers list */}
                        <div className="flex gap-1.5 mb-3">
                          {quizzes.map((_, idx) => {
                            const isSelected = idx === currentQuizIndex;
                            const isAnswered = selectedAnswers[quizzes[idx].id] !== undefined;
                            const isCorrect = isAnswered && selectedAnswers[quizzes[idx].id] === quizzes[idx].correct_answer;

                            return (
                              <button
                                key={idx}
                                onClick={() => setCurrentQuizIndex(idx)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                  isSelected 
                                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-2 ring-white/50" 
                                    : isAnswered
                                      ? isCorrect
                                        ? "bg-emerald-600/70 text-white"
                                        : "bg-rose-600/70 text-white"
                                      : "bg-white/10 text-indigo-200 hover:bg-white/15"
                                }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quiz question heading text */}
                        <div className="mb-4">
                          <span className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider block mb-1">
                            單選模擬題第 {currentQuizIndex + 1} 題 / 共 {quizzes.length} 題
                          </span>
                          <h4 className="text-xs md:text-[13px] font-bold leading-relaxed text-slate-100 text-left">
                            {quizzes[currentQuizIndex].question}
                          </h4>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {quizzes[currentQuizIndex].options.map((opt) => {
                            // Extract letter like "A", "B", "C", "D"
                            const optLetter = opt.substring(0, 1).toUpperCase();
                            const quizId = quizzes[currentQuizIndex].id;
                            const hasSelected = selectedAnswers[quizId] === optLetter;
                            const isCorrectAnswer = quizzes[currentQuizIndex].correct_answer === optLetter;
                            const isSubmitted = quizSubmitted[quizId] === true;

                            let optionStyle = "bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10";
                            
                            if (isSubmitted) {
                              if (isCorrectAnswer) {
                                optionStyle = "bg-emerald-600 text-white border-emerald-400 font-semibold shadow-sm";
                              } else if (hasSelected) {
                                optionStyle = "bg-rose-600 text-white border-rose-400";
                              } else {
                                optionStyle = "bg-white/5 border-white/5 opacity-55 text-indigo-200";
                              }
                            } else if (hasSelected) {
                              optionStyle = "bg-indigo-600 text-white border-indigo-400 ring-1 ring-indigo-300";
                            }

                            return (
                              <button
                                key={opt}
                                id={`quiz-option-${quizId}-${optLetter}`}
                                disabled={isSubmitted}
                                onClick={() => {
                                  setSelectedAnswers(prev => ({ ...prev, [quizId]: optLetter }));
                                  setQuizSubmitted(prev => ({ ...prev, [quizId]: true }));
                                }}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs leading-normal transition duration-150 flex items-start gap-2 ${optionStyle} ${
                                  !isSubmitted ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  hasSelected || (isSubmitted && isCorrectAnswer)
                                    ? "bg-white text-indigo-900" 
                                    : "bg-white/10 text-indigo-100"
                                }`}>
                                  {optLetter}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation Feedback Block */}
                      <div className="mt-4 pt-3.5 border-t border-white/10">
                        {quizSubmitted[quizzes[currentQuizIndex].id] ? (
                          <div className="bg-white/5 rounded-xl p-3 border border-indigo-500/20 text-left animate-slideDown">
                            <div className="flex items-center gap-1.5 mb-1">
                              {selectedAnswers[quizzes[currentQuizIndex].id] === quizzes[currentQuizIndex].correct_answer ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="text-emerald-400 text-xs font-bold font-display">答對了！</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  <span className="text-rose-400 text-xs font-bold font-display">
                                    答錯囉！正解為 ({quizzes[currentQuizIndex].correct_answer})
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] text-indigo-200/90 leading-relaxed font-sans">
                              <span className="font-semibold text-white">解析重點：</span>
                              {quizzes[currentQuizIndex].explanation}
                            </p>
                          </div>
                        ) : (
                          <div className="py-2.5 text-center text-indigo-300 flex items-center justify-center gap-1.5 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <HelpCircle className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-semibold tracking-wide">請點選上方選項回答，完成即顯示答案與即時精闢解析</span>
                          </div>
                        )}
                        
                        {/* Control navigation buttons */}
                        <div className="flex justify-between items-center mt-3">
                          <button
                            disabled={currentQuizIndex === 0}
                            onClick={() => setCurrentQuizIndex(prev => prev - 1)}
                            className="text-[10px] font-bold text-indigo-200 hover:text-white disabled:opacity-40"
                          >
                            ← 上一題
                          </button>
                          
                          <button
                            onClick={() => setShowResetConfirm(true)}
                            className="text-[9px] text-indigo-300 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>重做一次</span>
                          </button>

                          <button
                            disabled={currentQuizIndex === quizzes.length - 1}
                            onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                            className="text-[10px] font-bold text-indigo-200 hover:text-white disabled:opacity-40"
                          >
                            下一題 →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Interactive score statistics / lecture mastery gauge */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm shrink-0 flex items-center justify-between" id="mastery-score-widget">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    本堂精通指數 (Mastery Level)
                  </p>
                  <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-display">
                    {totalQuizzesCount > 0 ? `${masteryPercentage}%` : "0%"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    進度: 已回答 {answeredQuizzesCount}/{totalQuizzesCount} 題 ({correctAnswersCount} 題答對)
                  </p>
                </div>
                
                <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className="stroke-slate-100 fill-transparent"
                      strokeWidth="5"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className="stroke-indigo-600 fill-transparent transition-all duration-500 ease-out"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - masteryPercentage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Award className={`w-5.5 h-5.5 ${masteryPercentage >= 80 ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Empty screen placeholder with call to action */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/30">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-100">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold font-display text-slate-800 mb-2">開始您的 AI 互動智慧學習之旅</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
                您目前還沒有建立或點選任何課程講義。您可以貼上簡報、課堂講稿，或甚至直接輸入 YouTube 影片網址，AI 會立刻編製出課堂逐字稿、關鍵要點、快速考前衝刺卡片，以及擬真模擬試題!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 inline-flex items-center gap-2 cursor-pointer border-none"
              >
                <PlusCircle className="w-4 h-4" />
                <span>立即新增第一堂課程講義</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Interactive Modal: Add Material Workspace */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100/50 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-40">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer border border-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-1">
              <AddNoteForm userEmail={userEmail} onNoteGenerated={handleNoteGenerated} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 text-center animate-fadeIn duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 font-display">確認刪除講義？</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              您確定要把此堂課的所有教材與考試題目刪除嗎？<br/>這個動作將無法恢復！
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition cursor-pointer border-none"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteNote}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer border-none"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 text-center animate-fadeIn duration-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <RefreshCw className="w-6 h-6 animate-spin animate-duration-1000" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 font-display">確認重設模擬試題？</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              確定要重置本堂講義的所有模擬試題，重新開始作答與評估嗎？您的作答紀錄將會被清除。
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition cursor-pointer border-none"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setQuizSubmitted({});
                  setCurrentQuizIndex(0);
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer border-none"
              >
                確認重設
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
