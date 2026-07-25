import { useState, useMemo } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { useUiStore } from '@/stores/useUiStore'
import { isIntroChapter } from '@/lib/parser'
import { formatCleanChapterTitle } from '@/lib/chineseNumerals'

export default function ChapterTab() {
  const { chapters, currentChapter, setCurrentChapter } = useReaderStore()
  const { setSidebarOpen } = useUiStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(() => Math.max(150, currentChapter + 50))

  const filtered = useMemo(() => {
    return chapters
      .map((ch, index) => ({ ch, index }))
      .filter(({ ch, index }) => {
        if (!searchTerm.trim()) return true
        const term = searchTerm.toLowerCase()
        const cleanTitle = formatCleanChapterTitle(ch.title, index)
        return (
          cleanTitle.toLowerCase().includes(term) ||
          ch.title.toLowerCase().includes(term) ||
          (index + 1).toString() === term
        )
      })
  }, [chapters, searchTerm])

  if (chapters.length === 0) {
    return (
      <div className="chapter-empty">
        <i className="ti ti-book-off" />
        <p>Chưa chọn tác phẩm nào</p>
      </div>
    )
  }

  const displayed = filtered.slice(0, visibleCount)

  return (
    <div className="chapter-tab-wrap">
      {/* Search Header */}
      <div className="chapter-search-box">
        <i className="ti ti-search search-icon" />
        <input
          type="text"
          placeholder="Tìm tên hoặc số chương..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setVisibleCount(150)
          }}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => { setSearchTerm(''); setVisibleCount(Math.max(150, currentChapter + 50)); }}>
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {/* Chapter Cards List */}
      <div className="chapter-list">
        {displayed.length === 0 ? (
          <div className="chapter-no-match">
            <i className="ti ti-search-off" />
            <span>Không tìm thấy chương phù hợp</span>
          </div>
        ) : (
          <>
            {displayed.map(({ ch, index }) => {
              const isActive = index === currentChapter
              const isIntro = isIntroChapter(ch)
              const cleanTitle = isIntro ? 'Giới thiệu' : formatCleanChapterTitle(ch.title, index)

              return (
                <button
                  key={index}
                  className={`chapter-item-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentChapter(index)
                    setSidebarOpen(false)
                  }}
                >
                  <span className="ch-index">#{index + 1}</span>
                  <span className="ch-name">
                    {cleanTitle}
                    {ch.translatedTokens && (
                      <span title="Đã lưu bản dịch" style={{ marginLeft: 6, color: 'var(--gold2)', fontSize: '0.8em' }}>
                        <i className="ti ti-check" />
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="ch-active-badge">
                      <i className="ti ti-bookmark-filled" /> Đang đọc
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length > visibleCount && (
              <button
                className="btn-ghost"
                style={{ width: '100%', marginTop: 12, marginBottom: 12, padding: '10px 0', border: '1px dashed var(--paper3)', color: 'var(--gold)' }}
                onClick={() => setVisibleCount((prev) => prev + 150)}
              >
                Xem thêm 150 chương tiếp theo (Còn {filtered.length - visibleCount} chương)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

