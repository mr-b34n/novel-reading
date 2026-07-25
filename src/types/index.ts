export interface Book {
  name: string
  chapters: Chapter[]
  cover?: string
  isSangTacViet?: boolean
  enableTranslate?: boolean
  lastAccessed?: number
}

export interface Chapter {
  title: string
  content: string
  subtitle?: string
  isIntro?: boolean
  translatedTokens?: any[]
  translatedText?: string
}

export interface ReadSettings {
  font: string
  fontSize: number
  lineH: number
  paraSpace: number
  width: number
  bgColor: string
  textColor: string
  justify: boolean
  dropcap: boolean
  highlightTts: boolean
  globalDark: boolean
}

export interface TtsWord {
  text: string
  index: number
  pIdx: number
}

// ===================== TRANSLATE =====================
export type DictCategory = 'name' | 'place' | 'sect' | 'other' | 'all'
export type TranslateMode = 'off' | 'dual' | 'replace'

export interface DictEntry {
  id: string
  zh: string
  vi: string
  category?: DictCategory
  note?: string
}
