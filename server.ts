import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";
import type { DatabaseState, LectureNote, Quiz, User } from "./src/types";

// Helper to extract 11-character YouTube video ID
function extractVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

dotenv.config();

const app = express();
const PORT = 3000;

// Path to the database file
const DB_FILE = path.join(process.cwd(), "db.json");

// Define pre-seeded data matching the SQL schema perfectly
const initialDb: DatabaseState = {
  users: [
    {
      id: 1,
      email: "f132100366@gmail.com",
      created_at: "2026-06-01T11:24:00.000Z"
    }
  ],
  lecture_notes: [
    {
      id: 1,
      user_id: 1,
      title: "人工智慧與大型語言模型 (AI & LLMs Crash Course)",
      source_type: "youtube",
      source_url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
      raw_text: `【人工智慧與大型語言模型導論課堂紀錄】

1. 機器學習基礎 (Machine Learning Basics)
傳統編程是由工程師輸入規則 (Rules) 和數據 (Data) 來取得答案 (Answers)。而機器學習則是翻轉這個架構，通過大量輸入數據和相應的答案，由機器自我歸納出其內部的運作規則、規律與統計模型。這個規則在神經網路中，表現為數以萬計的「權重與偏差值」調校。

2. 深度學習與變形器架構 (Transformer Architecture)
深度網路的突破仰賴多層感知機的疊加。其中 2017 年 Google 發表的 \`Transformer\` 架構改變了自然語言處理 (NLP) 的面貌。其核心是「注意力機制」(Self-Attention Mechanism)，允許模型同時處理整段句子，計算文字與文字之間的語意關聯性，成功解決了傳統循環神經網路 (RNN/LSTM) 無法隨順序並行運算與容易遺忘前面段落的問題。

3. 大型語言模型 (Large Language Models)
LLM (如 GPT 系列、Claude、Gemini 等) 通過極限參數化 (數百億至數萬億參數) 與規模巨大的網際網路文本預訓練，學會了「預測下一個最可能的字詞 (Next Token Prediction)」。在此段預訓練基礎上，引入「人類反饋強化學習 (RLHF)」與「指令微調 (Instruction Tuning)」，使其行為不僅是合乎語意概率，更是對人類有幫助、誠實且安全的對答工具。

4. 生成式 AI 的限制與挑戰
雖然強大，但當前 AI 面臨著「幻覺現象 (Hallucination)」，即生成看似正確實則不符事實的內容。為了緩解這點，業界推出了「檢索增強生成 (RAG)」，讓 LLM 在回應前，先在企業知識庫或 Google 搜尋中尋求事實依據；另一大方向是 Function Calling，將 LLM 當作大腦控製器，調度外部數理計算、天氣、地圖等 API 工具。`,
      summary: `# 課堂重點摘要：人工智慧與大型語言模型 (AI & LLMs)

## 💡 核心要點
- **典範轉移**：傳統編程是「程式碼 + 數據 = 輸出」；機器學習是「數據 + 輸出 = 規則模型」。
- **Transformer 革命**：Transformer 架構的自注意力 (Self-Attention) 打破了循序運算瓶頸，實現完全並行化，使超大規模訓練成為可能。
- **預訓練與微調**：LLM 先經由「海量文本猜下一個詞」的預訓練獲取世界知識，再經由 RLHF、指令微調使其對齊人類指令、安全可靠。

--- 

## 🔍 關鍵詞彙詳解
1. **Self-Attention 自注意力機制**：在處理當前單詞時，模型能同時「注目」句子中其他單詞，分析彼此親合度與長距離語意依託。
2. **RLHF (人類反饋強化學習)**：通過人類教導、評分，利用強化學習演算法微調模型，避免輸出歧視、偏見與仇恨言論。
3. **RAG (檢索增強生成)**：外接知識庫，將即時查詢結果插入 Context Window，解決幻覺問題並提高數據時效性。`,
      cheat_sheet: `## ⚡ 考前 10 秒即時秒殺懶人包

### 📝 超精簡名詞快記配對
* **機器學習的本質** ➔ 尋找最合適擬合數據的「高維逼近函數」。
* **Transformer 發表的論文** ➔ 《Attention Is All You Need》 (2017)。
* **LLM 機率本質** ➔ 給定 $W_{1...t}$, 預測 $P(W_{t+1} | W_{1...t})$ 的機率分布。
* **幻覺解決方案** ➔ RAG (檢索增強) / 聯網搜尋 / 嚴格 System Prompts 機制。

### 🚀 指考必看經典概念圖
\`\`\`
[ 傳統編程 ] 數據 + 規則 ───> 【 跑出答案 】
[ 機器學習 ] 數據 + 答案 ───> 【 生成規則模型 】

[ Transformer 核心 ] ──> 1. Positional Encoding (位置編碼)
                     ──> 2. Multi-Head Self-Attention (多頭自注意力)
                     ──> 3. Feed Forward Networks (前饋傳導網絡)
\`\`\``,
      created_at: "2026-06-01T11:24:10.000Z"
    }
  ],
  quizzes: [
    {
      id: 1,
      note_id: 1,
      question: "傳統編程與機器學習在「產生規則 / 建立模型」上的主要差異是什麼？",
      options: [
        "A. 傳統編程是由工程師手寫規則和邏輯，而機器學習則是輸入數據與答案後，由機器自動訓練出規則模型。",
        "B. 傳統編程是由機器自行猜想規則，而機器學習是由工程師手動將所有權重代碼寫入程式中。",
        "C. 兩者完全沒有差別，都是經由編譯器產生規則。",
        "D. 傳統編程只接受數值，而機器學習只接受文本語音。"
      ],
      correct_answer: "A",
      explanation: "傳統編程流程中，人類工程師需要手動設計規則（演算法邏輯）來處理鍵入資料。而機器學習中，我們為演算法提供高維度的數據以及期望的標準答案，讓神經網路自動優化權重值，進而歸納產生模型關係。"
    },
    {
      id: 2,
      note_id: 1,
      question: "2017 年 Google 發表的 Transformer 架構，其核心是以哪一種機制解決了 RNN/LSTM 無法高效並行處理句子詞彙的問題？",
      options: [
        "A. 梯度下降優化器 (Gradient Descent Optimizer)",
        "B. 卷積特徵提取 (Convolutional Feature Extractor)",
        "C. 自注意力機制 (Self-Attention Mechanism)",
        "D. 殘差連接與層歸一化 (Residual Connections & LayerNorm)"
      ],
      correct_answer: "C",
      explanation: "Transformer 通過自注意力機制 (Self-Attention)，能夠同時考慮整個序列中的所有單詞並計算其相互關係，不再需要像 RNN/LSTM 一樣依賴串行順序傳遞，解鎖了高維度並行計算力。"
    },
    {
      id: 3,
      note_id: 1,
      question: "大型語言模型中為了校正「AI 幻覺問題 (Hallucination)」，使其回答有最新的事實依據，以下哪種技術最為普遍並有效？",
      options: [
        "A. 重新預訓練一個更大的 10 兆參數模型",
        "B. RAG (檢索增強生成 - Retrieval-Augmented Generation)",
        "C. 調高 Temperature (溫度) 參數使其天馬行空地回答",
        "D. 停用所有的人類反饋強化學習 (RLHF)"
      ],
      correct_answer: "B",
      explanation: "RAG 技術在向 LLM 提問前，會先到外部企業知識庫或 Google 搜尋進行檢索，並將搜尋到的可靠條目作為背景上下文注入給模型，可極大程度減輕其憑空猜測的情形。"
    }
  ]
};

