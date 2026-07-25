import { convertohanviets } from './hanviet'
import type { CustomNameEntry } from './vietphraseDb'
import { zhNumeralToArabic, parseChapterTitle } from './chineseNumerals'

export interface TranslatedToken {
  zh: string
  vi: string
  hanviet: string
  source: 'custom' | 'names' | 'vp' | 'hanviet' | 'punct' | 'luatnhan' | 'pronouns' | 'number'
  charStart?: number
  charEnd?: number
  paragraphText?: string
  altMeanings?: string[]
}

interface CompiledLuatNhanRule {
  rawZh: string
  rawVi: string
  firstChar: string
  regex: RegExp
  viPrefix: string
  viSuffix: string
  zhPrefix: string
  zhSuffix: string
}

const PUNCT_SET = new Set([' ', '\n', '\r', '\t', ',', '.', ':', ';', '!', '?', '“', '”', '（', '）', '《', '》', '【', '】', '。', '！', '？', '—', '-', '"', "'", '‘', '’', '…', '，', '、', '～', '；', '：', '‘', '’'])
const SENTENCE_BREAK_SET = new Set(['.', '\n', '!', '?', '“', '"', '。', '！', '？'])

const NORMALIZE_PUNCT: Record<string, string> = {
  '，': ',',
  '。': '.',
  '！': '!',
  '？': '?',
  '；': ';',
  '：': ':',
  '、': ',',
  '（': '(',
  '）': ')',
  '《': '“',
  '》': '”',
  '【': '[',
  '】': ']',
}

class TranslatorEngine {
  private customMap: Map<string, string> = new Map()
  private namesMap: Map<string, string> = new Map()
  private pronounsMap: Map<string, string> = new Map()
  private vpMap: Map<string, string> = new Map()
  private luatNhanIndex: Map<string, CompiledLuatNhanRule[]> = new Map()
  private maxLen = 15
  private charMaxLen: Uint8Array = new Uint8Array(65536)

  private updateCharMaxLen() {
    this.charMaxLen.fill(0)
    const recordMap = (map: Map<string, any>) => {
      for (const key of map.keys()) {
        if (!key) continue
        const code = key.charCodeAt(0)
        if (code < 65536) {
          if (key.length > this.charMaxLen[code]) {
            this.charMaxLen[code] = Math.min(key.length, 50)
          }
        }
      }
    }
    recordMap(this.customMap)
    recordMap(this.pronounsMap)
    recordMap(this.namesMap)
    recordMap(this.vpMap)

    // Always include grammatical particles
    for (const p of ['的', '了', '呢', '吗', '啊']) {
      const code = p.charCodeAt(0)
      if (this.charMaxLen[code] < 1) this.charMaxLen[code] = 1
    }

    // Always include Chinese numerals and digits so matchNumberOrNumeral works
    const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '亿', '两', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    for (const numChar of numerals) {
      const code = numChar.charCodeAt(0)
      if (this.charMaxLen[code] < 15) this.charMaxLen[code] = 15
    }
  }

  /**
   * Set custom user names (highest priority)
   */
  public setCustomNames(entries: CustomNameEntry[]) {
    this.customMap.clear()
    for (const e of entries) {
      if (e.zh && e.vi) {
        this.customMap.set(e.zh, e.vi)
      }
    }
    this.updateCharMaxLen()
  }

  /**
   * Set general names dictionary
   */
  public setNamesMap(map: Record<string, string>) {
    this.namesMap = new Map(Object.entries(map))
    this.updateCharMaxLen()
  }

  /**
   * Set Pronouns dictionary (Đại từ nhân xưng)
   */
  public setPronounsMap(map: Record<string, string>) {
    this.pronounsMap = new Map(Object.entries(map))
    this.updateCharMaxLen()
  }

  /**
   * Set Vietphrase dictionary
   */
  public setVpMap(map: Record<string, string>) {
    this.vpMap = new Map(Object.entries(map))
    this.updateCharMaxLen()
  }

