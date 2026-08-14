import { useEffect } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import LibraryView from '@/components/Library/LibraryView'
import BookDetailView from '@/components/Library/BookDetailView'
import AliceSourceView from '@/components/Source/AliceSourceView'
import DictManagerModal from '@/components/Sidebar/DictManagerModal'
import SettingsModal from '@/components/Common/SettingsModal'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'
import { useTranslateStore } from '@/stores/useTranslateStore'

function App() {
  const globalDark = useSettingsStore((s) => s.settings.globalDark)
  const currentView = useUiStore((s) => s.currentView)
  const showDictModal = useUiStore((s) => s.showDictModal)
  const setShowDictModal = useUiStore((s) => s.setShowDictModal)
  const showSettingsModal = useUiStore((s) => s.showSettingsModal)
  const setShowSettingsModal = useUiStore((s) => s.setShowSettingsModal)

  useEffect(() => {
    useTranslateStore.getState().initDb()
  }, [])

  useEffect(() => {
    if (globalDark) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [globalDark])

  return (
    <>
      {currentView === 'library' && <LibraryView />}
      {currentView === 'source' && <AliceSourceView />}
      {currentView === 'detail' && <BookDetailView />}
      {currentView === 'reader' && <AppLayout />}

      {showDictModal && <DictManagerModal onClose={() => setShowDictModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </>
  )
}

export default App
