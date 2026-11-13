# Research Atlas 開發規範

## 專案目的

Research Atlas 是繁體中文的論文參考文獻知識庫。讀者可以搜尋論文、查看可追溯的研究重點，以及沿著共同主題與實際引用探索其他文獻。網站由 Astro 靜態建置，部署到 GitHub Pages。

## 目錄與命名

| 路徑 | 內容 |
| --- | --- |
| `papers/<id>.pdf` | 允許在 GitHub 公開的 PDF |
| `data/drafts/<id>.json` | 模型產生的待審筆記 |
| `data/papers/<id>.json` | 已審核的網站資料 |
| `scripts/schema.mjs` | 萃取格式與資料驗證 |
| `scripts/ingest.mjs` | PDF 匯入 |
| `src/pages/` | 論文庫、詳情、圖譜、匯入指南 |
| `src/lib/atlas.mjs` | 資料讀取、主題、關係與站內網址 |
| `.github/workflows/` | PDF 匯入與 Pages 部署 |

使用穩定的小寫英文、數字、連字號作為 `id`，例如 `chen-2024-learning`。同一筆資料的 PDF、JSON 檔名與頁面路徑共用 ID。更新同一份論文時沿用 ID，使用者已發布的筆記由人工更新。

## 內容和審核

- 摘要、重點與介面使用台灣繁體中文。保留原始題名、作者姓名與正式縮寫。
- 保留結構化摘要、主題、研究重點與參考文獻。重點的 `page` 是 PDF 檔案自 1 起算的頁序，`location` 記錄小節、圖或表。核對書目、頁碼、來源及研究結論後才發布。
- 主題沿用庫中既有名稱。原文無法確認的欄位保留 `null` 或空陣列。DOI 只放識別碼，來源網址用 HTTP 或 HTTPS。
- 引用邊須有參考文獻條目與來源頁碼。主題關係依共同標籤產生。修改比對邏輯時，保留來源與方向。
- 將確認過的草稿移到 `data/papers/` 並改為 `published`。網站只從此目錄建置。示範資料使用 `demo: true`。
- API 金鑰只存在本機環境變數、忽略的 `.env` 或 GitHub Actions Secret。PDF 與草稿的可見性取決於儲存庫權限。

## 頁面與視覺

- 沿用共用 Layout、導覽與綠色紙本風格，維持手機與桌面可閱讀。
- 論文列表提供搜尋和主題篩選。詳情頁依序顯示書目、摘要、研究重點、相關論文與參考文獻。
- 知識圖譜用論文與主題節點呈現關係，並保留可用鍵盤操作的篩選器及文字列表。
- 站內網址透過 `route()` 或 `paperUrl()` 產生，使根路徑及 GitHub Pages 子路徑都可使用。

## 驗證

用 `npm ci` 安裝，`npm run dev` 預覽，`npm run check` 驗證資料，`npm run build` 建置。更新匯入腳本時，驗證無 PDF、相同 PDF 重跑，以及新 PDF 產生草稿三條路徑。新增論文只需提交資料，詳情頁、主題與引用圖譜會從資料更新。完整維護流程見 [README.md](README.md)。
