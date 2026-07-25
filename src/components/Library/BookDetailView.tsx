import { useEffect, useState } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { loadBook, deleteBook } from '@/lib/db'
import { isIntroChapter } from '@/lib/parser'
import { parseChapterTitle, formatCleanChapterTitle } from '@/lib/chineseNumerals'
import type { Book } from '@/types'
import './BookDetailView.css'

export default function BookDetailView() {
  const { selectedBookName, setCurrentView } = useUiStore()
  const { setBook, bookTitle: currentBookTitle, clearBook, setCurrentChapter } = useReaderStore()

  const [book, setBookData] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [chapterSearch, setChapterSearch] = useState('')
  const [savedChapterIdx, setSavedChapterIdx] = useState<number>(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (selectedBookName) {
      setLoading(true)
      loadBook(selectedBookName).then((b) => {
        if (b) {
          setBookData(b)
          // Get saved position from localStorage
          const savedPos = localStorage.getItem('novreader_pos_' + b.name)
          if (savedPos !== null) {
            const idx = parseInt(savedPos, 10)
            if (!isNaN(idx) && idx >= 0 && idx < b.chapters.length) {
              setSavedChapterIdx(idx)
            }
          }
        } else {
          setCurrentView('library')
        }
        setLoading(false)
      })
    } else {
      setCurrentView('library')
    }
  }, [selectedBookName, setCurrentView])

  if (loading || !book) {
    return (
      <div className="book-detail-loading">
        <i className="ti ti-loader animate-spin" />
        <p>Đang tải thông tin truyện...</p>
      </div>
    )
  }

  const handleStartRead = (chapterIndex: number = savedChapterIdx) => {
    setBook(book.name, book.chapters, book.enableTranslate ?? true)
    setCurrentChapter(chapterIndex)
    setCurrentView('reader')
  }

  const confirmDelete = async () => {
    try {
      await deleteBook(book.name)
      if (currentBookTitle === book.name) {
        clearBook()
      }
      setShowDeleteModal(false)
      setCurrentView('library')
    } catch (err) {
      console.error(err)
      alert('Không thể xóa truyện. Vui lòng thử lại.')
    }
  }

  // Find intro chapter & content
  const introChapter = book.chapters.find((ch) => isIntroChapter(ch) || ch.title.toLowerCase().includes('giới thiệu'))
  const introContent = introChapter
    ? introChapter.content
    : (book.chapters[0]?.content || '')

  // Exclude intro chapter from the main chapter grid if there are other chapters
  const actualChapters = book.chapters.filter((ch) => !isIntroChapter(ch))
  const chapterListToDisplay = actualChapters.length > 0 ? actualChapters : book.chapters

  const filteredChapters = chapterListToDisplay.filter((ch, i) => {
    if (!chapterSearch.trim()) return true
    const title = parseChapterTitle(ch.title) || ch.title
    const search = chapterSearch.toLowerCase()
    return title.toLowerCase().includes(search) || (i + 1).toString() === search
  })

  return (
    <div className="book-detail-view">
      {/* Header Bar */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <button className="btn-ghost bd-back-btn" onClick={() => setCurrentView('library')}>
            <i className="ti ti-arrow-left" /> Thư viện
          </button>
          <h2 className="bd-header-title">{book.name}</h2>
          <div className="bd-header-placeholder" />
        </div>
      </header>

      <main className="bd-main">
        {/* Top Hero Section */}
        <div className="bd-hero">
          <div className="bd-cover-wrap">
            {book.cover ? (
              <img src={book.cover} alt={book.name} className="bd-cover-img" />
            ) : (
              <div className="bd-cover-fallback">
                <div className="bd-fb-border">
                  <span className="bd-fb-ornament">❦</span>
                  <span className="bd-fb-title">{book.name}</span>
                  <span className="bd-fb-badge">{book.chapters.length} chương</span>
                </div>
              </div>
            )}
          </div>

          <div className="bd-info">
            <h1 className="bd-title">{book.name}</h1>

            <div className="bd-badges">
              <span className="bd-badge">
                <i className="ti ti-list-numbered" /> {book.chapters.length} chương
              </span>
              <span className="bd-badge">
                <i className="ti ti-bookmark" />{' '}
                {savedChapterIdx > 0
                  ? `Đang đọc Ch. ${savedChapterIdx + 1}`
                  : 'Chưa đọc'}
              </span>
              {book.enableTranslate && (
                <span className="bd-badge" title="Truyện có bật tính năng Dịch thuật">
                  <i className="ti ti-language" /> Truyện dịch
                </span>
              )}
            </div>

            <div className="bd-intro-box">
              <h3>
                <i className="ti ti-file-text" /> Giới thiệu nội dung
              </h3>
              <div className="bd-intro-text">
                {introContent || 'Không có đoạn giới thiệu.'}
              </div>
            </div>

            <div className="bd-actions">
              <button className="btn-primary bd-btn-read" onClick={() => handleStartRead(savedChapterIdx)}>
                <i className="ti ti-player-play-filled" />{' '}
                {savedChapterIdx > 0 ? `Đọc tiếp (Chương ${savedChapterIdx + 1})` : 'Đọc từ đầu'}
              </button>

              {savedChapterIdx > 0 && (
                <button className="btn-ghost" onClick={() => handleStartRead(0)}>
                  <i className="ti ti-rotate-clockwise" /> Đọc từ đầu
                </button>
              )}

              <button className="btn-ghost bd-btn-delete" onClick={() => setShowDeleteModal(true)}>
                <i className="ti ti-trash" /> Xóa truyện
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <section className="bd-chapters-section">
          <div className="bd-chapters-header">
            <h3>Danh sách chương ({chapterListToDisplay.length})</h3>
            <div className="bd-chapter-search">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Tìm tên chương hoặc số..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
              />
              {chapterSearch && (
                <button onClick={() => setChapterSearch('')}>×</button>
              )}
            </div>
          </div>

          <div className="bd-chapters-grid">
            {filteredChapters.length === 0 ? (
              <div className="bd-empty-search">Không tìm thấy chương nào phù hợp.</div>
            ) : (
              filteredChapters.map((ch) => {
                const realIdx = book.chapters.indexOf(ch)
                const isCurrent = realIdx === savedChapterIdx
                const cleanTitle = formatCleanChapterTitle(ch.title, realIdx)

                return (
                  <div
                    key={realIdx}
                    className={`bd-chapter-card ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleStartRead(realIdx)}
                  >
                    <span className="ch-num">#{realIdx + 1}</span>
                    <span className="ch-title">{cleanTitle}</span>
                    {isCurrent && <span className="ch-tag">Vị trí đọc</span>}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="bd-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="bd-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="bd-modal-icon">
              <i className="ti ti-alert-triangle" />
            </div>
            <h3>Xóa truyện khỏi thiết bị?</h3>
            <p>
              Bạn có chắc chắn muốn xóa truyện <strong>"{book.name}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="bd-modal-actions">
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </button>
              <button className="btn-primary bd-btn-danger" onClick={confirmDelete}>
                <i className="ti ti-trash" /> Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
