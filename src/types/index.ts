export interface Book {
  name: string
  chapters: Chapter[]
  intro?: string
  cover?: string
  isSangTacViet?: boolean
  enableTranslate?: boolean
  lastAccessed?: number
  source?: string
  aliceNovelId?: string
}

export interface Chapter {
  title: string
  content: string
  subtitle?: string
  isIntro?: boolean
  customNumber?: string
  translatedTokens?: any[]
  translatedText?: string
  sourceUrl?: string
  isLoading?: boolean
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
  swipeToChange: boolean
  autoBlurCovers?: boolean
  blurIntensity?: number
  unblurOnHover?: boolean
  unblurredNovels?: string[]
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

// ===================== ALICE SOURCE =====================
export interface AliceNovelItem {
  id: string
  title: string
  author: string
  cover: string
  category: string
  wordCount?: string
  views?: string
  status?: string
  latestChapter?: string
  latestChapterUrl?: string
  updateTime?: string
  intro?: string
  tags?: string[]
  url: string
}

export interface AliceCategory {
  id: string
  name: string
  url: string
}

export interface AliceNovelDetail extends AliceNovelItem {
  bookmarks?: string
  totalChapters?: number
  fullIntro: string
  chaptersUrl?: string
  recentChapters: {
    title: string
    url: string
    time?: string
  }[]
}

