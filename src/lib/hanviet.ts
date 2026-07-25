import dict from './hanviet.json'

export const HAN_VIET_DIC: Record<string, string> = dict

export function convertohanviet(char: string): string {
  if (char <= ' ' || char === '\u3000') return ''
  return HAN_VIET_DIC[char] || char
}

export function convertohanviets(str: string): string {
  if (!str) return ''
  const result: string[] = []
  const len = str.length
  for (let i = 0; i < len; i++) {
    const ch = str[i]
    if (ch <= ' ' || ch === '\u3000') continue
    const hv = HAN_VIET_DIC[ch] || ch
    if (hv) {
      result.push(hv)
    }
  }
  return result.join(' ')
}

