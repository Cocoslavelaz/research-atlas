# Research Atlas｜論文參考文獻知識庫

以 Astro 靜態網站呈現研究摘要、PDF 頁碼、主題和跨論文關係。專案遵循 [AGENTS.md](AGENTS.md)，資料與關係規格見 [SPEC.md](SPEC.md)。預載三篇檢索增強生成相關的示範文獻，標有「示範文獻」。可刪除 `data/papers/` 中這三份示範 JSON。

## 在 Windows 預覽

安裝含 npm 的 Node.js 24 LTS，並於 PowerShell 進入專案。

```powershell
npm.cmd ci
npm.cmd run dev
```

依終端顯示的網址開啟，預設為 [localhost:4321](http://localhost:4321/)。使用 `npm.cmd run build` 建置，輸出在 `dist/`。本站建置與瀏覽只需要已發布資料，不需 API 金鑰。

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

需要保留 PDF 與草稿在本機時，將原檔放在忽略的 `.private-papers/`，將 `.env.example` 複製成 `.env` 並填入自己的金鑰。執行：

```powershell
npm.cmd run ingest -- .private-papers
```

程式仍會將 PDF 傳至 OpenAI API。核對完後只提交可公開的正式 JSON，提交前以 `git status --short` 與 `git diff --cached --name-only` 檢查範圍。公開 GitHub 儲存庫中的 PDF、草稿與 Git 歷史都可被讀取。

## 直接從網站上傳的設計

目前透過 GitHub 或本機加入 PDF。若要從公開網頁直接上傳，新增有登入與上傳權限的後端、私有物件儲存和背景處理佇列。後端負責驗證檔案、保存處理狀態與呼叫模型。管理者核對後，後端再透過 GitHub App 提交正式 JSON，觸發 Pages 部署。
