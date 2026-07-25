import { useEffect } from 'react'
import AppLayout from '@/components/Layout/AppLayout'
import LibraryView from '@/components/Library/LibraryView'
import BookDetailView from '@/components/Library/BookDetailView'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

function App() {
  const globalDark = useSettingsStore((s) => s.settings.globalDark)
  const currentView = useUiStore((s) => s.currentView)

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
    </>
  )
}

export default App
