# Research Atlas｜論文參考文獻知識庫

[開啟 Research Atlas 公開網站](https://cocoslavelaz.github.io/research-atlas/)

以 Astro 靜態網站呈現研究摘要、PDF 頁碼、主題和跨論文關係。專案遵循 [AGENTS.md](AGENTS.md)，資料與關係規格見 [SPEC.md](SPEC.md)。預載三篇檢索增強生成相關的示範文獻，標有「示範文獻」。可刪除 `data/papers/` 中這三份示範 JSON。

## 在 Windows 預覽

安裝含 npm 的 Node.js 24 LTS，並於 PowerShell 進入專案。

```powershell
npm.cmd ci
npm.cmd run dev
```

依終端顯示的網址開啟，預設為 [localhost:4321](http://localhost:4321/)。使用 `npm.cmd run build` 建置，輸出在 `dist/`。本站建置與瀏覽只需要已發布資料，不需 API 金鑰。

## 離線開啟

用瀏覽器開啟專案根目錄的 `index.html`，點「開啟本機離線版」即可瀏覽最近一次輸出的論文庫、詳情與圖譜。離線網頁、樣式、公式字型及本機待核對摘要都輸出到 `.atlas-offline/`。

使用 Astro 開發模式時，新增或更新論文後會自動輸出離線版。等摘要生成，再重新整理離線首頁即可。伺服器關閉期間放入的 PDF 會在下次啟動後處理。也可用 `npm run offline` 手動重建。

## 依主題瀏覽

- 論文庫依 RAG、LLM UQ、hallucination detection 和 Agentic LLM 分區。新 PDF 匯入時會依內容判斷，可歸入多區。點篇名可閱讀完整筆記；核對時可在論文 JSON 的 `categories` 調整分區。

## 從論文庫移除論文

在本機開發網站的論文清單按「刪除」，確認後會從所有分類、論文頁和圖譜移除。網站會把已發布和待審的 JSON 移到 `.atlas-trash/<id>/` 備份。原始 PDF 會留在原處，同 ID 的 PDF 會略過匯入。離線版會重新建置，也可從離線版點「到本機網站管理論文」。

要還原，將備份的 `papers.json` 和 `drafts.json`（若有）各自移回 `data/papers/<id>.json` 和 `data/drafts/<id>.json`，再移除空的 `.atlas-trash/<id>/` 資料夾。公開網站隨下一次正式資料發布更新。

## 比較論文與閱讀引用

- 在論文庫勾選 2 至 4 篇論文，再按「比較論文」。對照表列出研究任務、方法、資料集與基準、指標與評估時點、結果及限制。可用的原文連結會跳到證據頁。
- 在本機開發網站的比較表按「生成 AI 比較」，可查看共同點、差異與可能的研究缺口。系統用同一組 `OPENAI_API_KEY` 將所選論文的比較筆記送到 OpenAI，每則結論附至少兩篇論文的 PDF 頁碼。對照原文後再引用。
- 在離線版開啟對照表時，可點「帶著選取的論文到本機網站生成 AI 比較」，預設連到執行中的 4322 開發伺服器。GitHub Pages 提供靜態對照表。
- 在知識圖譜點選引用箭頭，或在「文獻引用」逐條展開，查看正文的引用用途、方法關係和參考文獻頁碼。
- 新 PDF 匯入時會一併萃取這兩種資料。正文證據不足的引用會保留書目頁碼；核對時可在 `comparison` 和 `references[].context` 補上來源。

## 第一次設定 GitHub Pages

1. 在 GitHub 建立公開的空白儲存庫，例如 `research-atlas`。若使用已初始化的儲存庫，先確認目前分支和遠端，再推送本專案。
2. 從 PowerShell 執行下列命令，將 `YOUR-USERNAME` 換成 GitHub 帳號。若本機已完成 Git 初始化或設定 `origin`，可略過對應指令。

   ```powershell
   git init -b main
   git add .
   git commit -m "建立 Research Atlas"
   git remote add origin https://github.com/YOUR-USERNAME/research-atlas.git
   git push -u origin main
   ```

3. 在儲存庫 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
4. 在 **Actions → 發布研究圖譜 → Run workflow** 執行 `main`。成功後開啟部署記錄的網址，通常為 `https://YOUR-USERNAME.github.io/research-atlas/`。
5. 在 **Settings → Secrets and variables → Actions → New repository secret** 建立 `OPENAI_API_KEY`，填入你自己的 OpenAI API 金鑰。預設使用 `gpt-4.1-mini`。如有需要，可在同頁 **Variables** 設定 `OPENAI_MODEL`，選擇支援 PDF 輸入與 Structured Outputs 的模型。

參考 [GitHub Pages 設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[GitHub Actions Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)、[Astro 部署指南](https://docs.astro.build/en/guides/deploy/github/) 和 [OpenAI PDF 輸入](https://developers.openai.com/api/docs/guides/file-inputs?api-mode=responses)。

## 每次加入論文

1. 到 GitHub 儲存庫的 `papers/`，用 **Add file → Upload files** 上傳可以公開散布的 PDF 並提交至 `main`。檔名使用 `<id>.pdf`，例如 `chen-2024-learning.pdf`。單檔上限 20 MB。
2. 在 **Actions → 匯入論文 PDF** 檢查結果。工作流程將 PDF 送到 OpenAI Responses API，成功後提交 `data/drafts/<id>.json`。本機操作前可先 `git pull --ff-only` 取得草稿。
3. 對照原文確認標題、作者、來源、年份、重點頁碼與參考文獻。調整用詞並統一主題。將 JSON 從 `data/drafts/` 移到 `data/papers/`，把 `status` 改為 `published`。至少要有一筆研究重點、一個主題、一位作者及 DOI 或來源連結。
4. 執行 `npm.cmd run check`，提交並推送至 `main`。Pages 自動部署新版。論文頁面、主題索引及庫內引用隨建置更新。

相同 ID 與 PDF 內容會略過。更換 PDF 會產生新草稿，供審核後更新正式資料。若部分 PDF 匯入失敗，成功的草稿仍會提交。修正失敗原因後可在 Actions 重跑。若分支保護拒絕機器人寫入 `main`，可改用本機匯入並走既有 PR 流程。網站發布在正式 JSON 推送後觸發。

## 在本機處理 PDF

1. 用 `npm.cmd run dev` 啟動本機網站。如果套件已安裝且 PowerShell 找不到 npm，可用 `node .\node_modules\astro\bin\astro.mjs dev`。保持終端機開啟。
2. 把 PDF 放進專案的 `.private-papers/`。檔名可用英文字母、數字、空格與連字號，單檔上限 20 MB。匯入會保留原始檔名，網址與摘要檔名中的空格會轉為連字號。網站啟動時會掃描資料夾，運作期間也會偵測新加入或更新的 PDF，等檔案穩定後才開始匯入。
3. 摘要生成後，重新整理本機網站即可瀏覽。論文會標示「AI 生成・待核對」。同一 ID 已有正式資料時，本機會繼續顯示正式版本。

程式使用 Windows 環境變數 `OPENAI_API_KEY`，也可將 `.env.example` 複製成 `.env` 後填入金鑰。匯入會將 PDF 傳至 OpenAI API。網站關閉期間放入的 PDF 會在下次啟動時處理。若匯入失敗，依終端機訊息修正後可重啟網站重試，或執行 `node --env-file-if-exists=.env scripts/ingest.mjs .private-papers` 手動匯入。

核對完後只提交可公開的正式 JSON，提交前以 `git status --short` 與 `git diff --cached --name-only` 檢查範圍。公開 GitHub 儲存庫中的 PDF、草稿與 Git 歷史都可被讀取。

## 直接從網站上傳的設計

目前透過 GitHub 或本機加入 PDF。若要從公開網頁直接上傳，新增有登入與上傳權限的後端、私有物件儲存和背景處理佇列。後端負責驗證檔案、保存處理狀態與呼叫模型。管理者核對後，後端再透過 GitHub App 提交正式 JSON，觸發 Pages 部署。
