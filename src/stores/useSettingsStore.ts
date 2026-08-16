import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadSettings } from '@/types'

const DEFAULTS: ReadSettings = {
  font: 'Lora',
  fontSize: 17,
  lineH: 1.9,
  paraSpace: 1.2,
  width: 680,
  bgColor: '#faf7f2',
  textColor: '#1a1612',
  justify: false,
  dropcap: true,
  highlightTts: true,
  globalDark: false,
  swipeToChange: true,
  autoBlurCovers: true,
  blurIntensity: 14,
  unblurOnHover: true,
  unblurredNovels: [],
}

interface SettingsStore {
  settings: ReadSettings
  updateSettings: (partial: Partial<ReadSettings>) => void
  resetSettings: () => void
  isCoverBlurred: (idOrName?: string | null) => boolean
  toggleNovelBlur: (idOrName: string) => void
  setNovelBlur: (idOrName: string, shouldBlur: boolean) => void
  clearUnblurredNovels: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULTS,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      resetSettings: () => set({ settings: DEFAULTS }),
      isCoverBlurred: (idOrName) => {
        const { autoBlurCovers = true, unblurredNovels = [] } = get().settings
        if (!autoBlurCovers) return false
        if (!idOrName) return true
        const key = String(idOrName).trim().toLowerCase()
        return !unblurredNovels.some((n) => n.trim().toLowerCase() === key)
      },
      toggleNovelBlur: (idOrName) => {
        if (!idOrName) return
        const key = String(idOrName).trim()
        const keyLower = key.toLowerCase()
        const currentList = get().settings.unblurredNovels || []
        const isCurrentlyUnblurred = currentList.some((n) => n.trim().toLowerCase() === keyLower)
        
        if (isCurrentlyUnblurred) {
          // Re-enable blur by removing from unblurredNovels
          set((s) => ({
            settings: {
              ...s.settings,
              unblurredNovels: (s.settings.unblurredNovels || []).filter(
                (n) => n.trim().toLowerCase() !== keyLower
              ),
            },
          }))
        } else {
          // Disable blur for this novel by adding to unblurredNovels
          set((s) => ({
            settings: {
              ...s.settings,
              unblurredNovels: [...(s.settings.unblurredNovels || []), key],
            },
          }))
        }
      },
      setNovelBlur: (idOrName, shouldBlur) => {
        if (!idOrName) return
        const key = String(idOrName).trim()
        const keyLower = key.toLowerCase()
        if (shouldBlur) {
          // Remove from unblurredNovels
          set((s) => ({
            settings: {
              ...s.settings,
              unblurredNovels: (s.settings.unblurredNovels || []).filter(
                (n) => n.trim().toLowerCase() !== keyLower
              ),
            },
          }))
        } else {
          // Add to unblurredNovels if not exists
          const currentList = get().settings.unblurredNovels || []
          if (!currentList.some((n) => n.trim().toLowerCase() === keyLower)) {
            set((s) => ({
              settings: {
                ...s.settings,
                unblurredNovels: [...currentList, key],
              },
            }))
          }
        }
      },
      clearUnblurredNovels: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            unblurredNovels: [],
          },
        })),
    }),
    { name: 'novreader_settings' }
  )
)
