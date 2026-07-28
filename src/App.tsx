import { useEffect } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import LibraryView from '@/components/Library/LibraryView'
import BookDetailView from '@/components/Library/BookDetailView'
import DictManagerModal from '@/components/Sidebar/DictManagerModal'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'
import { useTranslateStore } from '@/stores/useTranslateStore'

function App() {
  const globalDark = useSettingsStore((s) => s.settings.globalDark)
  const currentView = useUiStore((s) => s.currentView)
  const showDictModal = useUiStore((s) => s.showDictModal)
  const setShowDictModal = useUiStore((s) => s.setShowDictModal)

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
      {currentView === 'detail' && <BookDetailView />}
      {currentView === 'reader' && <AppLayout />}

      {showDictModal && <DictManagerModal onClose={() => setShowDictModal(false)} />}
    </>
  )
}

export default App
