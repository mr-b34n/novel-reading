import type { Chapter } from '@/types'

// ===================== TXT PARSER =====================
// Detects chapter boundaries using common patterns like:
//   第一章 Title, 第001章 Title, Chapter 1 Title, Chương 1, 44.5章, 序章, 练笔简章, etc.

const CHAPTER_PATTERNS = [
  /^[【\[(]?\s*第\s*[\d〇零一二三四五六七八九十百千万亿\.]+\s*[章节回集]/,
  /^[【\[(]?\s*(?:Chapter|Chương|Chuong|Hồi|Tiết|Ch)\s+[\d\.]+/i,
  /^[【\[(]?\s*[\d\.]+\s*[章节]/,
  /^[【\[(]?\s*(?:序章|序言|引子|楔子|尾声|尾聲|后记|後記|前传|前傳|外传|外傳|番外|练笔|練筆|简章|簡章|lời tựa|chương mở đầu|tiết tử|vĩ thanh|phiên ngoại|ngoại truyện)/i,
]

function isChapterHeader(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 2 || trimmed.length > 80) return false
  return CHAPTER_PATTERNS.some(p => p.test(trimmed))
}

export function parseTxt(raw: string): { chapters: Chapter[], intro?: string } {
  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  const rawChapters: { title: string; lines: string[] }[] = []
  let currentTitle = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const isCh = isChapterHeader(trimmed)

    if (isCh) {
      if (currentTitle || currentLines.length > 0) {
        rawChapters.push({ title: currentTitle, lines: currentLines })
      }
      currentTitle = trimmed
      currentLines = []
    } else {
      if (trimmed) {
        currentLines.push(trimmed)
      } else if (currentLines.length > 0 && currentLines[currentLines.length - 1] !== '') {
        currentLines.push('')
      }
    }
  }

  if (currentTitle || currentLines.length > 0) {
    rawChapters.push({ title: currentTitle, lines: currentLines })
  }

  const validChapters: Chapter[] = []

  for (const item of rawChapters) {
    const content = item.lines.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()

    // Skip empty entries without title and content
    if (!item.title && !content) continue

    // Skip headers that have no content (e.g. TOC list entries at start of file)
    if (item.title && content.length === 0) {
      continue
    }

    validChapters.push({
      title: item.title || 'Giới thiệu',
      content,
      isIntro: !item.title,
    })
  }

  let intro = ''
  const finalChapters: Chapter[] = []
  const titleIndexMap = new Map<string, number>()

  for (const ch of validChapters) {
    if (ch.isIntro) {
      if (intro) intro += '\n\n'
      intro += ch.content
      continue
    }

    const cleanTitle = ch.title.trim()
    if (cleanTitle && titleIndexMap.has(cleanTitle)) {
      const existingIdx = titleIndexMap.get(cleanTitle)!
      const existingCh = finalChapters[existingIdx]
      // Replace stub with real chapter content if new one is longer
      if (ch.content.length > existingCh.content.length) {
        finalChapters[existingIdx] = ch
      }
    } else {
      if (cleanTitle) {
        titleIndexMap.set(cleanTitle, finalChapters.length)
      }
      finalChapters.push(ch)
    }
  }

  return { chapters: finalChapters, intro }
}

export function isIntroChapter(ch: Chapter): boolean {
  return ch.isIntro === true || ch.customNumber === '0'
}

export function formatBookChapterInfo(chapters: Chapter[]): string {
  const chapterCount = chapters.filter(ch => !isIntroChapter(ch)).length
  const hasIntro = chapters.some(ch => isIntroChapter(ch))
  if (chapterCount <= 0 && hasIntro) return 'Trang giới thiệu'
  if (hasIntro) return `${chapterCount} chương + giới thiệu`
  return `${chapterCount} chương`
}