// Helper function to read DB
function readDb(): DatabaseState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database file, returning in-memory mock", error);
    return initialDb;
  }
}

// Helper function to write DB
function writeDb(data: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

// Initialize database reading on load
readDb();

// Setup body parser middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client with User-Agent required for AI Studio builds
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/* ==========================================================================
   API ENDPOINTS MATCHING THE POSTGRES SCHEMA RELATIONS
   ========================================================================== */

// 1. Get or initial user session (by email query)
app.get("/api/users", (req, res) => {
  const email = (req.query.email as string) || "f132100366@gmail.com";
  const db = readDb();
  let user = db.users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  
  if (!user) {
    const nextId = db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
    user = {
      id: nextId,
      email: email.trim(),
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);
  }
  res.json({ success: true, user });
});

// 2. Fetch all lecture notes belonging to a specific user
app.get("/api/notes", (req, res) => {
  const email = (req.query.email as string) || "f132100366@gmail.com";
  const db = readDb();
  const user = db.users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  
  if (!user) {
    return res.json({ success: true, notes: [], user: null });
  }

  // Filter lecture notes belonging to user
  const userNotes = db.lecture_notes.filter((note) => note.user_id === user.id);
  res.json({ success: true, notes: userNotes, user });
});

// 3. Get quizzes associated with a specific lecture note
app.get("/api/notes/:id/quizzes", (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  const db = readDb();
  const quizzes = db.quizzes.filter((q) => q.note_id === noteId);
  res.json({ success: true, quizzes });
});

// 4. Delete a note (Cascade delete quizzes)
app.delete("/api/notes/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  let db = readDb();
  
  // Keep only other things
  const originalLength = db.lecture_notes.length;
  db.lecture_notes = db.lecture_notes.filter((n) => n.id !== id);
  db.quizzes = db.quizzes.filter((q) => q.note_id !== id);
  
  writeDb(db);
  res.json({
    success: true,
    deleted: originalLength - db.lecture_notes.length > 0,
    message: `Note with ID ${id} and all related quizzes successfully deleted.`
  });
});

