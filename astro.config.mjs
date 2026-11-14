import { defineConfig } from 'astro/config'
import watchPapers from './scripts/watch-papers.mjs'
import comparePapers from './scripts/compare-papers.mjs'
import deletePapers from './scripts/delete-papers.mjs'

export default defineConfig({
  output: 'static',
  site: process.env.PAGES_ORIGIN || undefined,
  base: process.env.PAGES_BASE || '/',
  trailingSlash: 'always',
  outDir: process.env.ATLAS_OFFLINE === '1' ? process.env.ATLAS_OFFLINE_OUT || './.atlas-offline' : './dist',
  integrations: [watchPapers(), comparePapers(), deletePapers()],
  vite: {
    define: { 'import.meta.env.ATLAS_OFFLINE': process.env.ATLAS_OFFLINE === '1' },
    server: {
      watch: { ignored: ['**/.private-papers', '**/.private-papers/**', '**/data/drafts/*.tmp', '**/.atlas-offline/**', '**/.atlas-trash/**'] },
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.private-papers/**', '**/data/drafts/**', '**/.atlas-offline/**', '**/.atlas-trash/**'] },
    },
  },
})