  /**
   * Set and compile Luật Nhân (Grammar Multiplication Rules with {0})
   */
  public setLuatNhanRules(map: Record<string, string>) {
    this.luatNhanIndex.clear()
    const allRules: CompiledLuatNhanRule[] = []

    for (const [rawZh, rawVi] of Object.entries(map)) {
      if (!rawZh || !rawVi) continue
      const zhParts = rawZh.split('{0}')
      const viParts = rawVi.split('{0}')
      const zhPrefix = zhParts[0] || ''
      const zhSuffix = zhParts[1] || ''
      const viPrefix = viParts[0] || ''
      const viSuffix = viParts[1] || ''

      const firstChar = zhPrefix.length > 0 ? zhPrefix[0] : '*'
      const escPrefix = zhPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escSuffix = zhSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regexStr = '^' + escPrefix + '([^\\s\\n,.:;!?“”（）《》【】。！？]{1,50}?)' + escSuffix
      let regex: RegExp
      try {
        regex = new RegExp(regexStr)
      } catch (e) {
        continue
      }

      allRules.push({
        rawZh,
        rawVi,
        firstChar,
        regex,
        viPrefix,
        viSuffix,
        zhPrefix,
        zhSuffix,
      })
    }

    allRules.sort((a, b) => (b.zhPrefix.length + b.zhSuffix.length) - (a.zhPrefix.length + a.zhSuffix.length))

    for (const rule of allRules) {
      const list = this.luatNhanIndex.get(rule.firstChar) || []
      list.push(rule)
      this.luatNhanIndex.set(rule.firstChar, list)
    }
  }

  /**
   * Clean/Format raw Vietphrase string (picks primary translation if separated by '/')
   */
  public formatMeaning(rawMeaning: string): string {
    if (!rawMeaning) return ''
    let idx1 = rawMeaning.indexOf('/')
    let idx2 = rawMeaning.indexOf('|')
    let endIdx = rawMeaning.length
    if (idx1 !== -1 && idx1 < endIdx) endIdx = idx1
    if (idx2 !== -1 && idx2 < endIdx) endIdx = idx2
    let res = rawMeaning.substring(0, endIdx).trim()
    if (res.startsWith('=')) res = res.substring(1).trim()
    return res
  }

  /**
   * Extract all alternative meanings split by '/', '|', ',', or ';'
   */
  public getAltMeanings(zh: string): string[] {
    const sources = [
      this.customMap.get(zh),
      this.pronounsMap.get(zh),
      this.namesMap.get(zh),
      this.vpMap.get(zh),
    ]
    const set = new Set<string>()
    for (const raw of sources) {
      if (!raw) continue
      const parts = raw.split(/[\/|,;]/)
      for (let p of parts) {
        if (p.startsWith('=')) p = p.substring(1)
        p = p.trim()
        if (p && p.length > 0) {
          set.add(p)
        }
      }
    }
    return Array.from(set)
  }

