export const comparisonFields = [
  ['task', '研究任務', '研究問題'],
  ['method', '方法', '方法'],
  ['benchmark', '資料集與基準'],
  ['metric', '指標與評估時點'],
  ['result', '主要結果', '發現'],
  ['limitation', '適用範圍與限制', '限制'],
]

export function comparisonEntries(paper, field, fallback) {
  const evidence = paper.comparison?.find(item => item.field === field)
  return evidence ? [evidence] : paper.notes.filter(note => note.kind === fallback)
}

export function sourcePageLink(paper, page) {
  const source = paper.sourceUrl || paper.doi?.match(/^10\.48550\/arxiv\.(.+)$/i)?.[1]
  if (!source) return
  const url = new URL(source.includes('://') ? source : 'https://arxiv.org/pdf/' + source)
  if (url.hostname === 'arxiv.org' && url.pathname.startsWith('/abs/')) {
    url.pathname = url.pathname.replace('/abs/', '/pdf/')
  }
  if (!/\.pdf$/i.test(url.pathname) && !(url.hostname === 'arxiv.org' && url.pathname.startsWith('/pdf/'))) return
  url.hash = `page=${page}`
  return url.href
}