// 5. Generate study content (transcript raw_text, summary, cheat sheet, quizzes) for a user
app.post("/api/notes", async (req, res) => {
  const { title, source_type, source_url, raw_text, email, file_meta } = req.body;
  const userEmail = email || "f132100366@gmail.com";

  if (!title) {
    return res.status(400).json({ error: "Please provide a lecture note title." });
  }

  try {
    const db = readDb();
    let user = db.users.find((u) => u.email.trim().toLowerCase() === userEmail.trim().toLowerCase());
    
    if (!user) {
      const nextId = db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
      user = {
        id: nextId,
        email: userEmail.trim(),
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      writeDb(db);
    }

    console.log(`Generating study contents via Gemini for node title: "${title}" (${source_type})...`);

    // Guard against missing API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined on the server side. Please ensure it is setup in Settings > Secrets.");
    }

    const ai = getGeminiClient();

    let youtubeTranscriptText = "";
    let isFallback = false;
    if (source_type === "youtube" && source_url) {
      const videoId = extractVideoId(source_url);
      if (!videoId) {
        return res.status(400).json({ success: false, error: "無效的 YouTube 網址格式！" });
      }
      
      let fetchedSuccessfully = false;
      try {
        console.log(`Fetching real subtitles for YouTube video ID: ${videoId}...`);
        const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
        if (transcriptList && transcriptList.length > 0) {
          youtubeTranscriptText = transcriptList.map((item) => item.text).join(" ");
          console.log(`Successfully fetched transcript subtitles: ${youtubeTranscriptText.substring(0, 150)}...`);
          fetchedSuccessfully = true;
        } else {
          throw new Error("No transcripts found.");
        }
      } catch (err: any) {
        console.log(`YouTube transcript retrieval inactive for ID: ${videoId}. Proceeding with smart simulation fallback.`);
      }

      // Merge or fallback to user-pasted text if present
      const manualText = (raw_text || "").trim();
      if (manualText) {
        if (fetchedSuccessfully) {
          youtubeTranscriptText = `${manualText}\n\n[自動讀取之影片字幕內容]:\n${youtubeTranscriptText}`;
        } else {
          youtubeTranscriptText = manualText;
        }
        isFallback = false; // We got actual manual content! This is not title-based simulation anymore.
      } else {
        if (!fetchedSuccessfully) {
          isFallback = true; // No auto transcript and no user text -> fall back to title simulation
        }
      }
    }

    // Prepare robust prompt context for Gemini
    let promptContext = `You are a masterful educational AI assistant that transforms lecture topics, YouTube videos, and classes into beautiful, high-efficiency study workspaces.
The user is adding a new lecture in Taiwan (Language: Traditional Chinese, Traditional Chinese Terminology 台灣用語, e.g., 變形器, 機器學習, 上下文, 幻覺, 暫存、神經網路、前饋傳導網絡等).

DETAILS OF THE INPUT LECTURE:
- **Title**: "${title}"
- **Source Type**: "${source_type}"
- **Source URL**: "${source_url || 'N/A'}"
`;

    if (source_type === "youtube" && source_url) {
      if (isFallback) {
        promptContext += `\n[NOTE: Direct subtitles/captions were not enabled on YouTube for this video. StudyPilot is automatically executing 'Intelligent Academic Synthesis Mode' based on the title "${title}".]

Perform an expert-level scholarly synthesis to reconstruct and generate:
1. **重構與編排精美學術擬真課堂逐字稿 (raw_text)**: Since YouTube direct subtitles were not found, synthesize a magnificent, production-grade lecture transcript (about 800-1200 words) for the topic "${title}" in Taiwanese Traditional Chinese. Maintain highly professional academic lecturing tone, section headers, clear explanations of key terms, and definitions.
2. **學術重點加強摘要 (summary)**: Formulate the AI "summary" using gorgeous Markdown headers, code snippets/diagrams (if relevant), detailed point-by-point explanations of core concepts.
3. **考前快速記憶秒殺懶人包 (cheat_sheet)**: Formulate a rapid-recall cheat sheet with major definitions, key formulas, index metrics, and pointers, styled beautifully inside Markdown.
4. **5道實戰模擬測驗 (quizzes)**: Create exactly 5 advanced, conceptual multiple-choice quiz questions matching the technical insights of the class. Offer 4 distinct choices, the correct answer option, and teaching explanations in Traditional Chinese.`;
      } else {
        promptContext += `\nThis is a YouTube Video lecture. We have successfully extracted the actual audio transcript subtitles of this video:
"""
${youtubeTranscriptText.substring(0, 12000)}
"""

Now, perform a brilliant analysis and formulate the following elements:
1. **重構與編排精美課堂逐字稿 (raw_text)**: Organize the raw subtitles above into an elegantly-formatted, easy-to-read academic lecture transcript in Taiwan Traditional Chinese. You can structure it using section sub-headings and timestamps (or logical progress segments). Elaborate on technical formulas, concepts, and details referenced in the transcript.
2. **學術重點加強摘要 (summary)**: Formulate the AI "summary" using gorgeous Markdown headers, code snippets/diagrams (if relevant), detailed point-by-point explanations of core concepts.
3. **考前快速記憶秒殺懶人包 (cheat_sheet)**: Formulate a rapid-recall cheat sheet with major definitions, key formulas, index metrics, and pointers, styled beautifully inside Markdown.
4. **5道實戰模擬測驗 (quizzes)**: Create exactly 5 advanced, conceptual multiple-choice quiz questions matching the technical insights of the video transcript. Offer 4 distinct choices, the correct answer option, and teaching explanations in Traditional Chinese.`;
      }
    } else if (source_type === "audio") {
      promptContext += `\nThis is an Audio Recording. ${raw_text ? `The user provided the following audio transcript draft:\n"""\n${raw_text}\n"""` : 'The audio recording contains content about ' + title + '. Simulate and generate a full, smooth audio transcript.'}
Create:
1. A finalized, beautiful, structured raw script text ('raw_text') based on this draft/topic.
2. A premium Markdown 'summary'.
3. A visual high-efficiency 'cheat_sheet'.
4. Exactly 5 multiple-choice quiz questions ('quizzes') with 4 options and detailed explanations.`;
    } else { // ppt / doc / manual text
      promptContext += `\nThis is a Slide/Presentation file or typed context. ${raw_text ? `The text contents pasted or simulated:\n"""\n${raw_text}\n"""` : 'The presentation belongs to ' + title + '.'}
Create:
1. A polished raw text content representation ('raw_text').
2. A beautiful Markdown 'summary' emphasizing core structures.
3. A rapid-recall visually formatted 'cheat_sheet' (考前精華懶人包).
4. Exactly 5 conceptual quizzes ('quizzes') matching this topic with deep answers and Traditional Chinese explanations.`;
    }

    console.log("Calling Gemini API...");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptContext,
      config: {
        systemInstruction: `You MUST return your output strictly in JSON format matching the responseSchema. All text, summary, cheat sheets, and quiz explanations must be strictly in Traditional Chinese (Taiwanese localized terms 繁體中文 台灣用語).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            raw_text: {
              type: Type.STRING,
              description: "A comprehensive simulated/refined lecture transcript (at least 500-800 words) of the class in Taiwanese Traditional Chinese. Mark major subdivisions clearly."
            },
            summary: {
              type: Type.STRING,
              description: "A magnificent academic summary with key highlights, nested bullet-points, and professional Markdown."
            },
            cheat_sheet: {
              type: Type.STRING,
              description: "A fast memory-retrieval guide with formulas, vocabulary definition cards, or comparison tables, formatted inside exquisite markdown."
            },
            quizzes: {
              type: Type.ARRAY,
              description: "Precisely 5 high-quality, non-trivial, conceptual multiple-choice quizzes to assess understanding.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "The single question, e.g. '根據本節課程，以下關於〇〇的敘述何者正確？'" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Strictly 4 choices prefixing with label like 'A. ...', 'B. ...', etc."
                  },
                  correct_answer: { type: Type.STRING, description: "Strictly one of 'A', 'B', 'C', or 'D'." },
                  explanation: { type: Type.STRING, description: "High-quality teaching explanation details in Taiwanese Traditional Chinese." }
                },
                required: ["question", "options", "correct_answer", "explanation"]
              }
            }
          },
          required: ["raw_text", "summary", "cheat_sheet", "quizzes"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No output was generated by Gemini.");
    }

    const data = JSON.parse(outputText);

    // Save to localized db
    const noteId = db.lecture_notes.length ? Math.max(...db.lecture_notes.map((n) => n.id)) + 1 : 1;
    const newNote: LectureNote = {
      id: noteId,
      user_id: user.id,
      title: title,
      source_type: source_type,
      source_url: source_url || "",
      raw_text: data.raw_text,
      summary: data.summary,
      cheat_sheet: data.cheat_sheet,
      created_at: new Date().toISOString(),
      is_fallback: isFallback
    };

    // Save quizzes
    const startQuizId = db.quizzes.length ? Math.max(...db.quizzes.map((q) => q.id)) + 1 : 1;
    const quizItems: Quiz[] = (data.quizzes || []).map((q: any, index: number) => ({
      id: startQuizId + index,
      note_id: noteId,
      question: q.question,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));

    db.lecture_notes.push(newNote);
    db.quizzes.push(...quizItems);
    writeDb(db);

    res.json({
      success: true,
      note: newNote,
      quizzes: quizItems
    });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown server-side processing error."
    });
  }
});

/* ==========================================================================
   VITE & STATIC ASSET MIDDLEWARE FOR SPA ROUTING
   ========================================================================== */

if (process.env.NODE_ENV !== "production") {
  const startDev = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Development server is running on http://localhost:${PORT}`);
    });
  };
  startDev();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // SPA routing fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production server is running on port ${PORT}`);
  });
}