  /**
   * Capitalize first letter of string
   */
  private capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Automatic rule-based converter for Arabic digits and Chinese Numerals
   */
  private matchNumberOrNumeral(text: string, i: number): { zh: string; vi: string } | null {
    const c = text[i]
    if (!((c >= '0' && c <= '9') || c === '第' || '零〇一二两三四五六七八九十百千万亿'.includes(c))) {
      return null
    }
    const sub = text.substring(i, i + 35)

    // 1. Arabic numbers (including decimals, commas, percentages)
    const arabicMatch = sub.match(/^[\d]+(?:[\.,]\d+)*(?:%|％)?/)
    if (arabicMatch) {
      const val = arabicMatch[0]
      return { zh: val, vi: val }
    }

    // 2. Chinese Numerals
    const zhNumMatch = sub.match(/^(?:第)?([零〇一二两三四五六七八九十百千万亿]+)(?:[章节回])?/)
    if (zhNumMatch && zhNumMatch[0].length > 0) {
      const fullMatch = zhNumMatch[0]
      const numPart = zhNumMatch[1]

      if (/[章节回]$/.test(fullMatch)) {
        return { zh: fullMatch, vi: parseChapterTitle(fullMatch) || fullMatch }
      }

      if (fullMatch.startsWith('第')) {
        if (numPart === '一') return { zh: fullMatch, vi: 'thứ nhất' }
        if (numPart === '二') return { zh: fullMatch, vi: 'thứ hai' }
        if (numPart === '四') return { zh: fullMatch, vi: 'thứ tư' }
        const arabic = zhNumeralToArabic(numPart)
        return { zh: fullMatch, vi: `thứ ${arabic}` }
      }

      if (numPart.length === 1) {
        const mapOne: Record<string, string> = {
          一: 'một',
          二: 'hai',
          两: 'hai',
          三: 'ba',
          四: 'bốn',
          五: 'năm',
          六: 'sáu',
          七: 'bảy',
          八: 'tám',
          九: 'chín',
          十: 'mười',
          百: 'trăm',
          千: 'nghìn',
          万: 'vạn',
          亿: 'ức',
          零: 'không',
          〇: 'không',
        }
        if (mapOne[numPart]) {
          return { zh: fullMatch, vi: mapOne[numPart] }
        }
      }

      const arabic = zhNumeralToArabic(numPart)
      if (arabic > 0) {
        return { zh: fullMatch, vi: arabic.toString() }
      }
    }

    return null
  }

