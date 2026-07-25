import React, { useState, useEffect, useRef } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { getAllBooks, saveBook } from '@/lib/db'
import { parseTxt } from '@/lib/parser'
import { translator } from '@/lib/translator'
import type { Book, Chapter } from '@/types'
import './LibraryView.css'

// Helper for deterministic fallback cover gradient themes
const COVER_THEMES = [
  { bg: 'linear-gradient(135deg, #2c1810 0%, #8b4513 100%)', text: '#f4ecd8', accent: '#c9a96e' },
  { bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', text: '#e0f7fa', accent: '#80deea' },
  { bg: 'linear-gradient(135deg, #192a56 0%, #273c75 100%)', text: '#f5f6fa', accent: '#fbc531' },
  { bg: 'linear-gradient(135deg, #1e3799 0%, #0c2461 100%)', text: '#f8c291', accent: '#ea8685' },
  { bg: 'linear-gradient(135deg, #130f40 0%, #30336b 100%)', text: '#dff9fb', accent: '#ffbe76' },
  { bg: 'linear-gradient(135deg, #218c74 0%, #104e43 100%)', text: '#f1f2f6', accent: '#f8a5c2' },
]

function getCoverTheme(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COVER_THEMES.length
  return COVER_THEMES[index]
}

interface PendingUpload {
  name: string
  chapters: Chapter[]
  enableTranslate: boolean
}

export default function LibraryView() {
  const { setCurrentView, setSelectedBookName } = useUiStore()
  const { setBook } = useReaderStore()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadLibrary()
  }, [])

  const loadLibrary = async () => {
    const list = await getAllBooks()
    list.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
    setBooks(list)
  }

  const openBookDetail = (name: string) => {
    setSelectedBookName(name)
    setCurrentView('detail')
  }

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setErrorMsg('Vui lòng chọn file định dạng .txt')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const chapters = parseTxt(content)
        if (!chapters || chapters.length === 0) {
          setErrorMsg('Không tìm thấy chương nào trong file. Vui lòng kiểm tra lại cấu trúc file .txt.')
          setLoading(false)
          return
        }

        const defaultTitle = file.name.replace(/\.txt$/i, '').trim()
        
        // Auto-detect if file contains Chinese characters or Chinese keywords
        const containsChinese = /[\u4e00-\u9fa5]/.test(content.slice(0, 3000))

        setPendingUpload({
          name: defaultTitle,
          chapters,
          enableTranslate: containsChinese, // default checked if Chinese detected
        })
      } catch (err) {
        console.error(err)
        setErrorMsg('Có lỗi xảy ra khi xử lý file truyện.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmUpload = async () => {
    if (!pendingUpload || !pendingUpload.name.trim()) return

    try {
      let finalBookName = pendingUpload.name.trim()
      let finalChapters = pendingUpload.chapters

      if (pendingUpload.enableTranslate) {
        // Automatically translate book title and chapter titles
        const translatedName = translator.translateText(finalBookName)
        if (translatedName) finalBookName = translatedName

        finalChapters = pendingUpload.chapters.map((ch) => ({
          ...ch,
          title: translator.translateText(ch.title) || ch.title,
        }))
      }

      const newBook: Book = {
        name: finalBookName,
        chapters: finalChapters,
        enableTranslate: pendingUpload.enableTranslate,
        lastAccessed: Date.now(),
      }

      await saveBook(newBook)
      await loadLibrary()

      setBook(newBook.name, newBook.chapters, newBook.enableTranslate)
      setSelectedBookName(newBook.name)
      setPendingUpload(null)
      setCurrentView('detail')
    } catch (err) {
      console.error(err)
      setErrorMsg('Không thể lưu truyện vào thư viện. Tên truyện có thể đã tồn tại hoặc lỗi bộ nhớ.')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleProcessFile(file)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleProcessFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const filteredBooks = books.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSavedProgress = (bookName: string, totalChapters: number) => {
    const savedPos = localStorage.getItem('novreader_pos_' + bookName)
    if (savedPos !== null) {
      const idx = parseInt(savedPos, 10)
      if (!isNaN(idx)) {
        return `Đã đọc Ch. ${idx + 1}/${totalChapters}`
      }
    }
    return `${totalChapters} chương`
  }

  return (
    <div
      className={`library-view ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="lib-header">
        <div className="lib-header-inner">
          <div className="lib-brand">
            <i className="ti ti-books lib-brand-icon" />
            <h1 className="lib-title">Thư Viện Truyện</h1>
          </div>

          <div className="lib-header-actions">
            {books.length > 0 && (
              <div className="lib-search-box">
                <i className="ti ti-search" />
                <input
                  type="text"
                  placeholder="Tìm kiếm truyện..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                    ×
                  </button>
                )}
              </div>
            )}

            <button
              className="btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 600,
                border: '1px solid var(--paper3)',
                background: 'var(--paper2)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
              onClick={() => useUiStore.getState().setShowDictModal(true)}
              title="Quản lý & Nhập dữ liệu từ điển VietPhrase / Names"
            >
              <i className="ti ti-book-download" /> Từ Điển (VP/Name)
            </button>

            <button
              className="btn-primary lib-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <i className="ti ti-upload" /> {loading ? 'Đang đọc file...' : 'Tải sách (.txt)'}
            </button>
            <input
              type="file"
              accept=".txt"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        </div>
      </header>

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-box">
            <i className="ti ti-file-import" />
            <p>Thả file .txt vào đây để thêm truyện mới</p>
          </div>
        </div>
      )}

      <main className="lib-main">
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><i className="ti ti-alert-circle" /> {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
        )}
        {books.length === 0 ? (
          <div className="lib-empty-container">
            <div
              className="lib-empty-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon-wrap">
                <i className="ti ti-cloud-upload" />
              </div>
              <h3>Thư viện hiện chưa có truyện</h3>
              <p>Kéo & thả file .txt vào đây hoặc bấm để chọn từ thiết bị</p>
              <span className="dropzone-badge">Hỗ trợ file .txt mã hóa UTF-8</span>
            </div>
          </div>
        ) : (
          <div className="lib-grid">
            {filteredBooks.map((book) => {
              const theme = getCoverTheme(book.name)
              const progressText = getSavedProgress(book.name, book.chapters.length)

              return (
                <div
                  key={book.name}
                  className="lib-card"
                  onClick={() => openBookDetail(book.name)}
                >
                  <div className="lib-cover">
                    {book.cover ? (
                      <img src={book.cover} alt={book.name} loading="lazy" />
                    ) : (
                      <div
                        className="lib-cover-fallback"
                        style={{ background: theme.bg, color: theme.text }}
                      >
                        <div className="fc-border" style={{ borderColor: theme.accent }}>
                          <span className="fc-ornament" style={{ color: theme.accent }}>
                            ❦
                          </span>
                          <span className="fc-title">{book.name}</span>
                          <span className="fc-chapter-badge" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: theme.accent }}>
                            {book.chapters.length} chương
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lib-info">
                    <h3 className="lib-book-title" title={book.name}>
                      {book.name}
                    </h3>
                    <p className="lib-book-meta">{progressText}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Upload Setup Modal */}
      {pendingUpload && (
        <div className="upload-modal-overlay" onClick={() => setPendingUpload(null)}>
          <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="um-header">
              <i className="ti ti-book" />
              <h2>Thêm truyện mới vào thư viện</h2>
            </div>

            <div className="um-body">
              <div className="um-field">
                <label>Tên truyện:</label>
                <input
                  type="text"
                  value={pendingUpload.name}
                  onChange={(e) => setPendingUpload({ ...pendingUpload, name: e.target.value })}
                />
              </div>

              <div className="um-stats">
                <i className="ti ti-list-numbered" /> Phát hiện{' '}
                <strong>{pendingUpload.chapters.length} chương</strong>
              </div>

              <div className="um-option-box">
                <label className="um-checkbox-label">
                  <input
                    type="checkbox"
                    checked={pendingUpload.enableTranslate}
                    onChange={(e) =>
                      setPendingUpload({ ...pendingUpload, enableTranslate: e.target.checked })
                    }
                  />
                  <div className="um-cb-text">
                    <strong>Là truyện dịch / Convert (Bật công cụ Dịch thuật)</strong>
                    <span>
                      Bật nếu đây là truyện tiếng Trung / Convert cần dịch. Nếu tắt, văn bản hiển thị như truyện thường (không tách từng chữ) và ẩn các tính năng dịch.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="um-footer">
              <button className="btn-ghost" onClick={() => setPendingUpload(null)}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleConfirmUpload}>
                <i className="ti ti-check" /> Thêm vào thư viện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
