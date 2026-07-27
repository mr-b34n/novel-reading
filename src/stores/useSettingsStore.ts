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
}

interface SettingsStore {
  settings: ReadSettings
  updateSettings: (partial: Partial<ReadSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      resetSettings: () => set({ settings: DEFAULTS }),
    }),
    { name: 'novreader_settings' }
  )
)
