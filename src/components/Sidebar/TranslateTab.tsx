import { useTranslateStore } from '@/stores/useTranslateStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { useUiStore } from '@/stores/useUiStore'
import { deleteSingleChapterCache, clearBookChapterCache } from '@/lib/vietphraseDb'
import type { TranslateMode } from '@/types'
import './TranslateTab.css'

export default function TranslateTab() {
  const {
    mode,
    setMode,
    applyDict,
    setApplyDict,
    activeCustomNames,
    removeUserCustomName,
    triggerRetranslate,
  } = useTranslateStore()

  const { bookTitle, currentChapter, clearChapterTranslation } = useReaderStore()
  const { setSidebarOpen } = useUiStore()

  const handleRetranslateChapter = async () => {
    if (bookTitle && typeof currentChapter === 'number' && currentChapter >= 0) {
      await deleteSingleChapterCache(bookTitle, currentChapter)
    }
    clearChapterTranslation(currentChapter)
    triggerRetranslate()
  }

  const handleRetranslateAll = async () => {
    if (bookTitle) {
      await clearBookChapterCache(bookTitle)
    }
    clearChapterTranslation()
    triggerRetranslate()
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* 1. Mode Group */}
      <div className="sp-section">
        <div className="sp-label">CHẾ ĐỘ DỊCH</div>
        <div className="trans-mode-group">
          {(['off', 'dual', 'replace'] as TranslateMode[]).map((m) => (
            <button
              key={m}
              className={`btn-ghost ${mode === m ? 'active' : ''}`}
              onClick={() => {
                setMode(m)
                if (window.innerWidth <= 600) setSidebarOpen(false)
              }}
            >
              {m === 'off' ? 'Tắt' : m === 'dual' ? 'Song ngữ' : 'Thay thế'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dictionary Toggle */}
      <div className="sp-section">
        <div className="sp-row">
          <label>Áp dụng Dịch & Từ điển</label>
          <input
            type="checkbox"
            className="toggle"
            checked={applyDict}
            onChange={(e) => setApplyDict(e.target.checked)}
          />
        </div>
      </div>

      {/* 3. Retranslate Chapter Actions */}
      <div className="sp-section" style={{ marginTop: '16px' }}>
        <div className="sp-label">DỊCH LẠI CHƯƠNG</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              fontWeight: 500,
            }}
            onClick={handleRetranslateChapter}
            title="Dịch lại chương hiện tại để áp dụng Name mới"
          >
            <i className="ti ti-refresh" />
            Dịch lại chương này (#{currentChapter + 1})
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              fontWeight: 500,
            }}
            onClick={handleRetranslateAll}
            title="Xóa bộ đệm dịch của toàn bộ truyện và dịch lại"
          >
            <i className="ti ti-refresh-dot" />
            Dịch lại toàn bộ truyện
          </button>
        </div>
      </div>

      {applyDict && (
        <div className="dict-manager" style={{ marginTop: 16 }}>
          <div className="sp-label">NAME RIÊNG ĐÃ LƯU ({activeCustomNames.length})</div>
          <div className="dict-list" style={{ marginTop: '8px' }}>
            {activeCustomNames.length === 0 ? (
              <div className="dict-empty">
                Chưa có Name riêng nào. Bạn bấm vào bất kỳ từ nào trong đoạn văn để sửa hoặc thêm Name.
              </div>
            ) : (
              activeCustomNames.map((entry) => (
                <div key={entry.key} className="dict-item">
                  <div className="dict-item-info">
                    <span className="dict-zh">{entry.zh}</span>
                    <span className="dict-arrow">→</span>
                    {entry.isBlacklist ? (
                      <span className="dict-vi" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>[Blacklist]</span>
                    ) : (
                      <span className="dict-vi">{entry.vi}</span>
                    )}
                    <span className="dict-scope-badge">
                      {entry.chapterIndex === 'global_all' ? 'Mọi truyện' : entry.chapterIndex === 'global' ? 'Toàn truyện' : `Chương ${(entry.chapterIndex as number) + 1}`}
                    </span>
                  </div>
                  <button
                    className="dict-del"
                    title="Xóa Name này"
                    onClick={() =>
                      removeUserCustomName(entry.key, bookTitle, currentChapter)
                    }
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
