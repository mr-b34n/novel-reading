import { create } from 'zustand'
import type { Chapter, TtsWord } from '@/types'

interface ReaderStore {
  // Book
  chapters: Chapter[]
  bookTitle: string
  currentChapter: number
  chapterProgress: number
  enableTranslate: boolean

  // TTS runtime (not persisted)
  ttsActive: boolean
  ttsPlaying: boolean
  ttsCursor: number
  ttsWords: TtsWord[]
  ttsVoice: SpeechSynthesisVoice | null
  ttsRate: number

  // Actions
  setBook: (title: string, chapters: Chapter[], enableTranslate?: boolean) => void
  setCurrentChapter: (idx: number) => void
  setChapterProgress: (pct: number) => void
  setTtsActive: (v: boolean) => void
  setTtsPlaying: (v: boolean) => void
  setTtsCursor: (v: number) => void
  setTtsWords: (words: TtsWord[]) => void
  setTtsVoice: (v: SpeechSynthesisVoice | null) => void
  setTtsRate: (v: number) => void
  setChapterTranslation: (idx: number, tokens: any[], text?: string) => void
  clearChapterTranslation: (idx?: number) => void
  clearBook: () => void
}

export const useReaderStore = create<ReaderStore>()((set) => ({
  chapters: [],
  bookTitle: '',
  currentChapter: 0,
  chapterProgress: 0,
  enableTranslate: true,
  ttsActive: false,
  ttsPlaying: false,
  ttsCursor: 0,
  ttsWords: [],
  ttsVoice: null,
  ttsRate: 1,

  setBook: (title, chapters, enableTranslate = true) =>
    set({ bookTitle: title, chapters, currentChapter: 0, chapterProgress: 0, enableTranslate, ttsWords: [], ttsCursor: 0 }),
  setCurrentChapter: (idx) => set({ currentChapter: idx, chapterProgress: 0 }),
  setChapterProgress: (pct) => set({ chapterProgress: pct }),
  setTtsActive: (v) => set({ ttsActive: v }),
  setTtsPlaying: (v) => set({ ttsPlaying: v }),
  setTtsCursor: (v) => set({ ttsCursor: v }),
  setTtsWords: (words) => set({ ttsWords: words }),
  setTtsVoice: (v) => set({ ttsVoice: v }),
  setTtsRate: (v) => set({ ttsRate: v }),
  setChapterTranslation: (idx, tokens, text) =>
    set((state) => {
      if (!state.chapters[idx]) return state
      const next = [...state.chapters]
      next[idx] = { ...next[idx], translatedTokens: tokens, translatedText: text }
      return { chapters: next }
    }),
  clearChapterTranslation: (idx) =>
    set((state) => {
      if (typeof idx === 'number') {
        if (!state.chapters[idx]) return state
        const next = [...state.chapters]
        const { translatedTokens, translatedText, ...rest } = next[idx]
        next[idx] = rest
        return { chapters: next }
      } else {
        const next = state.chapters.map((ch) => {
          const { translatedTokens, translatedText, ...rest } = ch
          return rest
        })
        return { chapters: next }
      }
    }),
  clearBook: () =>
    set({ chapters: [], bookTitle: '', currentChapter: 0, chapterProgress: 0, enableTranslate: true, ttsWords: [], ttsCursor: 0 }),
}))
