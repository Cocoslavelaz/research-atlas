# Research Atlas 開發規範

## 專案目的

Research Atlas 是繁體中文的論文參考文獻知識庫。讀者可以搜尋論文、查看可追溯的研究重點，以及沿著共同主題與實際引用探索其他文獻。網站由 Astro 靜態建置，部署到 GitHub Pages。

## 目錄與命名

| 路徑 | 內容 |
| --- | --- |
| `papers/<id>.pdf` | 允許在 GitHub 公開的 PDF |
| `.private-papers/` | 本機開發伺服器自動監看的 PDF 收件匣 |
| `data/drafts/<id>.json` | 模型產生的待審筆記，本機開發網站會自動顯示 |
| `data/papers/<id>.json` | 已審核的網站資料 |
| `scripts/schema.mjs` | 萃取格式與資料驗證 |
| `scripts/ingest.mjs` | PDF 匯入 |
| `scripts/compare-papers.mjs` | 本機的跨論文 AI 比較 |
| `scripts/watch-papers.mjs` | 本機 PDF 掃描與匯入排程 |
| `src/pages/` | 論文庫、詳情、圖譜、匯入指南 |
| `src/lib/atlas.mjs` | 資料讀取、主題、關係與站內網址 |
| `.github/workflows/` | PDF 匯入與 Pages 部署 |

使用穩定的小寫英文、數字、連字號作為 `id`，例如 `chen-2024-learning`。JSON 檔名與頁面路徑共用 ID。更新同一份論文時沿用 ID，使用者已發布的筆記由人工更新。
匯入會保留 PDF 檔名，並以小寫英文字母及連字號建立 ID。例如 `Last Step Matters.pdf` 對應 `last-step-matters.json`。不同的論文須有不同的 ID。

## 內容和審核

- 摘要、重點與介面使用台灣繁體中文。保留原始題名、作者姓名與正式縮寫。
- 保留結構化摘要、主題、研究重點與參考文獻。重點的 `page` 是 PDF 檔案自 1 起算的頁序，`location` 記錄小節、圖或表。核對書目、頁碼、來源及研究結論後才發布。
- 主題沿用庫中既有名稱。原文無法確認的欄位保留 `null` 或空陣列。DOI 只放識別碼，來源網址用 HTTP 或 HTTPS。
- `categories` 依研究問題、方法或實驗選擇首頁分類，可多選。新 PDF 匯入時一併判斷，審核時可修正。分類由 `src/lib/paper-categories.mjs` 定義，沒有適合分類的論文顯示於「未分類」。
- 引用邊須有參考文獻條目與來源頁碼。主題關係依共同標籤產生。修改比對邏輯時，保留來源與方向。
- `comparison` 每個面向最多一筆，附 PDF 頁序與小節或圖表。指標需說明評估對象及時點，結果需保留對應模型、資料集或基準。缺乏原文依據的面向省略。
- `references[].context` 記錄正文引用的 PDF 頁序、小節、引用用途與方法關係。正文頁序與書目頁序分開保存。正文證據不足時保留 `null` 或省略。
- 本機開發網站會顯示草稿，並在總覽和詳情頁標示「AI 生成・待核對」。同一 ID 已有正式資料時，優先顯示正式版本。
- 公開網站只建置 `data/papers/` 的正式資料。核對後要公開發布時，把草稿移到該目錄並改為 `published`。示範資料使用 `demo: true`。
- API 金鑰只存在本機環境變數、忽略的 `.env` 或 GitHub Actions Secret。PDF 與草稿的可見性取決於儲存庫權限。

## 頁面與視覺

- 沿用共用 Layout、深藍底色與青綠操作色。主題分區以標題和輔助色辨識，維持手機與桌面可閱讀。
- 首頁依研究分類呈現簡明論文清單，提供搜尋、細部主題篩選與 2 至 4 篇論文的證據對照。同篇論文的比較勾選需跨區同步。詳情頁依序顯示書目、摘要、研究重點、相關論文與參考文獻。
- 即時 AI 比較由本機伺服器送出，僅使用所選論文的比較證據。每則結論至少引用兩篇所選論文，頁碼、章節與連結由伺服器從原資料帶入。將研究缺口描述為基於所選論文的推論。
- `equations` 收錄可用 KaTeX 排版的原文公式，附中文解釋與 PDF 頁序。無公式時可留空。
- 根目錄的 `index.html` 是公開網站與本機離線版的入口。本機開發伺服器在論文資料變動後執行 `node scripts/build-offline.mjs`，將離線網頁輸出到 `.atlas-offline/`。
- 本機可移除論文。JSON 備份到 `.atlas-trash/<id>/`，該目錄存在時略過同 ID 的 PDF 匯入。備份留在本機。
- 知識圖譜用論文與主題節點呈現關係，引用箭頭與可用鍵盤操作的文字列表皆可展開引用脈絡。
- 站內網址透過 `route()` 或 `paperUrl()` 產生，使根路徑及 GitHub Pages 子路徑都可使用。

## 驗證

用 `npm ci` 安裝，`npm run dev` 預覽，`npm run check` 驗證資料，`npm run build` 建置。更新匯入腳本時，驗證無 PDF、相同 PDF 重跑，以及新 PDF 產生草稿三條路徑。新增論文只需提交資料，詳情頁、主題與引用圖譜會從資料更新。完整維護流程見 [README.md](README.md)。
