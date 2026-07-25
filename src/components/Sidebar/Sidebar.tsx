import { useEffect } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import ChapterTab from './ChapterTab'
import ReadTab from './ReadTab'
import TtsTab from './TtsTab'
import TranslateTab from './TranslateTab'
import './Sidebar.css'

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeTab, setActiveTab } = useUiStore()
  const { bookTitle, chapters, enableTranslate } = useReaderStore()

  useEffect(() => {
    if (!enableTranslate && activeTab === 'translate') {
      setActiveTab('chapters')
    }
  }, [enableTranslate, activeTab, setActiveTab])

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <div className="sh-title-wrap">
          <h2 className="book-title">{bookTitle || 'Chưa chọn sách'}</h2>
          <div className="book-info">{chapters.length} chương</div>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          title="Đóng bảng điều khiển"
        >
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="sidebar-body">
        {/* Content Pane */}
        {sidebarOpen && (
          <div className="sb-content">
            {activeTab === 'chapters' && (
              <div className="sb-pane active">
                <ChapterTab />
              </div>
            )}
            {activeTab === 'read' && (
              <div className="sb-pane active">
                <ReadTab />
              </div>
            )}
            {activeTab === 'tts' && (
              <div className="sb-pane active">
                <TtsTab />
              </div>
            )}
            {enableTranslate && activeTab === 'translate' && (
              <div className="sb-pane active">
                <TranslateTab />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
