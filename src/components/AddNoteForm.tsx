import React, { useState } from "react";
import { Youtube, Mic, Layers, Sparkles, AlertCircle, Link, FileText, CheckCircle2 } from "lucide-react";
import type { LectureNote, Quiz } from "../types";

interface AddNoteFormProps {
  userEmail: string;
  onNoteGenerated: (note: LectureNote, quizzes: Quiz[]) => void;
}

export default function AddNoteForm({ userEmail, onNoteGenerated }: AddNoteFormProps) {
  const [sourceType, setSourceType] = useState<'youtube' | 'audio' | 'ppt'>("youtube");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quick Demo presets - grouped and multiple choices per type
  const presets = {
    youtube: [
      {
        label: "🌌 宇宙黑洞與相對論",
        title: "宇宙黑洞與廣義相對論 (Space Black Holes & General Relativity)",
        url: "https://www.youtube.com/watch?v=5U_MhS7_bY8",
        text: ""
      },
      {
        label: "⚙️ CPU 與二進位運算",
        title: "計算機科學基礎：CPU 的運算核心與二進位系統",
        url: "https://www.youtube.com/watch?v=fWqiiG2v9gQ",
        text: ""
      },
      {
        label: "📈 經濟學供需法則",
        title: "經濟學原理：名校課堂供需法則與市場均衡分析",
        url: "https://www.youtube.com/watch?v=W3a__2mP1gI",
        text: ""
      }
    ],
    audio: [
      {
        label: "🌿 永續綠能與碳中和",
        title: "永續綠色能源與碳中和 (Sustainable Green Energy & Carbon Neutrality)",
        url: "",
        text: "在本節環境工程課中，我們主要探討了太陽能、風能等再生能源的儲能挑戰，特別是電網級鋰電池與智慧電網調度技術。此外，我們探索了碳捕集、利用與封存 (CCUS) 的商業可行性，以及如何透過碳稅、碳交易市場引導企業在 2050 年實現範疇一與範疇二的淨零排放目標。"
      },
      {
        label: "🧠 行為經濟學展望理論",
        title: "行為經濟學與展望理論 (Behavioral Economics & Prospect Theory)",
        url: "",
        text: "今天探討的是丹尼爾·康納曼的「展望理論」。傳統經濟學假設人是理性決策者，但行為經濟學證明：人在面對「得」時傾向風險規避（落袋為安），而面對「失」時傾向風險偏好（孤注一擲）。我們稱此為損失厭惡（Loss Aversion），失去 100 元帶來的痛苦程度，往往是得到 100 元快樂程度的兩倍以上。這在股票市場套牢凹單與保險銷售中得到了廣泛運用。"
      },
      {
        label: "🫀 心臟生理與心電圖",
        title: "臨床醫學：心臟生理與心電圖判讀 (Cardiovascular Physiology & ECG)",
        url: "",
        text: "本週生理醫學課重點在於心導管系統與心電圖 (ECG) 判讀。心房去極化產生 P 波，QRS 複合波反映了心室去極化，而 T 波則表示心室的再極化。如果臨床上觀察到 PR 間期顯著延長（大於 0.2 秒），通常提示一度房室傳導阻滯 (First-degree AV block)；若是 ST 段呈弓背向上抬高，則是急性心肌梗塞 (STEMI) 的關鍵病理指標，必須即刻啟動心導管手術。"
      }
    ],
    ppt: [
      {
        label: "📱 5G 網絡與邊緣運算",
        title: "物聯網與 5G 邊緣運算 (IoT & 5G Edge Computing)",
        url: "",
        text: "5G 超高通訊頻寬 (eMBB) 與超低時延 (URLLC) 開拓了智慧交通與自動化無人工廠的新紀元。邊緣運算 (Edge Computing) 將數據預處理與初級推理（如機器視覺危險偵測）由中央雲端伺服器下放到近端閘道器 (Gateway)，極大地減輕了骨幹網路的傳輸頻寬負荷，並增加了對資料本端隱私的安全控制。"
      },
      {
        label: "🗺️ 企業戰略藍海策略",
        title: "現代企業策略管理：藍海策略核心 (Blue Ocean Strategy)",
        url: "",
        text: "藍海策略 (Blue Ocean Strategy) 的宗旨是避免在飽和的「紅海」市場中割喉削價竞争，而是藉由「價值創新」 (Value Innovation) 同時實現「低成本」與「高差異化」，為客戶開闢全新的無競爭市場空間。藍海策略的核心工具包含「ERRC 表格」：Eliminate（消除產業中視為理所當然的元素）、Reduce（降低某些標準）、Raise（提升關鍵要素）、Create（創造前所未有的價值）。例如太陽馬戲團消除傳統馬戲團的動物表演，並融入歌劇的高雅藝術，成功創造全新客群與溢價空間。"
      },
      {
        label: "🧪 共價鍵與分子軌域",
        title: "普通化學：化學鍵結與分子軌域理論 (Chemical Bonding & MO)",
        url: "",
        text: "在普通化學中，共價鍵的形成可以用價鍵理論 (Valence Bond Theory) 或分子軌域理論 (Molecular Orbital Theory, MO) 來說明。價鍵理論主要透過原子軌域的混成（如 sp3, sp2, sp）來解釋分子幾何形狀（如甲烷的四面體）。然而，為了解釋雙原子分子（如氧氣 O2）的「順磁性」（具有未配對電子），我們必須採用分子軌域理論。在 MO 模型中，波函數互相重疊形成成鍵引力軌域 (bonding orbitals) 與反鍵斥力軌域 (antibonding orbitals)。根據分子軌域的填入規則（構造原理、包立不相容原理、洪德定則），能清楚證明氧氣具有兩個未配對電子。"
      }
    ]
  };

  const applyPreset = (preset: { title: string; url: string; text: string }) => {
    setTitle(preset.title);
    setSourceUrl(preset.url);
    setRawText(preset.text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("請填寫課程/筆記標題");
      return;
    }
    if (sourceType === "youtube" && !sourceUrl.trim()) {
      setError("請提供 YouTube 影片網址");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source_type: sourceType,
          source_url: sourceType === "youtube" ? sourceUrl.trim() : "",
          raw_text: rawText.trim(),
          email: userEmail
        })
      });

      const rawTextResponse = await response.text();
      let resData: any = null;
      try {
        resData = JSON.parse(rawTextResponse);
      } catch (jsonErr) {
        const shortErr = rawTextResponse.length > 150 ? rawTextResponse.substring(0, 150) + "..." : rawTextResponse;
        throw new Error(`伺服器連線異常或逾時 (代碼 ${response.status}): ${shortErr}`);
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData?.error || "伺服器生成失敗，請檢查 API 金鑰設置");
      }

      setSuccess(true);
      setTitle("");
      setSourceUrl("");
      setRawText("");
      onNoteGenerated(resData.note, resData.quizzes);
      
      // Auto fade success message
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "發生未知錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg" id="add-note-container">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative flex items-center justify-center w-16 h-16 mb-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
            <div className="rounded-full bg-indigo-600 p-4 text-white z-10">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-bold font-display text-slate-800 mb-1">
            AI 智慧學伴正在編製教材...
          </h3>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            這大約需要 10-15 秒。系統正在生成：
            <span className="block mt-1 font-semibold text-indigo-600">
              ✓ 課堂逐字稿 • ✓重點摘要 • ✓考前懶人包 • ✓5道模擬測驗
            </span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold font-display text-slate-800 text-base">建立新課程筆記</h2>
          <p className="text-xs text-slate-400">輸入教材，一鍵生成多合一學伴工作區</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            選擇教材來源 (Source Type)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="source-youtube-btn"
              type="button"
              onClick={() => { setSourceType("youtube"); setError(null); }}
              className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                sourceType === "youtube"
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Youtube className="w-4 h-4 mb-1" />
              <span>YouTube 影片</span>
            </button>

            <button
              id="source-audio-btn"
              type="button"
              onClick={() => { setSourceType("audio"); setError(null); }}
              className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                sourceType === "audio"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Mic className="w-4 h-4 mb-1" />
              <span>錄音 / 口述</span>
            </button>

            <button
              id="source-ppt-btn"
              type="button"
              onClick={() => { setSourceType("ppt"); setError(null); }}
              className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                sourceType === "ppt"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Layers className="w-4 h-4 mb-1" />
              <span>簡報 / 繁瑣文本</span>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              課程標題 (Title) <span className="text-red-500">*</span>
            </label>
            <input
              id="note-title-input"
              type="text"
              placeholder="例如：統計學第一章：常態分佈"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 outline-none text-sm transition"
            />
          </div>

          {sourceType === "youtube" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  YouTube 影片連結 (Source URL) <span className="text-red-500">*</span>
                </label>
                <input
                  id="youtube-url-input"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 outline-none text-sm transition"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    手動提供影片大綱、重點或逐字稿 (選填防忙防呆備份)
                  </label>
                  <span className="text-[10px] text-indigo-500 animate-pulse font-medium">✨ 防封防無字幕神招</span>
                </div>
                <textarea
                  id="raw-text-input-yt"
                  rows={3}
                  placeholder="💡 若您的影片沒有中英字幕，或因 YouTube 官方防護使系統自動讀取失敗，您可在此直接貼上影片章節、逐字稿、大綱或個人隨堂筆記。AI 將完美讀取並為您編制最高水準的大師級智慧講義與模擬試題！"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 outline-none text-xs font-sans transition resize-none text-slate-600"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  手動貼上教材 / 重點口述 (Raw Text)
                </label>
                <span className="text-[10px] text-slate-400">填寫後 AI 將優化編撰</span>
              </div>
              <textarea
                id="raw-text-input"
                rows={4}
                placeholder={
                  sourceType === "audio"
                    ? "可貼上錄音所抄寫下的不完整筆記，或輸入這期講義重點大綱..."
                    : "可直接將簡報（PPT）文字、章節重點或個人講義黏貼於此..."
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 outline-none text-sm font-sans transition resize-none"
              />
            </div>
          )}
        </div>

        {/* Preset helper */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>一鍵帶入精選範例（推薦測試！）</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets[sourceType].map((preset, idx) => (
              <button
                id={`preset-${sourceType}-${idx}`}
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 bg-white rounded-lg transition active:scale-95 duration-150 cursor-pointer flex items-center gap-1"
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-700 text-xs text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>筆記教材與模擬考題生成成功！已加入列表中。</span>
          </div>
        )}

        {/* Submit */}
        <button
          id="submit-generate-btn"
          type="submit"
          className="w-full cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white font-semibold text-sm py-2.5 rounded-xl shadow-md shadow-indigo-100 transition duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>開始 AI 分析生成</span>
        </button>
      </form>
    </div>
  );
}
