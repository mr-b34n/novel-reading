import React, { useState, useEffect, useRef } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { useTranslateStore } from '@/stores/useTranslateStore'
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
  intro?: string
  enableTranslate: boolean
  nameOption: 'edit' | 'translate' | 'none'
  setFirstAsIntro?: boolean
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

    // Requirement 7: check VP database before importing book
    await useTranslateStore.getState().initDb()
    if (useTranslateStore.getState().vpCount === 0) {
      alert('Vui lòng nhập từ điển VietPhrase (VP) trước khi thêm truyện để hệ thống có thể hỗ trợ dịch thuật!')
      useUiStore.getState().setShowDictModal(true)
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const parsed = parseTxt(content)
        if (!parsed.chapters || parsed.chapters.length === 0) {
          setErrorMsg('Không tìm thấy chương nào trong file. Vui lòng kiểm tra lại cấu trúc file .txt.')
          setLoading(false)
          return
        }

        const defaultTitle = file.name.replace(/\.txt$/i, '').trim()
        
        // Auto-detect if file contains Chinese characters or Chinese keywords
        const containsChinese = /[\u4e00-\u9fa5]/.test(content.slice(0, 3000)) || /[\u4e00-\u9fa5]/.test(defaultTitle)
        let suggestedTitle = defaultTitle
        if (containsChinese) {
          await useTranslateStore.getState().initDb()
          const translated = translator.translateText(defaultTitle)
          if (translated) suggestedTitle = translated
        }

        setPendingUpload({
          name: suggestedTitle,
          chapters: parsed.chapters,
          intro: parsed.intro,
          enableTranslate: containsChinese, // default checked if Chinese detected
          nameOption: containsChinese ? 'translate' : 'edit',
          setFirstAsIntro: false
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
      let finalIntro = pendingUpload.intro

      if (pendingUpload.enableTranslate) {
        await useTranslateStore.getState().initDb()

        const translatedName = translator.translateText(finalBookName)
        if (translatedName && (translatedName !== finalBookName || /[\u4e00-\u9fa5]/.test(finalBookName))) {
          finalBookName = translatedName
        }

        if (finalIntro) {
          finalIntro = translator.translateText(finalIntro)
        }

        finalChapters = pendingUpload.chapters.map((ch) => ({
          ...ch,
          title: translator.translateText(ch.title) || ch.title,
        }))
      }

      if (pendingUpload.setFirstAsIntro && finalChapters.length > 0) {
        finalChapters = finalChapters.map((ch, idx) =>
          idx === 0 ? { ...ch, isIntro: true, customNumber: '0' } : ch
        )
      }

      const newBook: Book = {
        name: finalBookName,
        chapters: finalChapters,
        intro: finalIntro,
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
              className="btn-ghost lib-dict-btn"
              onClick={() => useUiStore.getState().setShowDictModal(true)}
              title="Quản lý & Nhập dữ liệu từ điển VietPhrase / Names"
            >
              <i className="ti ti-book-download" /> <span className="hide-mobile">Từ Điển</span>
            </button>

            <button
              className="btn-primary lib-upload-btn"
              onClick={async () => {
                await useTranslateStore.getState().initDb()
                if (useTranslateStore.getState().vpCount === 0) {
                  alert('Vui lòng nhập từ điển VietPhrase (VP) trước khi thêm truyện để hệ thống có thể dịch thuật!')
                  useUiStore.getState().setShowDictModal(true)
                  return
                }
                fileInputRef.current?.click()
              }}
              disabled={loading}
              title="Tải sách (.txt)"
            >
              <i className="ti ti-upload" /> <span className="hide-mobile">{loading ? 'Đang đọc...' : 'Tải sách'}</span>
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={pendingUpload.name}
                    onChange={(e) => setPendingUpload({ ...pendingUpload, name: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {pendingUpload.enableTranslate && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ border: '1px solid var(--gold)', color: 'var(--gold)', padding: '8px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}
                      onClick={async () => {
                        await useTranslateStore.getState().initDb()
                        const translated = translator.translateText(pendingUpload.name)
                        if (translated) setPendingUpload({ ...pendingUpload, name: translated })
                      }}
                      title="Dịch tên truyện sang Tiếng Việt"
                    >
                      <i className="ti ti-language" /> Dịch tên
                    </button>
                  )}
                </div>
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
                    <strong>Bật chế độ Dịch thuật (Truyện Convert / Tiếng Trung)</strong>
                  </div>
                </label>
              </div>

              {pendingUpload.chapters.length > 0 && (
                <div className="um-intro-preview-box" style={{ background: 'var(--paper2)', border: '1px solid var(--paper3)', padding: '10px 12px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--ink)' }}>
                    <input
                      type="checkbox"
                      checked={pendingUpload.setFirstAsIntro || false}
                      onChange={(e) => setPendingUpload({ ...pendingUpload, setFirstAsIntro: e.target.checked })}
                    />
                    <span>Đặt chương đầu làm Chương 0 (Lời tựa / Giới thiệu)</span>
                  </label>
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: 'var(--paper)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--ink2)', maxHeight: '70px', overflowY: 'auto', borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--gold2)' }}>
                      Xem trước ({pendingUpload.chapters[0].title || 'Chương đầu'}):
                    </div>
                    {pendingUpload.chapters[0].content.slice(0, 150)}...
                  </div>
                </div>
              )}
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
