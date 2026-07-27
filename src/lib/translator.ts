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
  private blacklistSet: Set<string> = new Set()
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
   * Set custom user names and blacklist (highest priority)
   */
  public setCustomNames(entries: CustomNameEntry[]) {
    this.customMap.clear()
    this.blacklistSet.clear()
    for (const e of entries) {
      if (e.isBlacklist && e.zh) {
        this.blacklistSet.add(e.zh)
      } else if (e.zh && e.vi) {
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
      const regexStr = '^' + escPrefix + '([^\\s\\n\\r\\t,.:;!?“”（）《》【】。！？，、～；：‘’""\'…—\\-·「」『』〈〉〔〕［］｛｝＜＞]{1,25}?)' + escSuffix
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
   * Context-aware meaning disambiguation for words/particles whose correct Vietnamese
   * meaning depends on surrounding context and cannot be resolved by a flat dictionary
   * lookup alone. Adapted from the rule set found in qtOnline.js (meanstrategy), but
   * restricted to in-place meaning corrections only — no token reordering.
   *
   * Returns the corrected Vietnamese meaning, or undefined if no rule applies (in which
   * case normal dictionary lookup proceeds as usual).
   */
  private resolveContextualMeaning(
    sub: string,
    i: number,
    len: number,
    n: number,
    text: string,
    tokens: TranslatedToken[],
    isSentenceStart: boolean,
  ): string | undefined {
    const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : undefined
    const nextIdx = i + len
    const nextChar = nextIdx < n ? text[nextIdx] : ''

    switch (sub) {
      // 得 as a resultative/degree-complement particle after a verb -> "được"
      // (e.g. 做得好 = làm được tốt). Left untouched (falls through to dictionary)
      // when it doesn't immediately follow a verb-like token.
      case '得':
        if (prevToken && (prevToken.source === 'vp' || prevToken.source === 'hanviet')) {
          return 'được'
        }
        return undefined

      // 不成 as a rhetorical-question tag ("...chẳng lẽ...hay sao?") only when the
      // clause actually ends in a question mark shortly after.
      case '不成': {
        let j = nextIdx
        let found = false
        while (j < n && j < nextIdx + 15) {
          const c = text[j]
          if (c === '?' || c === '？') {
            found = true
            break
          }
          if (SENTENCE_BREAK_SET.has(c)) break
          j++
        }
        return found ? 'hay sao' : undefined
      }

      // 越 immediately followed by a number/numeral -> "vượt" (exceed), as opposed to
      // 越 used in the "越...越..." (the more...the more) construction.
      case '越': {
        const rest = text.substring(nextIdx, nextIdx + 20)
        if (/^[\d]/.test(rest) || /^[零〇一二两三四五六七八九十百千万亿]/.test(rest)) {
          return 'vượt'
        }
        return undefined
      }

      // 情 immediately after 事 (when tokenized separately, e.g. 事情 split across
      // dictionary boundaries) should not repeat as a separate word.
      case '情':
        if (prevToken && prevToken.zh.endsWith('事')) {
          return ''
        }
        return undefined

      // 对 as a standalone interjection ("Đúng!") only when it closes a clause.
      case '对':
        if (PUNCT_SET.has(nextChar) && SENTENCE_BREAK_SET.has(nextChar)) {
          return 'đúng'
        }
        return undefined

      // 总是 at the very start of a sentence/paragraph is commonly used as a narrative
      // transition ("Nói chung...") rather than the literal "luôn luôn" (always).
      case '总是':
        return isSentenceStart ? 'nói chung' : 'luôn luôn'

      // 下落 after 的 (的下落 = "tung tích của") -> "tung tích" (whereabouts).
      case '下落':
        if (prevToken && prevToken.zh.endsWith('的')) {
          return 'tung tích'
        }
        return undefined

      // 很/佷 directly after 的 (an intensifier-suffix pattern "...的很") -> "vô cùng".
      // Elsewhere, 很/佷 is left to the normal dictionary (usually "rất").
      case '很':
      case '佷':
        if (prevToken && prevToken.zh === '的') {
          return 'vô cùng'
        }
        return undefined

      // Idioms/particles that are frequently missing or mistranslated by flat
      // dictionaries, with a stable meaning regardless of surrounding context.
      case '却是':
        return 'lại là'
      case '原来':
        return 'thì ra'
      case '谈何容易':
        return 'nói thì dễ'
      case '谈何':
        return 'nói chi là'
      case '所谓':
        return 'cái gọi là'
      case '奈何':
        return 'làm gì'
      case '应着':
        return 'đáp lời'
      case '能为':
        return 'năng lực'
      case '惯了':
        return 'quen rồi'
      case '也对':
        return 'cũng đúng'
      case '都对':
        return 'đều đúng'
      case '才是对':
        return 'mới là đúng'

      default:
        return undefined
    }
  }

  /**
   * Translate a Chinese string into structured tokens (longest-match greedy algorithm)
   */
  public translateToTokens(text: string, initialIsSentenceStart: boolean = true): TranslatedToken[] {
    const tokens: TranslatedToken[] = []
    let i = 0
    const n = text.length

    let isSentenceStart = initialIsSentenceStart
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
                if (this.blacklistSet.has(fullMatchZh)) continue

                const innerZh = m[1]
                if (!innerZh || !innerZh.trim()) continue

                // Avoid matching across clauses or prepositions/conjunctions in grammatical {0}
                if (rule.zhPrefix.length === 0) {
                  if (/[在自从往向于被把让离对至跟同和与但而却又就都也才还或]/.test(innerZh)) {
                    continue
                  }
                  if (/甚至|因为|所以|如果|虽然|已经|曾经|还是|而且|并且|其实|正在|只是/.test(innerZh)) {
                    continue
                  }
                }

                const viPre = rule.viPrefix.trim()
                const viSuf = rule.viSuffix.trim()

                if (viPre.length > 0) {
                  let pVi = viPre
                  if (isSentenceStart) {
                    pVi = this.capitalize(pVi)
                    isSentenceStart = false
                  }
                  const isPreFromZhPrefix = rule.zhPrefix.length > 0
                  const zhP = isPreFromZhPrefix ? rule.zhPrefix : rule.zhSuffix || rule.rawZh
                  const startP = isPreFromZhPrefix ? i : i + innerZh.length
                  const endP = isPreFromZhPrefix ? i + rule.zhPrefix.length : i + fullMatchZh.length

                  tokens.push({
                    zh: zhP,
                    vi: pVi,
                    hanviet: convertohanviets(zhP),
                    source: 'luatnhan',
                    charStart: startP,
                    charEnd: endP,
                    paragraphText: text,
                  })
                }

                // Recursively translate the inner text {0}
                const innerTokens = this.translateToTokens(innerZh, isSentenceStart)
                const innerOffset = i + rule.zhPrefix.length
                for (const it of innerTokens) {
                  const adjustedToken = { ...it }
                  if (adjustedToken.charStart !== undefined && adjustedToken.charEnd !== undefined) {
                    adjustedToken.charStart += innerOffset
                    adjustedToken.charEnd += innerOffset
                  }
                  adjustedToken.paragraphText = text
                  tokens.push(adjustedToken)
                }
                if (innerTokens.length > 0 && innerTokens.some(t => t.vi.trim().length > 0)) {
                  isSentenceStart = false
                }

                if (viSuf.length > 0) {
                  let sVi = viSuf
                  if (isSentenceStart) {
                    sVi = this.capitalize(sVi)
                    isSentenceStart = false
                  }
                  const isSufFromZhSuffix = rule.zhSuffix.length > 0
                  const zhS = isSufFromZhSuffix ? rule.zhSuffix : rule.zhPrefix || rule.rawZh
                  const startS = isSufFromZhSuffix ? i + rule.zhPrefix.length + innerZh.length : i
                  const endS = isSufFromZhSuffix ? i + fullMatchZh.length : i + rule.zhPrefix.length

                  tokens.push({
                    zh: zhS,
                    vi: sVi,
                    hanviet: convertohanviets(zhS),
                    source: 'luatnhan',
                    charStart: startS,
                    charEnd: endS,
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
          
          // If phrase is blacklisted, skip to shorter matches
          if (this.blacklistSet.has(sub)) {
            continue
          }

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

        // 3.5. Priority 3.5: Context-aware disambiguation (see resolveContextualMeaning)
        if (!this.customMap.has(sub)) {
          const contextual = this.resolveContextualMeaning(sub, i, len, n, text, tokens, isSentenceStart)
          if (contextual !== undefined) {
            matchedZh = sub
            matchedVi = contextual
            source = 'vp'
            break
          }
        }

        // 4. Priority 4: Clean grammatical particles when len === 1
        if (len === 1) {
          if (sub === '的') {
            matchedZh = sub
            matchedVi = ''
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
          matchedVi = matchedVi.replace(/(?:^|\s)đích$/i, '').trim()
        }
      }
      // Clean up leading "đích " from any dictionary match starting with 的
      if (matchedZh.startsWith('的') && source !== 'custom' && matchedZh.length > 1) {
        if (/^đích(?:$|\s+)/i.test(matchedVi)) {
          matchedVi = matchedVi.replace(/^đích(?:$|\s+)/i, '').trim()
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

    return tokens
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