  /**
   * Translate a Chinese string into structured tokens (longest-match greedy algorithm)
   */
  public translateToTokens(text: string): TranslatedToken[] {
    const tokens: TranslatedToken[] = []
    let i = 0
    const n = text.length

    let isSentenceStart = true

    while (i < n) {
      const char = text[i]

      // Check punctuation or whitespace
      if (PUNCT_SET.has(char)) {
        const normVi = NORMALIZE_PUNCT[char] || char
        tokens.push({
          zh: char,
          vi: normVi,
          hanviet: char,
          source: 'punct',
          charStart: i,
          charEnd: i + 1,
          paragraphText: text,
        })
        if (SENTENCE_BREAK_SET.has(char)) {
          isSentenceStart = true
        }
        i++
        continue
      }

      // Priority 0: Luật Nhân (Grammar pattern multiplication rules)
      let matchedLuatNhan = false
      if (this.luatNhanIndex.size > 0) {
        const charRules = this.luatNhanIndex.get(char)
        const starRules = this.luatNhanIndex.get('*')
        if ((charRules && charRules.length > 0) || (starRules && starRules.length > 0)) {
          const testSub = text.substring(i, i + 120)
          const checkRules = (rules: CompiledLuatNhanRule[]): boolean => {
            for (let rIdx = 0; rIdx < rules.length; rIdx++) {
              const rule = rules[rIdx]
              if (rule.zhPrefix.length > 0 && !text.startsWith(rule.zhPrefix, i)) {
                continue
              }
              if (rule.zhSuffix.length > 0 && testSub.indexOf(rule.zhSuffix) === -1) {
                continue
              }
              const m = rule.regex.exec(testSub)
              if (m) {
                const fullMatchZh = m[0]
                const innerZh = m[1]
                const viPre = rule.viPrefix.trim()
                const viSuf = rule.viSuffix.trim()

                if (viPre.length > 0) {
                  let pVi = viPre
                  if (isSentenceStart) {
                    pVi = this.capitalize(pVi)
                    isSentenceStart = false
                  }
                  const zhP = rule.zhPrefix || rule.zhSuffix || rule.rawZh
                  tokens.push({
                    zh: zhP,
                    vi: pVi,
                    hanviet: convertohanviets(zhP),
                    source: 'luatnhan',
                    charStart: i,
                    charEnd: i + (rule.zhPrefix ? rule.zhPrefix.length : 1),
                    paragraphText: text,
                  })
                }

                // Recursively translate the inner text {0}
                const innerTokens = this.translateToTokens(innerZh)
                const innerOffset = i + rule.zhPrefix.length
                for (const it of innerTokens) {
                  const adjustedToken = { ...it }
                  if (adjustedToken.charStart !== undefined && adjustedToken.charEnd !== undefined) {
                    adjustedToken.charStart += innerOffset
                    adjustedToken.charEnd += innerOffset
                  }
                  adjustedToken.paragraphText = text
                  if (isSentenceStart && adjustedToken.vi.length > 0) {
                    adjustedToken.vi = this.capitalize(adjustedToken.vi)
                    isSentenceStart = false
                  }
                  tokens.push(adjustedToken)
                }

                if (viSuf.length > 0) {
                  const zhS = rule.zhSuffix || rule.zhPrefix || rule.rawZh
                  tokens.push({
                    zh: zhS,
                    vi: viSuf,
                    hanviet: convertohanviets(zhS),
                    source: 'luatnhan',
                    charStart: i + rule.zhPrefix.length + innerZh.length,
                    charEnd: i + fullMatchZh.length,
                    paragraphText: text,
                  })
                }

                i += fullMatchZh.length
                return true
              }
            }
            return false
          }

          if (charRules && checkRules(charRules)) {
            matchedLuatNhan = true
          } else if (starRules && checkRules(starRules)) {
            matchedLuatNhan = true
          }
        }
      }
      if (matchedLuatNhan) {
        continue
      }

      // Longest match search
      let matchedZh = ''
      let matchedVi = ''
      let source: TranslatedToken['source'] = 'hanviet'

      const firstCharCode = text.charCodeAt(i)
      const charMax = firstCharCode < 65536 ? this.charMaxLen[firstCharCode] : this.maxLen

      if (charMax > 0) {
        const searchMax = Math.min(charMax, n - i)

        // Check numbers before loop if length allows
        const numRes = this.matchNumberOrNumeral(text, i)

        for (let len = searchMax; len >= 1; len--) {
          const sub = text.substring(i, i + len)

          // 1. Highest Priority: Custom Name
          if (this.customMap.has(sub)) {
            matchedZh = sub
            matchedVi = this.customMap.get(sub)!
            source = 'custom'
            break
          }

        // 2. Priority 2: Pronouns (Đại từ nhân xưng)
        if (this.pronounsMap.has(sub)) {
          matchedZh = sub
          const raw = this.pronounsMap.get(sub)!
          matchedVi = this.formatMeaning(raw)
          source = 'pronouns'
          break
        }

        // 3. Priority 3: Number conversion (if length matches numeral prefix)
        if (numRes && len === numRes.zh.length) {
          matchedZh = numRes.zh
          matchedVi = numRes.vi
          source = 'number'
          break
        }

        // 4. Priority 4: Clean grammatical particles when len === 1
        if (len === 1) {
          if (sub === '的') {
            const nextChar = i + 1 < n ? text[i + 1] : ''
            const isAtClauseEnd = i === n - 1 || PUNCT_SET.has(nextChar)
            matchedZh = sub
            matchedVi = isAtClauseEnd ? '' : 'của'
            source = 'vp'
            break
          }
          if (sub === '了') {
            matchedZh = sub
            matchedVi = 'rồi'
            source = 'vp'
            break
          }
          if (sub === '呢') {
            matchedZh = sub
            matchedVi = 'nhỉ'
            source = 'vp'
            break
          }
          if (sub === '吗') {
            matchedZh = sub
            matchedVi = 'chứ'
            source = 'vp'
            break
          }
          if (sub === '啊') {
            matchedZh = sub
            matchedVi = 'a'
            source = 'vp'
            break
          }
        }

        // 5. Priority 5: For single character (len === 1), check VietPhrase BEFORE General Names
        if (len === 1 && this.vpMap.has(sub)) {
          matchedZh = sub
          const raw = this.vpMap.get(sub)!
          matchedVi = this.formatMeaning(raw)
          source = 'vp'
          break
        }

        // 6. Priority 6: General Names
        if (this.namesMap.has(sub)) {
          matchedZh = sub
          const raw = this.namesMap.get(sub)!
          matchedVi = this.formatMeaning(raw)
          source = 'names'
          break
        }

        // 7. Priority 7: Vietphrase (for len >= 2)
        if (this.vpMap.has(sub)) {
          matchedZh = sub
          const raw = this.vpMap.get(sub)!
          matchedVi = this.formatMeaning(raw)
          source = 'vp'
          break
        }
      }
      }

      // 7. Fallback: Single character Han-Viet
      if (!matchedZh) {
        matchedZh = char
        matchedVi = convertohanviets(char)
        source = 'hanviet'
      }

      // Clean up trailing " đích" from any dictionary match ending in 的
      if (matchedZh.endsWith('的') && source !== 'custom' && matchedZh !== '目的' && matchedZh !== '标的') {
        if (/(?:^|\s)đích$/i.test(matchedVi)) {
          const nextChar = i + matchedZh.length < n ? text[i + matchedZh.length] : ''
          const isAtClauseEnd = i + matchedZh.length === n || PUNCT_SET.has(nextChar)
          const replacement = isAtClauseEnd ? '' : ' của'
          matchedVi = matchedVi.replace(/(?:^|\s)đích$/i, replacement).trim()
        }
      }
      // Clean up leading "đích " from any dictionary match starting with 的
      if (matchedZh.startsWith('的') && source !== 'custom' && matchedZh.length > 1) {
        if (/^đích(?:$|\s+)/i.test(matchedVi)) {
          matchedVi = matchedVi.replace(/^đích(?:$|\s+)/i, 'của ').trim()
        }
      }
      // Clean up trailing " liễu" from any dictionary match ending in 了
      if (matchedZh.endsWith('了') && source !== 'custom' && !['除了', '为了', '罢了', '明了', '理解', '了解'].includes(matchedZh)) {
        if (/(?:^|\s)liễu$/i.test(matchedVi)) {
          matchedVi = matchedVi.replace(/(?:^|\s)liễu$/i, ' rồi').trim()
        }
      }

      const hanviet = convertohanviets(matchedZh)
      let finalVi = matchedVi

      // Apply sentence capitalization
      if (isSentenceStart && finalVi.length > 0) {
        finalVi = this.capitalize(finalVi)
        isSentenceStart = false
      }

      tokens.push({
        zh: matchedZh,
        vi: finalVi,
        hanviet,
        source,
        charStart: i,
        charEnd: i + matchedZh.length,
        paragraphText: text,
      })

      i += matchedZh.length
    }

    return this.optimizeVietnameseSyntax(tokens)
  }

