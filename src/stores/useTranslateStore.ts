import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useReaderStore } from './useReaderStore'
import type { TranslateMode } from '@/types'
import {
  importDictionaryFile,
  loadVietphraseMap,
  loadNamesMap,
  loadLuatNhanMap,
  loadPronounsMap,
  getCustomNamesForChapter,
  saveCustomName,
  deleteCustomName,
  getDbCounts,
  clearDbStore,
  clearChapterCache,
  clearBookChapterCache,
  type CustomNameEntry,
} from '@/lib/vietphraseDb'
import { translator, type TranslatedToken } from '@/lib/translator'

interface TranslateStore {
  mode: TranslateMode
  applyDict: boolean
  isDbLoaded: boolean

  // Progress state
  isImporting: boolean
  importProgress: number
  importStatus: string

  // Dictionaries statistics
  vpCount: number
  namesCount: number
  customCount: number
  luatNhanCount: number
  pronounsCount: number

  // Current chapter's active custom names
  activeCustomNames: CustomNameEntry[]

  // Selected word for popup editing
  selectedToken: TranslatedToken | null
  setSelectedToken: (token: TranslatedToken | null) => void

  // Retranslate trigger
  retranslateTrigger: number
  triggerRetranslate: () => void

  // Actions
  setMode: (mode: TranslateMode) => void
  setApplyDict: (v: boolean) => void

