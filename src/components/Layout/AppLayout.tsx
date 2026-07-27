import { useState } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import Sidebar from '../Sidebar/Sidebar'
import Reader from '../Reader/Reader'
import './AppLayout.css'

export default function AppLayout() {
  const { sidebarOpen, setSidebarOpen, activeTab, setActiveTab, setCurrentView, setShowDictModal } = useUiStore()
  const { enableTranslate } = useReaderStore()
  const [menuExpanded, setMenuExpanded] = useState(false)

  const TABS = [
    { id: 'chapters', icon: 'ti-list', label: 'Danh sách chương', action: 'tab' },
    { id: 'read', icon: 'ti-text-size', label: 'Cài đặt giao diện', action: 'tab' },
    { id: 'tts', icon: 'ti-headphones', label: 'Nghe đọc TTS', action: 'tab' },
    ...(enableTranslate
      ? [
          { id: 'translate', icon: 'ti-language', label: 'Dịch thuật', action: 'tab' }
        ]
      : []),
    { id: 'dict', icon: 'ti-book-download', label: 'Quản lý Từ điển (VP / Names)', action: 'dict' },
    { id: 'detail', icon: 'ti-info-circle', label: 'Chi tiết truyện', action: 'view' },
    { id: 'library', icon: 'ti-books', label: 'Về thư viện', action: 'view' },
  ] as const

  const handleAction = (item: (typeof TABS)[number]) => {
    setMenuExpanded(false)
    if (item.action === 'tab') {
      setActiveTab(item.id as any)
      setSidebarOpen(true)
    } else if (item.action === 'dict') {
      setShowDictModal(true)
    } else if (item.id === 'detail') {
      setCurrentView('detail')
    } else if (item.id === 'library') {
      setCurrentView('library')
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar />

      <main className="main-reader">
        <Reader />
      </main>

      {/* Floating Menu Overlay backdrop when menu is expanded */}
      {menuExpanded && (
        <div className="floating-menu-backdrop" onClick={() => setMenuExpanded(false)} />
      )}

      {/* Floating Menu Widget */}
      <div className={`floating-menu-widget ${menuExpanded ? 'expanded' : ''}`}>
        <div className="fm-items-container">
          {TABS.map((item, idx) => {
            const isActive = sidebarOpen && activeTab === item.id
            return (
              <button
                key={item.id}
                className={`fm-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleAction(item)}
                title={item.label}
                aria-label={item.label}
                style={{ transitionDelay: `${menuExpanded ? idx * 0.03 : 0}s` }}
              >
                <i className={`ti ${item.icon}`} />
              </button>
            )
          })}
        </div>

        <button
          className="fm-trigger-btn"
          onClick={() => setMenuExpanded(!menuExpanded)}
          title={menuExpanded ? 'Đóng Menu' : 'Mở Menu'}
          aria-label={menuExpanded ? 'Đóng Menu' : 'Mở Menu'}
        >
          <i className={`ti ${menuExpanded ? 'ti-x' : 'ti-menu-2'}`} />
        </button>
      </div>
    </div>
  )
}