  /**
   * Optimize Vietnamese grammar and word order (Đảo ngữ phương vị từ & định ngữ)
   */
  private optimizeVietnameseSyntax(tokens: TranslatedToken[]): TranslatedToken[] {
    if (!tokens || tokens.length <= 1) return tokens

    const result = [...tokens]

    // 1. Attributive inversion with 的 (Đảo định ngữ A + 的/của + B -> B + A)
    // E.g., [kín mít] [của] [phòng tắm] -> [phòng tắm] [kín mít]
    for (let i = 1; i < result.length - 1; i++) {
      const deToken = result[i]
      if (deToken.zh === '的' || deToken.vi.toLowerCase() === 'của' || deToken.vi.toLowerCase() === 'đích') {
        const prevToken = result[i - 1]
        const nextToken = result[i + 1]

        // Only invert if neither is punctuation or special particles
        if (
          prevToken && nextToken &&
          prevToken.source !== 'punct' && nextToken.source !== 'punct' &&
          !['了', '呢', '吗', '啊', '着', '过', '在', '从', '到', '和', '与', '被', '把', '是', '有'].includes(prevToken.zh) &&
          !['了', '呢', '吗', '啊', '着', '过', '在', '从', '到', '和', '与', '被', '把', '是', '有'].includes(nextToken.zh)
        ) {
          // Check if prevToken is an adjective/attributive modifier (not a pronoun like "tôi", "hắn", "anh ấy")
          const isPronounOrName = prevToken.source === 'pronouns' || prevToken.source === 'names'
          if (!isPronounOrName) {
            // Invert: B comes before A, drop unnecessary "của"/"đích"
            result.splice(i - 1, 3, nextToken, prevToken)
            // Adjust loop index since we replaced 3 tokens with 2
            i = Math.max(0, i - 2)
          }
        }
      }
    }

    // 2. Spatial / Locational Postposition Inversion (Đảo phương vị từ)
    // E.g., [phòng tắm] [kín mít] [bên trong/trong] -> [trong/bên trong] [phòng tắm] [kín mít]
    const locationalMap: Record<string, string> = {
      '里面': 'trong', '里': 'trong', '内': 'trong', '中': 'trong',
      '外面': 'ngoài', '外': 'ngoài',
      '上面': 'trên', '上': 'trên',
      '下面': 'dưới', '下': 'dưới',
      '前面': 'trước', '前': 'trước',
      '后面': 'sau', '后': 'sau',
      '旁边': 'cạnh', '旁': 'cạnh', '身旁': 'bên cạnh', '身边': 'bên cạnh',
      '周围': 'xung quanh', '四周': 'xung quanh', '身遭': 'xung quanh'
    }

    for (let i = 1; i < result.length; i++) {
      const token = result[i]
      if (token.source === 'punct') continue

      const locVi = locationalMap[token.zh]
      if (locVi) {
        // Normalize literal translations to clean Vietnamese preposition
        if (/^(lý diện|lý|nội|trung|ngoại diện|ngoại|thượng diện|thượng|hạ diện|hạ|tiền diện|tiền|hậu diện|hậu|bàng|thân bàng|chu vi|tứ chu)$/i.test(token.vi)) {
          token.vi = locVi
        }

        // Find the start of the preceding noun phrase
        let startIdx = i - 1
        let stepCount = 0
        while (startIdx >= 0 && stepCount < 4) {
          const prev = result[startIdx]
          if (prev.source === 'punct') break
          if (['在', '从', '到', '和', '与', '跟', '被', '把', '是', '有', '看', '听', '说', '望', '向', '往', '走', '跑', '坐', '躺', '立', '站', '想', '要', '让', '使'].includes(prev.zh)) {
            break
          }
          if (locationalMap[prev.zh]) break
          startIdx--
          stepCount++
        }
        startIdx++

        if (startIdx < i && stepCount > 0) {
          const [locToken] = result.splice(i, 1)
          result.splice(startIdx, 0, locToken)
          i = startIdx
        }
      }
    }

    // 3. Sentence capitalization cleanup after reordering
    let capNext = true
    for (let i = 0; i < result.length; i++) {
      const t = result[i]
      if (t.source === 'punct') {
        if (['.', '!', '?', '。', '！', '？', '\n'].includes(t.zh) || ['.', '!', '?', '\n'].includes(t.vi)) {
          capNext = true
        }
      } else if (t.vi && t.vi.length > 0) {
        if (capNext) {
          t.vi = t.vi.charAt(0).toUpperCase() + t.vi.slice(1)
          capNext = false
        } else if (t.source !== 'names' && t.source !== 'custom') {
          if (t.source === 'number' || t.source === 'vp' || t.source === 'hanviet') {
            if (/^[A-Z][a-zà-ỹ]*$/.test(t.vi) && !['Chương', 'Phần', 'Quyển', 'Tập'].includes(t.vi)) {
              t.vi = t.vi.charAt(0).toLowerCase() + t.vi.slice(1)
            }
          }
        }
      }
    }

    return result
  }

  /**
   * Translate Chinese text to plain Vietnamese string
   */
  public translateText(text: string): string {
    const tokens = this.translateToTokens(text)
    let result = ''
    for (let idx = 0; idx < tokens.length; idx++) {
      const t = tokens[idx]
      if (t.source === 'punct') {
        result += t.vi
      } else {
        // Add spacing between words unless preceding punctuation
        if (
          result.length > 0 &&
          !/[\n“"({\[\s]$/.test(result) &&
          !/^[,.:;!?”)}]/ .test(t.vi)
        ) {
          result += ' '
        }
        result += t.vi
      }
    }
    return result
  }
}

export const translator = new TranslatorEngine()
