// ===================== CHINESE NUMERALS → ARABIC =====================
// Converts: 第一百二十三章 → Chương 123
// Supports: 零一二三四五六七八九十百千万亿

const ZH_MAP: Record<string, number> = {
  零: 0, 〇: 0,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9,
}

export function zhNumeralToArabic(zh: string): number {
  let result = 0
  let tmp = 0
  let billion = 0

  for (const c of zh) {
    if (ZH_MAP[c] !== undefined) {
      tmp = ZH_MAP[c]
    } else if (c === '十') {
      result += (tmp === 0 ? 1 : tmp) * 10
      tmp = 0
    } else if (c === '百') {
      result += tmp * 100
      tmp = 0
    } else if (c === '千') {
      result += tmp * 1000
      tmp = 0
    } else if (c === '万') {
      result = (result + tmp) * 10000
      tmp = 0
    } else if (c === '亿') {
      billion = (billion + result + tmp) * 100000000
      result = 0
      tmp = 0
    }
    // ignore Arabic digits or unknown chars — could be mixed e.g. 第001章
  }

  return billion + result + tmp
}

// Also handle pure Arabic digits in 第001章 format
const ZH_CHAPTER_RE = /第([零〇一二三四五六七八九十百千万亿\d]+)[章节回]/

export function parseChapterTitle(title: string): string {
  if (!title) return ''
  return title.replace(ZH_CHAPTER_RE, (_match, numStr) => {
    // Check if it's already Arabic digits
    const arabic = /^\d+$/.test(numStr)
      ? parseInt(numStr, 10)
      : zhNumeralToArabic(numStr)
    return `Chương ${arabic}: `
  })
}

export function formatCleanChapterTitle(title: string, index: number): string {
  if (!title) return `Chương ${index + 1}`

  // First convert Chinese numerals if present
  const clean = parseChapterTitle(title) || title

  // Remove redundant prefixes like "Chương 1:", "Chương 01 -", "Chương 1.", "Chương 1", "Chapter 1:"
  const prefixRegex = /^(?:Chương|Chuong|Chapter|Ch|第)\s*\d+\s*[:\-\._\s]*/i
  const stripped = clean.replace(prefixRegex, '').trim()

  return stripped || clean
}

