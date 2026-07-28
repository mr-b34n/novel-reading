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

// Also handle pure Arabic digits and decimal numbers in 第001章 or 第44.5章 format
const ZH_CHAPTER_RE = /第\s*([零〇一二三四五六七八九十百千万亿\d\.]+)\s*[章节回集]/i

export function parseChapterTitle(title: string): string {
  if (!title) return ''
  return title.replace(ZH_CHAPTER_RE, (_match, numStr) => {
    // Check if it's already Arabic digits or decimals like 44.5 or 1.1
    const arabic = /^\d+(?:\.\d+)?$/.test(numStr)
      ? (numStr.includes('.') ? numStr : parseInt(numStr, 10))
      : zhNumeralToArabic(numStr)
    return `Chương ${arabic}: `
  })
}

export function formatCleanChapterTitle(title: string, index: number): string {
  if (!title) return `Chương ${index + 1}`

  // Check special chapter headers like 序章 (Chương mở đầu)
  if (/^(?:[【\[(]?\s*(?:序章|序言|引子|楔子|chương\s*0|chương\s*mở\s*đầu))/i.test(title)) {
    const rest = title.replace(/^(?:[【\[(]?\s*(?:序章|序言|引子|楔子|chương\s*0|chương\s*mở\s*đầu)\s*[\]】)]*\s*[:\-_\.–—~\s]*)/i, '').trim()
    return rest || 'Chương Mở Đầu (Chương 0)'
  }

  // Check practice/short chapters like 练笔简章 (Chương luyện tập)
  if (/(?:练笔|練筆|简章|簡章|luyện\s*tập)/i.test(title)) {
    const rest = title.replace(/^(?:[【\[(]?\s*(?:第[^\s]+章)?\s*(?:练笔|練筆|简章|簡章|chương\s*luyện\s*tập)\s*[\]】)]*\s*[:\-_\.–—~\s]*)/i, '').trim()
    return rest || 'Chương Luyện Tập'
  }

  // First convert Chinese numerals if present
  const clean = parseChapterTitle(title) || title

  // Remove redundant prefixes like "Chương 1:", "Chương Một -", "Chương hai mươi:", "Chương 1.", "Chương 44.5:", "Chapter 1:", "Chương một abc"
  const prefixRegex = /^[【\[(]?\s*(?:Chương|Chuong|Chapter|Ch|第|Hồi|Tiết|Bài)\s*(?:thứ\s+|số\s+)?(?:[\d\.]+|[〇零一二三四五六七八九十百千万亿]+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|mươi|lăm|lẻ|linh|trăm|nghìn|ngàn|vạn|triệu|lần|quý)+(?:\s+(?:[\d\.]+|[〇零一二三四五六七八九十百千万亿]+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|mươi|lăm|lẻ|linh|trăm|nghìn|ngàn|vạn|triệu|lần|quý)+)*\s*[章回集节\]】)]*\s*[:\-\._–—~\s]*/i
  const stripped = clean.replace(prefixRegex, '').trim()

  return stripped || clean
}