  initDb: () => Promise<void>
  importFile: (file: File, type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns') => Promise<void>
  clearStore: (type: 'vietphrase' | 'names' | 'custom' | 'luatnhan' | 'pronouns') => Promise<void>

  loadChapterNames: (bookTitle: string, chapterIndex: number | 'global' | 'global_all') => Promise<void>
  saveUserCustomName: (
    bookTitle: string,
    chapterIndex: number | 'global' | 'global_all',
    zh: string,
    vi: string,
    isBlacklist?: boolean
  ) => Promise<void>
  removeUserCustomName: (key: string, bookTitle: string, chapterIndex: number | 'global' | 'global_all') => Promise<void>
}

let initDbPromise: Promise<void> | null = null

export const useTranslateStore = create<TranslateStore>()(
  persist(
    (set, get) => ({
      mode: 'replace',
      applyDict: true,
      isDbLoaded: false,

      isImporting: false,
      importProgress: 0,
      importStatus: '',

      vpCount: 0,
      namesCount: 0,
      customCount: 0,
      luatNhanCount: 0,
      pronounsCount: 0,

      activeCustomNames: [],
      selectedToken: null,
      retranslateTrigger: 0,

      setSelectedToken: (token) => set({ selectedToken: token }),
      triggerRetranslate: () => set((s) => ({ retranslateTrigger: s.retranslateTrigger + 1 })),

      setMode: (mode) => set({ mode }),
      setApplyDict: (v) => set({ applyDict: v }),

      initDb: async () => {
        if (get().isDbLoaded) return
        if (initDbPromise) return initDbPromise

        initDbPromise = (async () => {
          try {
            const { vpCount, namesCount, customCount, luatNhanCount, pronounsCount } = await getDbCounts()
            set({ vpCount, namesCount, customCount, luatNhanCount, pronounsCount })

            if (vpCount > 0) {
              const vpMap = await loadVietphraseMap()
              translator.setVpMap(vpMap)
            }
            if (namesCount > 0) {
              const namesMap = await loadNamesMap()
              translator.setNamesMap(namesMap)
            }
            if (luatNhanCount > 0) {
              const luatNhanMap = await loadLuatNhanMap()
              translator.setLuatNhanRules(luatNhanMap)
            }
            if (pronounsCount > 0) {
              const pronounsMap = await loadPronounsMap()
              translator.setPronounsMap(pronounsMap)
            }

            set({ isDbLoaded: true })
          } catch (err) {
            console.error('Failed to initialize Vietphrase DB:', err)
          } finally {
            initDbPromise = null
          }
        })()

        return initDbPromise
      },

      importFile: async (file: File, type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns') => {
        set({
          isImporting: true,
          importProgress: 0,
          importStatus: `Đang đọc file ${file.name}...`,
        })

        try {
          const text = await file.text()
          set({ importStatus: 'Đang xử lý và lưu vào DB...' })

          const result = await importDictionaryFile(
            text,
            type,
            (percent, count) => {
              set({
                importProgress: percent,
                importStatus: `Đang xử lý (${percent}%) - Đã nạp ${count.toLocaleString()} từ`,
              })
            }
          )

          // Refresh memory map in translator
          if (type === 'vietphrase') {
            const vpMap = await loadVietphraseMap()
            translator.setVpMap(vpMap)
          } else if (type === 'names') {
            const namesMap = await loadNamesMap()
            translator.setNamesMap(namesMap)
          } else if (type === 'luatnhan') {
            const luatNhanMap = await loadLuatNhanMap()
            translator.setLuatNhanRules(luatNhanMap)
          } else if (type === 'pronouns') {
            const pronounsMap = await loadPronounsMap()
            translator.setPronounsMap(pronounsMap)
          }

          const counts = await getDbCounts()
          set({
            isImporting: false,
            importProgress: 100,
            importStatus: `Tải lên thành công! Đã thêm ${result.count.toLocaleString()} từ.`,
            vpCount: counts.vpCount,
            namesCount: counts.namesCount,
            customCount: counts.customCount,
            luatNhanCount: counts.luatNhanCount,
            pronounsCount: counts.pronounsCount,
          })
          useReaderStore.getState().clearChapterTranslation()
          get().triggerRetranslate()
        } catch (err) {
          console.error('Import dictionary error:', err)
          set({
            isImporting: false,
            importStatus: 'Có lỗi xảy ra khi đọc file. Vui lòng thử lại.',
          })
        }
      },

      clearStore: async (type) => {
        if (type === 'vietphrase') {
          translator.setVpMap({})
          set({ vpCount: 0 })
        }
        if (type === 'names') {
          translator.setNamesMap({})
          set({ namesCount: 0 })
        }
        if (type === 'luatnhan') {
          translator.setLuatNhanRules({})
          set({ luatNhanCount: 0 })
        }
        if (type === 'pronouns') {
          translator.setPronounsMap({})
          set({ pronounsCount: 0 })
        }
        if (type === 'custom') {
          translator.setCustomNames([])
          set({ activeCustomNames: [], customCount: 0 })
        }

        Promise.all([clearDbStore(type), clearChapterCache()])
          .then(async () => {
            const counts = await getDbCounts()
            set({
              vpCount: counts.vpCount,
              namesCount: counts.namesCount,
              customCount: counts.customCount,
              luatNhanCount: counts.luatNhanCount,
              pronounsCount: counts.pronounsCount,
            })
            useReaderStore.getState().clearChapterTranslation()
            get().triggerRetranslate()
          })
          .catch((err) => {
            console.error('Error clearing DB store:', err)
          })
      },

      loadChapterNames: async (bookTitle: string, chapterIndex: number | 'global' | 'global_all') => {
        if (!bookTitle) return
        const customEntries = await getCustomNamesForChapter(bookTitle, chapterIndex)
        translator.setCustomNames(customEntries)
        const prev = get().activeCustomNames
        if (
          prev.length !== customEntries.length ||
          !prev.every((e, idx) => e.key === customEntries[idx].key && e.vi === customEntries[idx].vi)
        ) {
          set({ activeCustomNames: customEntries })
        }
      },

      saveUserCustomName: async (bookTitle, chapterIndex, zh, vi, isBlacklist) => {
        if (!zh.trim() || !bookTitle) return
        // Allow empty vi if it's a blacklist
        if (!isBlacklist && !vi.trim()) return

        const cleanZh = zh.trim()
        const cleanVi = vi.trim()
        const key = `${bookTitle}::${chapterIndex}::${cleanZh}`

        const entry: CustomNameEntry = {
          key,
          bookTitle,
          chapterIndex,
          zh: cleanZh,
          vi: cleanVi,
          isBlacklist,
          createdAt: Date.now(),
        }

        const prev = get().activeCustomNames
        const filtered = prev.filter((item) => item.key !== key)
        const next = [...filtered, entry]
        translator.setCustomNames(next)
        set({ activeCustomNames: next, customCount: get().customCount + (filtered.length === prev.length ? 1 : 0) })

        await clearBookChapterCache(bookTitle)
        Promise.all([saveCustomName(entry)])
          .then(async () => {
            const currentCh = useReaderStore.getState().currentChapter
            const targetCh = typeof currentCh === 'number' && currentCh >= 0 ? currentCh : chapterIndex
            const customEntries = await getCustomNamesForChapter(bookTitle, targetCh)
            translator.setCustomNames(customEntries)
            set({ activeCustomNames: customEntries })
            const counts = await getDbCounts()
            set({ customCount: counts.customCount })
            useReaderStore.getState().clearChapterTranslation()
            get().triggerRetranslate()
          })
          .catch((err) => console.error('Error saving custom name:', err))
      },

      removeUserCustomName: async (key, bookTitle, chapterIndex) => {
        const prev = get().activeCustomNames
        const next = prev.filter((item) => item.key !== key)
        translator.setCustomNames(next)
        set({ activeCustomNames: next, customCount: Math.max(0, get().customCount - 1) })

        await clearBookChapterCache(bookTitle)
        Promise.all([deleteCustomName(key)])
          .then(async () => {
            const currentCh = useReaderStore.getState().currentChapter
            const targetCh = typeof currentCh === 'number' && currentCh >= 0 ? currentCh : chapterIndex
            const customEntries = await getCustomNamesForChapter(bookTitle, targetCh)
            translator.setCustomNames(customEntries)
            set({ activeCustomNames: customEntries })
            const counts = await getDbCounts()
            set({ customCount: counts.customCount })
            useReaderStore.getState().clearChapterTranslation()
            get().triggerRetranslate()
          })
          .catch((err) => console.error('Error removing custom name:', err))
      },
    }),
    {
      name: 'novreader_translate_v2',
      partialize: (s) => ({ mode: s.mode, applyDict: s.applyDict }),
    }
  )
)
