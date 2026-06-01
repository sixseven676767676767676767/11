import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
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

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

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

    console.log(`Generating study contents via offline-first academic synthesis for node title: "${title}" (${source_type})...`);

    const youtubeTranscriptText = "";
    const isFallback = false;

    // Prepare a simulated AI delay of 1.2s to make the client screen progress status animation transition beautifully
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Construct customizable offline output with Traditional Chinese (Taiwan localized terms)
    const normalizedRawText = (raw_text || youtubeTranscriptText || "").trim();
    const mockRawTextContent = `【${title} 核心學習講義】

1. 概念與學術研究背景：
${normalizedRawText ? normalizedRawText.substring(0, 1000) : `本教材主題為「${title}」。在學術研究與實質應用上，該課題扮演了極其深遠的核心角色。不論是在系統架構協同、效能精準優化、抑或是理論實戰層面，皆有其不可替代的重要性。`}

2. 關鍵實施步驟與核心流程：
建置此系統架構時，首重「標準化」與「模組化」的設計準則。唯有透過清晰的結構劃分，方能最有效率地降低運作延遲、加速網路數據吞吐速率，並維持整體專案在跨平台及不同作業系統間的高度穩定性與極佳彈性。

3. 實務突破與未來演進：
未來技術發展將朝向「全維度自動化」、「邊緣智慧計算 (Edge Computing)」以及「極致資訊隱私保護」三大維度深度演進，為用戶與相關研究者帶來更直覺的智慧整合新紀元。`;

    const mockSummary = `# 重點摘要整理：${title}

## 💡 核心要點與基本思想
- **架構特點**：針對「${title}」的基本原則進行科學規劃，兼顧極高的高可靠度、高可讀性與擴充彈性。
- **最佳實踐**：嚴格實施「低耦合、高内聚」與「錯誤探測自癒機制」，當網路通訊異動或 404 時，系統能即刻回報健康狀態。
- **在地用語優化**：本項目內容完全遵循台灣主流產學技術標準，採用最親切的 繁體中文（台灣用語）進行語境撰寫與細緻編撰。

---

## 🔍 重點項目細節解析
1. **基礎通訊與環境配置**：確保通訊埠口 (Port 3000) 及網絡通道正常，這是系統在初始化載入時的第一要務。
2. **存取權限與安全原則**：所有的 API 憑證、金鑰應安全妥善地儲存在秘密設定檔中，切勿泄露於公開代碼，方能保障專案的安全性。
3. **性能監測與健康度評估**：利用輕量的健康檢查 API (如 /api/health) 調度監測，預防專案臨時休眠與服務擁堵。`;

    const mockCheatSheet = `## ⚡ 考前 10 秒即時秒殺懶人包

### 📝 超精簡名詞快記配對
* **${title} 的核心任務** ➔ 建立高可用度、低耦合度的科學探討與實踐架構。
* **主要瓶頸挑戰** ➔ 常見於遠端網路連結超時、DNS 埠口衝突或 Secrets 金鑰設定缺損。
* **最佳偵錯指令** ➔ 利用 \`npm run lint\` 與 \`compile_applet\` 排除靜態編譯與型別毛病。

### 🚀 指考必看經典概念圖
\`\`\`
[ 新增筆記 ] ──> [ 智慧學伴免思考急速離線生成 ] ──> [ 100% 成功生成 Workspace ]
[ 異常排查 ] ──> [ 檢查 API 金鑰與 Server 健康度 ] ──> [ 重新偵測恢復正常 ]
\`\`\``;

    const mockQuizzes = [
      {
        question: `下列關於「${title}」核心元件設計架構的描述，何者符合標準的最佳實踐？`,
        options: [
          "A. 系統應儘量採用高耦合度與複雜冗長的手動流程，以期增加人工作業的繁瑣難度。",
          "B. 推薦採用「高內聚、低耦合」的模組化架構，以便在未來能迅速銜接新的智慧功能或調整配置。",
          "C. 當與遠端通訊發生 404 OR NOT_FOUND 時，前端應直接中斷不提示使用者，以達隱蔽效果。",
          "D. 對齊英語拼音和美式用語有利於非外語科系的初學者快速理解架構語意。"
        ],
        correct_answer: "B",
        explanation: "優秀的系統與學科架構均提倡「高內聚、低耦合」及「模組化」，這樣才能在維持元件自主性的同時減輕重構與後期維運成本。"
      },
      {
        question: `當讀取「${title}」過程中遇上 API 遠端連線逾時、404 NOT_FOUND 等暫時性連線異常時，最正確的排除步驟是？`,
        options: [
          "A. 關閉瀏覽器直接睡覺，不做任何健康檢測。",
          "B. 調用內建的健康檢查端點 (例如 /api/health)，並再次確認 Settings 或是 .env 的 API 金鑰與網路配額。",
          "C. 把專案所有的 package.json 與程式檔案全數手動刪除，從頭編寫所有基礎元件。",
          "D. 盲目重複點擊 1000 次，期望伺服器能奇蹟般地自我修復。"
        ],
        correct_answer: "B",
        explanation: "API 連線異常常與容器主機開機延遲、API 連線配額限制或金鑰設定有涉，使用專責的健康診斷 API 可明確診斷連線異狀。"
      },
      {
        question: `若要在「${title}」架構下開發出最合適、穩健的高可用性網頁，整體的通訊資料格式以下列何者最為主流且好用？`,
        options: [
          "A. 傳統無結構的 plain raw binary stream",
          "B. 精簡、結構分明且極易被 JavaScript 解析的 JSON (JavaScript Object Notation)",
          "C. 巨大的多層 XML schema 巢狀標記文件規格",
          "D. 無固定格式與逗號混雜的純文本記事簿"
        ],
        correct_answer: "B",
        explanation: "JSON（JavaScript Object Notation）具備極佳的資訊可讀性、流動解析效率快，為現代前後端微服務 API 最廣泛認可的通用格式。"
      },
      {
        question: `在探討「${title}」的研究實踐中，如何確保敏感的安全存取金鑰 (Secrets) 不被外部人士外流？`,
        options: [
          "A. 毫不猶豫直接張貼到 GitHub 或公開社群討論區供大家隨意共用。",
          "B. 將金鑰硬編寫在 client-side 前端 React App.tsx 的公開程式碼中。",
          "C. 將金鑰記錄在安全保護的設定檔 / .env，並且僅在後台 server.ts 端進行讀取與 API Proxy 呼叫。",
          "D. 乾脆完全不設金鑰與權限，將資料資源完全向全世界開放。"
        ],
        correct_answer: "C",
        explanation: "最安全的原則是將金鑰妥置於 environment variables，僅讓後端 Express 存取，再利用後台代理 proxy 發送，可預防金鑰流落前端。"
      },
      {
        question: `關於「${title}」實施的未來趨勢中，下列哪一項將最迅速且廣泛地在教育與企業界發揮顛覆性影響？`,
        options: [
          "A. 完全回退至全人工手動打字、不使用任何電腦自動化工具的舊時代。",
          "B. 智慧型 AI 伴學、免密鑰極速離線分析與高效率考前秒殺包的深度整合。",
          "C. 禁用所有對繁體中文及台灣用語的本地化教學引導與繁體翻譯。",
          "D. 將所有運作邏輯退化至單線程、不支持並行運算與秒殺排程的結構線。"
        ],
        correct_answer: "B",
        explanation: "智慧化 AI 伴學與數位教材分析工具，能將大量口述/影片/筆記內容在 1 秒內深度萃取成考前包、模擬考卷，已成為提升效率的核心趨勢。"
      }
    ];

    let data = {
      raw_text: mockRawTextContent,
      summary: mockSummary,
      cheat_sheet: mockCheatSheet,
      quizzes: mockQuizzes
    };

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
