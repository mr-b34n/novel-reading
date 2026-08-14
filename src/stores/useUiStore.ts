import { create } from 'zustand'

interface UiStore {
  currentView: 'library' | 'source' | 'detail' | 'reader'
  sidebarOpen: boolean
  activeTab: 'chapters' | 'read' | 'tts' | 'translate'
  selectedBookName: string
  showDictModal: boolean
  showSettingsModal: boolean

  setCurrentView: (view: UiStore['currentView']) => void
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  setActiveTab: (tab: UiStore['activeTab']) => void
  setSelectedBookName: (name: string) => void
  setShowDictModal: (v: boolean) => void
  setShowSettingsModal: (v: boolean) => void
}

export const useUiStore = create<UiStore>()((set) => ({
  currentView: 'library',
  sidebarOpen: false,
  activeTab: 'chapters',
  selectedBookName: '',
  showDictModal: false,
  showSettingsModal: false,

  setCurrentView: (v) => set({ currentView: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedBookName: (name) => set({ selectedBookName: name }),
  setShowDictModal: (v) => set({ showDictModal: v }),
  setShowSettingsModal: (v) => set({ showSettingsModal: v }),
}))
