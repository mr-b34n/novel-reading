import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useUiStore } from '@/stores/useUiStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { useTranslateStore } from '@/stores/useTranslateStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import NovelCover from '@/components/Common/NovelCover'
import {
  fetchAliceHome,
  fetchAliceCategory,
  fetchAliceRank,
  searchAlice,
  fetchAliceNovel,
  fetchAliceChapters,
  fetchAliceChapterContent,
  translateNovelItem,
  translateNovelDetail,
  translateCategory,
  type HomeResponse,
  type TranslatedNovelItem,
  type TranslatedNovelDetail,
  type AliceChapterItem,
} from '@/lib/aliceswApi'
import { translator } from '@/lib/translator'
import { saveBook, loadBook } from '@/lib/db'
import type { Book, Chapter, AliceCategory } from '@/types'
import './AliceSourceView.css'

export default function AliceSourceView() {
  const { setCurrentView, setShowDictModal, setShowSettingsModal } = useUiStore()
  const { isDbLoaded, vpCount } = useTranslateStore()
  const { isCoverBlurred, toggleNovelBlur } = useSettingsStore()

  // Main Tabs: 'home' | 'category' | 'rank' | 'search'
  const [navTab, setNavTab] = useState<'home' | 'category' | 'rank' | 'search'>('home')

  // Category view state
  const [selectedCatId, setSelectedCatId] = useState<string>('64')
  const [catOrder, setCatOrder] = useState<string>('update_time+desc')
  const [catPage, setCatPage] = useState<number>(1)
  const [categoryData, setCategoryData] = useState<{
    title: string
    novels: TranslatedNovelItem[]
    page: number
    totalPage?: number
  } | null>(null)

  // Ranking view state
  const [selectedRankType, setSelectedRankType] = useState<string>('hits_day')
  const [rankData, setRankData] = useState<{ title: string; novels: TranslatedNovelItem[] } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'_all' | 'title' | 'author' | 'tag'>('_all')
  const [searchData, setSearchData] = useState<{ query: string; novels: TranslatedNovelItem[] } | null>(null)

  // Display translation mode
  const [translateMode, setTranslateMode] = useState<'vi' | 'bilingual' | 'zh'>('vi')

  // Homepage data
  const [homeData, setHomeData] = useState<HomeResponse | null>(null)

  // Loading & Error states
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Detail Modal State
  const [selectedNovel, setSelectedNovel] = useState<TranslatedNovelDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalTab, setModalTab] = useState<'info' | 'chapters'>('info')
  const [introTab, setIntroTab] = useState<'vi' | 'zh'>('vi')

  // Chapters list for detail modal
  const [chaptersList, setChaptersList] = useState<AliceChapterItem[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [chapterSearchKeyword, setChapterSearchKeyword] = useState('')

  // Batch Download State
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; percent: number } | null>(null)
  const cancelDownloadRef = useRef(false)

  // Local storage bookmarks set
  const [savedBooksSet, setSavedBooksSet] = useState<Set<string>>(new Set())
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Reading launch state
  const [launchingChapter, setLaunchingChapter] = useState(false)

  // Load home data on mount
  useEffect(() => {
    loadHome()
  }, [])

  // Auto-init translate DB if not yet loaded
  useEffect(() => {
    if (!isDbLoaded) {
      useTranslateStore.getState().initDb()
    }
  }, [isDbLoaded])

  const loadHome = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchAliceHome()
      setHomeData(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Không thể tải dữ liệu từ AliceSW. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCategory = async (catId: string, order: string = catOrder, page: number = 1) => {
    setSelectedCatId(catId)
    setCatOrder(order)
    setCatPage(page)
    setNavTab('category')
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetchAliceCategory(catId, order, page)
      const translatedNovels = res.novels.map(translateNovelItem)
      setCategoryData({
        title: res.title,
        novels: translatedNovels,
        page: res.page || page,
        totalPage: res.totalPage,
      })
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Không thể tải danh sách thể loại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRank = async (type: string) => {
    setSelectedRankType(type)
    setNavTab('rank')
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetchAliceRank(type, 1)
      const translatedNovels = res.novels.map(translateNovelItem)
      setRankData({
        title: res.title,
        novels: translatedNovels,
      })
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Không thể tải bảng xếp hạng.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return

    // If user pasted a direct novel URL or ID like https://www.alicesw.com/novel/33927.html or 33927
    const novelMatch = q.match(/novel\/(\d+)/) || q.match(/id\/(\d+)/) || q.match(/^(\d+)$/)
    if (novelMatch) {
      const id = novelMatch[1]
      handleOpenDetail(id)
      return
    }

    setNavTab('search')
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await searchAlice(q, searchType, 1)
      const translatedNovels = res.novels.map(translateNovelItem)
      setSearchData({
        query: q,
        novels: translatedNovels,
      })
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Không thể tìm kiếm truyện.')
    } finally {
      setLoading(false)
    }
  }

  const [detailError, setDetailError] = useState<string | null>(null)
  const [directLinkInput, setDirectLinkInput] = useState('')

  const handleOpenDetail = async (idOrUrl: string) => {
    setDetailLoading(true)
    setDetailError(null)
    setErrorMsg(null)
    setModalTab('info')
    setChaptersList([])
    setDownloadProgress(null)
    setIsDownloading(false)
    try {
      // Extract numeric ID if given a full URL or path
      const match = idOrUrl.match(/\/novel\/(\d+)\.html/) || idOrUrl.match(/id\/(\d+)/) || idOrUrl.match(/^(\d+)$/)
      const cleanTarget = match ? match[1] : idOrUrl.trim()

      const rawDetail = await fetchAliceNovel(cleanTarget)
      const transDetail = translateNovelDetail(rawDetail)
      setSelectedNovel(transDetail)
      setIntroTab('vi')

      // Check if already saved in IndexedDB
      const existing = await loadBook(transDetail.translatedTitle || transDetail.title)
      if (existing) {
        setSavedBooksSet((prev) => new Set(prev).add(transDetail.id))
      }

      // Pre-fetch chapter list in background
      loadChaptersForNovel(transDetail.id)
    } catch (err: any) {
      console.error(err)
      setDetailError(err.message || 'Không thể tải thông tin chi tiết truyện từ link đã cung cấp.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDirectLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!directLinkInput.trim()) return
    handleOpenDetail(directLinkInput.trim())
  }

  const loadChaptersForNovel = async (novelId: string) => {
    setChaptersLoading(true)
    try {
      const res = await fetchAliceChapters(novelId)
      const transChapters = res.chapters.map((ch) => ({
        ...ch,
        translatedTitle: translator.translateText(ch.title) || ch.title,
      }))
      setChaptersList(transChapters)
    } catch (err) {
      console.error('Failed to load chapters list:', err)
    } finally {
      setChaptersLoading(false)
    }
  }

  // Quick Save metadata into Library
  const handleSaveToLibrary = async (novel: TranslatedNovelItem | TranslatedNovelDetail) => {
    try {
      const finalTitle = (novel as any).translatedTitle || novel.title
      const finalAuthor = (novel as any).translatedAuthor || novel.author
      const introText = (novel as any).translatedFullIntro || (novel as any).translatedIntro || novel.intro || ''

      const newBook: Book = {
        name: finalTitle,
        chapters: [
          {
            title: 'Chương 0 - Giới thiệu & Thông tin',
            content: `【Tên truyện】: ${finalTitle} (${novel.title})\n【Tác giả】: ${finalAuthor} (${novel.author})\n【Thể loại】: ${(novel as any).translatedCategory || novel.category}\n【Nguồn gốc】: ${novel.url}\n\n【Tóm tắt nội dung】:\n${introText}`,
            isIntro: true,
            customNumber: '0',
          },
        ],
        intro: introText,
        cover: novel.cover,
        enableTranslate: true,
        lastAccessed: Date.now(),
      }

      await saveBook(newBook)
      setSavedBooksSet((prev) => new Set(prev).add(novel.id))
      setSaveSuccessMsg(`Đã lưu "${finalTitle}" vào Thư viện thành công!`)
      setTimeout(() => setSaveSuccessMsg(null), 3500)
    } catch (err: any) {
      console.error(err)
      alert('Có lỗi khi lưu truyện vào thư viện.')
    }
  }

  // Batch Download all chapters and save full offline book
  const handleBatchDownload = async (novel: TranslatedNovelDetail) => {
    if (isDownloading) {
      cancelDownloadRef.current = true
      setIsDownloading(false)
      return
    }

    if (chaptersList.length === 0) {
      alert('Đang tải danh sách chương, vui lòng chờ trong giây lát.')
      return
    }

    cancelDownloadRef.current = false
    setIsDownloading(true)

    const finalTitle = novel.translatedTitle || novel.title
    const finalAuthor = novel.translatedAuthor || novel.author
    const introText = novel.translatedFullIntro || novel.fullIntro || ''

    const total = chaptersList.length
    const downloadedChapters: Chapter[] = [
      {
        title: 'Chương 0 - Giới thiệu tác phẩm',
        content: `【Tên truyện】: ${finalTitle} (${novel.title})\n【Tác giả】: ${finalAuthor} (${novel.author})\n【Thể loại】: ${novel.translatedCategory || novel.category}\n【Nguồn】: ${novel.url}\n\n【Tóm tắt】:\n${introText}`,
        isIntro: true,
        customNumber: '0',
      },
    ]

    try {
      for (let i = 0; i < chaptersList.length; i++) {
        if (cancelDownloadRef.current) {
          alert('Đã dừng tải.')
          break
        }

        const ch = chaptersList[i]
        setDownloadProgress({
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
        })

        try {
          const contentRes = await fetchAliceChapterContent(ch.url)
          const transTitle = ch.translatedTitle || translator.translateText(ch.title) || ch.title
          const transContent = translator.translateText(contentRes.content) || contentRes.content

          downloadedChapters.push({
            title: transTitle,
            content: contentRes.content,
            translatedContent: transContent,
            customNumber: String(i + 1),
          })
        } catch (chErr) {
          console.error(`Lỗi tải chương ${i + 1}:`, chErr)
          downloadedChapters.push({
            title: ch.translatedTitle || ch.title,
            content: `[Không thể tải nội dung chương này từ AliceSW]`,
            customNumber: String(i + 1),
          })
        }

        // Slight pause to avoid rate limiting
        await new Promise((r) => setTimeout(r, 80))
      }

      // Save complete novel into IndexedDB
      const fullBook: Book = {
        name: finalTitle,
        chapters: downloadedChapters,
        intro: introText,
        cover: novel.cover,
        enableTranslate: true,
        lastAccessed: Date.now(),
      }

      await saveBook(fullBook)
      setSavedBooksSet((prev) => new Set(prev).add(novel.id))
      setSaveSuccessMsg(`Đã tải trọn bộ ${downloadedChapters.length - 1} chương vào Thư Viện!`)
      setTimeout(() => setSaveSuccessMsg(null), 4000)
    } catch (err: any) {
      console.error(err)
      alert('Có lỗi trong quá trình tải trọn bộ.')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }

  // Read Chapter Online Immediately
  const handleReadOnline = async (novel: TranslatedNovelDetail, targetChapterIndex: number = 0) => {
    setLaunchingChapter(true)
    try {
      const finalTitle = novel.translatedTitle || novel.title
      const finalAuthor = novel.translatedAuthor || novel.author
      const introText = novel.translatedFullIntro || novel.fullIntro || ''

      // Ensure chapters list
      let chs = chaptersList
      if (chs.length === 0) {
        const res = await fetchAliceChapters(novel.id)
        chs = res.chapters.map((c) => ({
          ...c,
          translatedTitle: translator.translateText(c.title) || c.title,
        }))
        setChaptersList(chs)
      }

      if (chs.length === 0) {
        throw new Error('Chưa có chương nào để đọc.')
      }

      // Build placeholder chapter objects
      const targetCh = chs[targetChapterIndex] || chs[0]
      const chContent = await fetchAliceChapterContent(targetCh.url)
      const transTargetContent = translator.translateText(chContent.content) || chContent.content

      const bookChapters: Chapter[] = chs.map((c, idx) => {
        const transTitle = c.translatedTitle || translator.translateText(c.title) || c.title
        if (idx === targetChapterIndex) {
          return {
            title: transTitle,
            content: chContent.content,
            translatedContent: transTargetContent,
            customNumber: String(idx + 1),
            sourceUrl: c.url,
          }
        }
        return {
          title: transTitle,
          content: `[Đang chờ tải...]`,
          customNumber: String(idx + 1),
          sourceUrl: c.url,
        }
      })

      // Setup reader store
      useReaderStore.getState().setBook(finalTitle, bookChapters, true)
      useReaderStore.getState().setCurrentChapter(targetChapterIndex)

      // Also save book shell into IndexedDB
      const bookShell: Book = {
        name: finalTitle,
        chapters: bookChapters,
        intro: introText,
        cover: novel.cover,
        enableTranslate: true,
        lastAccessed: Date.now(),
      }
      await saveBook(bookShell)

      // Close modal and switch view to Reader
      setSelectedNovel(null)
      setCurrentView('reader')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Không thể mở đọc chương trực tiếp.')
    } finally {
      setLaunchingChapter(false)
    }
  }

  // Pre-translated homepage featured list
  const translatedFeatured = useMemo(() => {
    if (!homeData?.featured) return []
    return homeData.featured.map(translateNovelItem)
  }, [homeData?.featured, isDbLoaded])

  const translatedLatest = useMemo(() => {
    if (!homeData?.latestNovels) return []
    return homeData.latestNovels.map(translateNovelItem)
  }, [homeData?.latestNovels, isDbLoaded])

  // Full Categories list
  const categoriesList: AliceCategory[] = useMemo(() => {
    if (homeData?.categories && homeData.categories.length > 0) {
      return homeData.categories
    }
    return [
      { id: '64', name: '都市', url: '/lists/64.html' },
      { id: '62', name: '玄幻', url: '/lists/62.html' },
      { id: '73', name: '同人', url: '/lists/73.html' },
      { id: '68', name: '武侠', url: '/lists/68.html' },
      { id: '71', name: '科幻', url: '/lists/71.html' },
      { id: '75', name: '奇幻', url: '/lists/75.html' },
      { id: '69', name: '系统', url: '/lists/69.html' },
      { id: '70', name: '穿越', url: '/lists/70.html' },
      { id: '61', name: '校园', url: '/lists/61.html' },
      { id: '63', name: '乡村', url: '/lists/63.html' },
      { id: '19', name: '纯爱', url: '/lists/19.html' },
      { id: '65', name: '乱伦', url: '/lists/65.html' },
      { id: '18', name: '堕落', url: '/lists/18.html' },
      { id: '46', name: '凌辱', url: '/lists/46.html' },
      { id: '22', name: '反差', url: '/lists/22.html' },
      { id: '48', name: '萝莉', url: '/lists/48.html' },
      { id: '56', name: '熟女', url: '/lists/56.html' },
      { id: '52', name: '伪娘', url: '/lists/52.html' },
      { id: '50', name: '正太', url: '/lists/50.html' },
      { id: '74', name: '明星', url: '/lists/74.html' },
    ]
  }, [homeData?.categories])

  // Filtered chapters in modal
  const filteredChapters = useMemo(() => {
    if (!chapterSearchKeyword.trim()) return chaptersList
    const q = chapterSearchKeyword.toLowerCase().trim()
    return chaptersList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.translatedTitle?.toLowerCase().includes(q) ||
        String(c.index).includes(q)
    )
  }, [chaptersList, chapterSearchKeyword])

  const renderTitle = (novel: TranslatedNovelItem) => {
    if (translateMode === 'zh') {
      return <h3 className="as-card-title">{novel.title}</h3>
    }
    if (translateMode === 'bilingual') {
      return (
        <div>
          <h3 className="as-card-title">{novel.translatedTitle}</h3>
          <div className="as-card-orig-title">{novel.title}</div>
        </div>
      )
    }
    return <h3 className="as-card-title">{novel.translatedTitle || novel.title}</h3>
  }

  const renderAuthor = (novel: TranslatedNovelItem) => {
    if (translateMode === 'zh') return novel.author || 'Tác giả'
    if (translateMode === 'bilingual' && novel.translatedAuthor !== novel.author) {
      return `${novel.translatedAuthor} (${novel.author})`
    }
    return novel.translatedAuthor || novel.author
  }

  return (
    <div className="alice-source-view">
      {/* Header */}
      <header className="as-header">
        <div className="as-header-inner">
          <div className="as-brand-wrap">
            <button className="as-back-lib-btn" onClick={() => setCurrentView('library')}>
              <i className="ti ti-arrow-left" /> Thư viện của tôi
            </button>
            <div className="as-brand">
              <i className="ti ti-world as-brand-icon" />
              <h1 className="as-brand-title">
                Nguồn AliceSW
                <span className="as-brand-badge">alicesw.com</span>
              </h1>
            </div>
          </div>

          {/* Search bar */}
          <form className="as-search-form" onSubmit={handleSearch}>
            <select
              className="as-search-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
            >
              <option value="_all">Tất cả</option>
              <option value="title">Tên truyện</option>
              <option value="author">Tác giả</option>
              <option value="tag">Thẻ nhãn</option>
            </select>
            <input
              type="text"
              className="as-search-input"
              placeholder="Tìm tên truyện, tác giả, link/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
            <button type="submit" className="as-search-btn">
              <i className="ti ti-search" /> Tìm
            </button>
          </form>

          {/* Header Controls */}
          <div className="as-header-controls">
            <div className="as-trans-toggle" title="Chế độ hiển thị bản dịch">
              <button
                className={`as-trans-btn ${translateMode === 'vi' ? 'active' : ''}`}
                onClick={() => setTranslateMode('vi')}
              >
                🇻🇳 Dịch
              </button>
              <button
                className={`as-trans-btn ${translateMode === 'bilingual' ? 'active' : ''}`}
                onClick={() => setTranslateMode('bilingual')}
              >
                🔀 Song ngữ
              </button>
              <button
                className={`as-trans-btn ${translateMode === 'zh' ? 'active' : ''}`}
                onClick={() => setTranslateMode('zh')}
              >
                🇨🇳 Gốc
              </button>
            </div>

            <button
              className="btn-ghost"
              onClick={() => setShowDictModal(true)}
              title="Quản lý từ điển VietPhrase / Tên nhân vật"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <i className="ti ti-book-download" /> Từ điển ({vpCount > 0 ? `${(vpCount / 1000).toFixed(0)}k` : '0'})
            </button>

            <button
              className="btn-ghost"
              onClick={() => setShowSettingsModal(true)}
              title="Cài đặt giao diện & Làm mờ ảnh bìa"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <i className="ti ti-settings" /> Cài đặt
            </button>
          </div>
        </div>
      </header>

      {/* Save Success Toast */}
      {saveSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
          }}
        >
          <i className="ti ti-circle-check" style={{ fontSize: '1.2rem' }} />
          {saveSuccessMsg}
        </div>
      )}

      {/* Main Content Area */}
      <main className="as-main">
        {/* Permanent Sticky Sub-nav Tabs Bar - Always Visible */}
        <div className="as-home-tabs-container">
          <div className="as-home-tabs-list">
            <button
              className={`as-home-tab-btn ${navTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                setNavTab('home')
                if (!homeData) loadHome()
              }}
            >
              <i className="ti ti-flame" /> Đề Cử Nổi Bật
            </button>
            <button
              className={`as-home-tab-btn ${navTab === 'rank' ? 'active' : ''}`}
              onClick={() => handleSelectRank('hits_day')}
            >
              <i className="ti ti-trophy" /> Bảng Xếp Hạng
            </button>
            <button
              className="as-home-tab-btn"
              onClick={() => {
                if (navTab !== 'home') {
                  setNavTab('home')
                  setTimeout(() => {
                    const el = document.getElementById('as-latest-section')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }, 150)
                } else {
                  const el = document.getElementById('as-latest-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              <i className="ti ti-clock" /> Mới Cập Nhật
            </button>
            <div className="as-nav-divider" />
            {categoriesList.map((cat) => {
              const isCatActive = navTab === 'category' && selectedCatId === cat.id
              return (
                <button
                  key={cat.id}
                  className={`as-home-tab-btn ${isCatActive ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(cat.id, catOrder, 1)}
                >
                  {translateCategory(cat.name)}
                </button>
              )
            })}
            <button
              className={`as-home-tab-btn ${navTab === 'category' && !selectedCatId ? 'active' : ''}`}
              style={{ color: navTab === 'category' ? '#fff' : 'var(--gold)', fontWeight: 700 }}
              onClick={() => {
                setNavTab('category')
                if (!categoryData) handleSelectCategory(selectedCatId || '64', catOrder, 1)
              }}
            >
              <i className="ti ti-grid-dots" /> Tất Cả Thể Loại ({categoriesList.length})
            </button>
          </div>
        </div>

        {/* Direct Link / ID Opener Bar */}
        <div className="as-direct-link-bar">
          <form className="as-direct-link-form" onSubmit={handleDirectLinkSubmit}>
            <div className="as-direct-link-icon">
              <i className="ti ti-link" />
            </div>
            <input
              type="text"
              className="as-direct-link-input"
              placeholder="Dán link alicesw.com/novel/... hoặc nhập ID truyện (VD: 33927)..."
              value={directLinkInput}
              onChange={(e) => setDirectLinkInput(e.target.value)}
            />
            {directLinkInput && (
              <button
                type="button"
                className="as-direct-link-clear"
                onClick={() => setDirectLinkInput('')}
              >
                <i className="ti ti-x" />
              </button>
            )}
            <button type="submit" className="as-direct-link-submit-btn">
              <i className="ti ti-eye" /> Xem Chi Tiết Truyện
            </button>
          </form>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              color: '#ef4444',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              <i className="ti ti-alert-circle" /> {errorMsg}
            </span>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="as-loading-state">
            <i className="ti ti-loader animate-spin as-loading-spinner" />
            <p>Đang tải dữ liệu từ AliceSW và áp dụng bản dịch...</p>
          </div>
        ) : (
          <>
            {/* 1. HOME VIEW */}
            {navTab === 'home' && (
              <div>
                <div className="as-section-header">
                  <h2 className="as-section-title">
                    <i className="ti ti-sparkles" style={{ color: 'var(--gold)' }} />
                    Truyện Nổi Bật & Đề Cử (原创 / 重磅推荐)
                  </h2>
                </div>

                <div className="as-grid">
                  {translatedFeatured.map((novel) => {
                    const isSaved = savedBooksSet.has(novel.id)
                    return (
                      <div key={novel.id} className="as-card">
                        <div className="as-card-body" onClick={() => handleOpenDetail(novel.id)}>
                          <div className="as-card-cover-wrap">
                            <NovelCover
                              src={novel.cover}
                              alt={novel.title}
                              novelIdOrName={novel.id}
                              className="as-card-cover"
                            />
                          </div>

                          <div className="as-card-content">
                            {renderTitle(novel)}
                            <div className="as-card-meta">
                              <span className="as-card-author">
                                <i className="ti ti-user" /> {renderAuthor(novel)}
                              </span>
                              {novel.category && (
                                <span className="as-card-cat-badge">
                                  {translateCategory(novel.category)}
                                </span>
                              )}
                            </div>

                            {novel.intro && (
                              <p className="as-card-intro">
                                {translateMode === 'zh' ? novel.intro : novel.translatedIntro || novel.intro}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="as-card-actions">
                          <button
                            className="as-card-btn-detail"
                            onClick={() => handleOpenDetail(novel.id)}
                          >
                            <i className="ti ti-eye" /> Chi tiết & Chương
                          </button>

                          <button
                            className={`as-card-btn-save ${isSaved ? 'as-card-btn-saved' : ''}`}
                            onClick={() => handleSaveToLibrary(novel)}
                          >
                            <i className={isSaved ? 'ti ti-check' : 'ti ti-bookmark-plus'} />
                            {isSaved ? 'Đã lưu' : 'Thêm vào Tủ'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Latest Updates Section */}
                {translatedLatest.length > 0 && (
                  <div id="as-latest-section" style={{ marginTop: '40px' }}>
                    <div className="as-section-header">
                      <h2 className="as-section-title">
                        <i className="ti ti-clock" style={{ color: 'var(--gold)' }} />
                        Truyện Mới Cập Nhật (最新小说)
                      </h2>
                    </div>

                    <div className="as-rank-table">
                      {translatedLatest.map((novel, idx) => {
                        const isSaved = savedBooksSet.has(novel.id)
                        return (
                          <div key={novel.id + '_' + idx} className="as-rank-item">
                            <span className="as-rank-num">{idx + 1}</span>

                            <div className="as-rank-info" onClick={() => handleOpenDetail(novel.id)}>
                              <div className="as-rank-title-wrap">
                                <span className="as-rank-title">
                                  {translateMode === 'zh' ? novel.title : novel.translatedTitle}
                                </span>
                                {translateMode === 'bilingual' && (
                                  <span className="as-rank-orig">({novel.title})</span>
                                )}
                                {novel.category && (
                                  <span className="as-card-cat-badge">
                                    {translateCategory(novel.category)}
                                  </span>
                                )}
                              </div>

                              <div className="as-rank-meta">
                                <span>
                                  <i className="ti ti-user" /> {renderAuthor(novel)}
                                </span>
                                {novel.latestChapter && (
                                  <span>
                                    <i className="ti ti-file-text" />{' '}
                                    {translateMode === 'zh'
                                      ? novel.latestChapter
                                      : novel.translatedLatestChapter || novel.latestChapter}
                                  </span>
                                )}
                                {novel.updateTime && (
                                  <span>
                                    <i className="ti ti-calendar" /> {novel.updateTime}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              className={`as-card-btn-save ${isSaved ? 'as-card-btn-saved' : ''}`}
                              onClick={() => handleSaveToLibrary(novel)}
                              style={{ padding: '6px 12px' }}
                            >
                              <i className={isSaved ? 'ti ti-check' : 'ti ti-bookmark-plus'} />
                              {isSaved ? 'Đã lưu' : 'Lưu'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CATEGORY VIEW */}
            {navTab === 'category' && (
              <div>
                {/* Category Selection Tiles */}
                <div className="as-category-tiles">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCatId === cat.id
                    return (
                      <div
                        key={cat.id}
                        className={`as-category-tile ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectCategory(cat.id, catOrder, 1)}
                      >
                        <div>
                          <div className="as-category-tile-name">{translateCategory(cat.name)}</div>
                          <div className="as-category-tile-orig">{cat.name}</div>
                        </div>
                        <i className={`ti ti-chevron-right ${isSelected ? 'text-gold' : ''}`} />
                      </div>
                    )
                  })}
                </div>

                {categoryData && (
                  <div>
                    <div className="as-section-header">
                      <h2 className="as-section-title">
                        <i className="ti ti-books" style={{ color: 'var(--gold)' }} />
                        Thể loại: {translateCategory(categoryData.title)} ({categoryData.title}) - Trang {catPage}
                      </h2>

                      <select
                        className="as-sort-select"
                        value={catOrder}
                        onChange={(e) => {
                          setCatOrder(e.target.value)
                          handleSelectCategory(selectedCatId, e.target.value, 1)
                        }}
                      >
                        <option value="update_time+desc">Sắp xếp: Mới cập nhật</option>
                        <option value="hits+desc">Sắp xếp: Lượt xem nhiều</option>
                        <option value="word+desc">Sắp xếp: Số chữ nhiều</option>
                      </select>
                    </div>

                    {categoryData.novels.length === 0 ? (
                      <div className="as-empty-state">
                        <i className="ti ti-inbox" />
                        <p>Không có truyện trong thể loại này.</p>
                      </div>
                    ) : (
                      <>
                        <div className="as-rank-table">
                          {categoryData.novels.map((novel, idx) => {
                            const isSaved = savedBooksSet.has(novel.id)
                            return (
                              <div key={novel.id + '_' + idx} className="as-rank-item">
                                <span className={`as-rank-num ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}`}>
                                  {(catPage - 1) * 30 + idx + 1}
                                </span>

                                <div className="as-rank-info" onClick={() => handleOpenDetail(novel.id)}>
                                  <div className="as-rank-title-wrap">
                                    <span className="as-rank-title">
                                      {translateMode === 'zh' ? novel.title : novel.translatedTitle}
                                    </span>
                                    {translateMode === 'bilingual' && (
                                      <span className="as-rank-orig">({novel.title})</span>
                                    )}
                                    {novel.category && (
                                      <span className="as-card-cat-badge">
                                        {translateCategory(novel.category)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="as-rank-meta">
                                    <span>
                                      <i className="ti ti-user" /> {renderAuthor(novel)}
                                    </span>
                                    {novel.wordCount && (
                                      <span>
                                        <i className="ti ti-align-left" /> {novel.wordCount} chữ
                                      </span>
                                    )}
                                    {novel.views && (
                                      <span>
                                        <i className="ti ti-eye" /> {novel.views}
                                      </span>
                                    )}
                                    {novel.latestChapter && (
                                      <span>
                                        <i className="ti ti-file-text" />{' '}
                                        {translateMode === 'zh'
                                          ? novel.latestChapter
                                          : novel.translatedLatestChapter || novel.latestChapter}
                                      </span>
                                    )}
                                    {novel.updateTime && (
                                      <span>
                                        <i className="ti ti-calendar" /> {novel.updateTime}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  className={`as-card-btn-save ${isSaved ? 'as-card-btn-saved' : ''}`}
                                  onClick={() => handleSaveToLibrary(novel)}
                                >
                                  <i className={isSaved ? 'ti ti-check' : 'ti ti-bookmark-plus'} />
                                  {isSaved ? 'Đã lưu' : 'Lưu'}
                                </button>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination Bar */}
                        <div className="as-pagination">
                          <button
                            className="as-page-btn"
                            disabled={catPage <= 1}
                            onClick={() => handleSelectCategory(selectedCatId, catOrder, catPage - 1)}
                          >
                            <i className="ti ti-chevron-left" /> Trang trước
                          </button>
                          <span className="as-page-current">Trang {catPage}</span>
                          <button
                            className="as-page-btn"
                            onClick={() => handleSelectCategory(selectedCatId, catOrder, catPage + 1)}
                          >
                            Trang tiếp <i className="ti ti-chevron-right" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. RANK VIEW */}
            {navTab === 'rank' && (
              <div>
                <div className="as-section-header">
                  <h2 className="as-section-title">
                    <i className="ti ti-trophy" style={{ color: 'var(--gold)' }} />
                    {rankData?.title || 'Bảng Xếp Hạng'}
                  </h2>

                  {/* Rank Type Tabs */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`as-nav-pill ${selectedRankType === 'hits_day' ? 'active' : ''}`}
                      onClick={() => handleSelectRank('hits_day')}
                    >
                      Top Ngày
                    </button>
                    <button
                      className={`as-nav-pill ${selectedRankType === 'hits_week' ? 'active' : ''}`}
                      onClick={() => handleSelectRank('hits_week')}
                    >
                      Top Tuần
                    </button>
                    <button
                      className={`as-nav-pill ${selectedRankType === 'hits_month' ? 'active' : ''}`}
                      onClick={() => handleSelectRank('hits_month')}
                    >
                      Top Tháng
                    </button>
                    <button
                      className={`as-nav-pill ${selectedRankType === 'hits' ? 'active' : ''}`}
                      onClick={() => handleSelectRank('hits')}
                    >
                      Tổng Bảng
                    </button>
                  </div>
                </div>

                {rankData && (
                  <div className="as-rank-table">
                    {rankData.novels.map((novel, idx) => {
                      const isSaved = savedBooksSet.has(novel.id)
                      return (
                        <div key={novel.id + '_' + idx} className="as-rank-item">
                          <span className={`as-rank-num ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}`}>
                            {idx + 1}
                          </span>

                          <div className="as-rank-info" onClick={() => handleOpenDetail(novel.id)}>
                            <div className="as-rank-title-wrap">
                              <span className="as-rank-title">
                                {translateMode === 'zh' ? novel.title : novel.translatedTitle}
                              </span>
                              {translateMode === 'bilingual' && (
                                <span className="as-rank-orig">({novel.title})</span>
                              )}
                              {novel.category && (
                                <span className="as-card-cat-badge">
                                  {translateCategory(novel.category)}
                                </span>
                              )}
                            </div>

                            <div className="as-rank-meta">
                              <span>
                                <i className="ti ti-user" /> {renderAuthor(novel)}
                              </span>
                              {novel.wordCount && (
                                <span>
                                  <i className="ti ti-align-left" /> {novel.wordCount}
                                </span>
                              )}
                              {novel.views && (
                                <span>
                                  <i className="ti ti-flame" /> {novel.views} độ hot
                                </span>
                              )}
                              {novel.latestChapter && (
                                <span>
                                  <i className="ti ti-file-text" />{' '}
                                  {translateMode === 'zh'
                                    ? novel.latestChapter
                                    : novel.translatedLatestChapter || novel.latestChapter}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            className={`as-card-btn-save ${isSaved ? 'as-card-btn-saved' : ''}`}
                            onClick={() => handleSaveToLibrary(novel)}
                          >
                            <i className={isSaved ? 'ti ti-check' : 'ti ti-bookmark-plus'} />
                            {isSaved ? 'Đã lưu' : 'Lưu'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. SEARCH RESULTS VIEW */}
            {navTab === 'search' && searchData && (
              <div>
                <div className="as-section-header">
                  <h2 className="as-section-title">
                    <i className="ti ti-search" style={{ color: 'var(--gold)' }} />
                    Kết quả tìm kiếm cho: "{searchData.query}" ({searchData.novels.length} kết quả)
                  </h2>
                </div>

                {searchData.novels.length === 0 ? (
                  <div className="as-empty-state">
                    <i className="ti ti-search-off" />
                    <p>Không tìm thấy truyện nào với từ khóa "{searchData.query}".</p>
                    <small style={{ color: 'var(--ink3)' }}>
                      Mẹo: Hãy thử tìm bằng tên tiếng Trung hoặc dán link truyện từ alicesw.com
                    </small>
                  </div>
                ) : (
                  <div className="as-grid">
                    {searchData.novels.map((novel) => {
                      const isSaved = savedBooksSet.has(novel.id)
                      return (
                        <div key={novel.id} className="as-card">
                          <div className="as-card-body" onClick={() => handleOpenDetail(novel.id)}>
                            <div className="as-card-cover-wrap">
                              <NovelCover
                                src={novel.cover}
                                alt={novel.title}
                                novelIdOrName={novel.id}
                                className="as-card-cover"
                              />
                            </div>

                            <div className="as-card-content">
                              {renderTitle(novel)}
                              <div className="as-card-meta">
                                <span className="as-card-author">
                                  <i className="ti ti-user" /> {renderAuthor(novel)}
                                </span>
                                {novel.status && (
                                  <span className="as-card-cat-badge">{novel.status}</span>
                                )}
                              </div>

                              {novel.intro && (
                                <p className="as-card-intro">
                                  {translateMode === 'zh'
                                    ? novel.intro
                                    : novel.translatedIntro || novel.intro}
                                </p>
                              )}

                              {novel.tags && novel.tags.length > 0 && (
                                <div className="as-card-tags">
                                  {novel.tags.slice(0, 3).map((t, idx) => (
                                    <span key={idx} className="as-tag-pill">
                                      #{translateMode === 'zh' ? t : novel.translatedTags?.[idx] || t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="as-card-actions">
                            <button
                              className="as-card-btn-detail"
                              onClick={() => handleOpenDetail(novel.id)}
                            >
                              <i className="ti ti-eye" /> Chi tiết & Chương
                            </button>

                            <button
                              className={`as-card-btn-save ${isSaved ? 'as-card-btn-saved' : ''}`}
                              onClick={() => handleSaveToLibrary(novel)}
                            >
                              <i className={isSaved ? 'ti ti-check' : 'ti ti-bookmark-plus'} />
                              {isSaved ? 'Đã lưu' : 'Thêm vào Tủ'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Novel Detail Modal */}
      {(selectedNovel || detailLoading || detailError) && (
        <div
          className="as-modal-overlay"
          onClick={() => {
            if (!isDownloading) {
              setSelectedNovel(null)
              setDetailError(null)
            }
          }}
        >
          <div className="as-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="as-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-book-2" style={{ color: 'var(--gold)', fontSize: '1.2rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Thông tin tác phẩm
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedNovel && (
                  <button
                    className={`btn-ghost ${savedBooksSet.has(selectedNovel.id) ? 'as-modal-btn-saved' : ''}`}
                    style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleSaveToLibrary(selectedNovel)}
                  >
                    <i className={savedBooksSet.has(selectedNovel.id) ? 'ti ti-check' : 'ti ti-bookmark'} />
                    {savedBooksSet.has(selectedNovel.id) ? 'Đã trong Tủ' : 'Lưu Tủ Sách'}
                  </button>
                )}
                <button
                  className="as-modal-close-btn"
                  onClick={() => {
                    if (!isDownloading) {
                      setSelectedNovel(null)
                      setDetailError(null)
                    }
                  }}
                  disabled={isDownloading}
                >
                  ×
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="as-loading-state" style={{ padding: '60px 20px' }}>
                <i className="ti ti-loader animate-spin as-loading-spinner" />
                <p>Đang tải thông tin chi tiết và bản dịch...</p>
              </div>
            ) : detailError ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: '2.2rem', marginBottom: '12px' }}>
                  <i className="ti ti-alert-triangle" />
                </div>
                <h4 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '1.1rem' }}>Không thể mở truyện</h4>
                <p style={{ color: 'var(--ink2)', maxWidth: '420px', margin: '0 auto 16px', fontSize: '0.9rem' }}>{detailError}</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (directLinkInput) handleOpenDetail(directLinkInput)
                    else setDetailError(null)
                  }}
                >
                  <i className="ti ti-refresh" /> Thử lại
                </button>
              </div>
            ) : selectedNovel ? (
              <>
                {/* Modal Tab Bar */}
                <div className="as-modal-tab-bar">
                  <button
                    className={`as-modal-nav-tab ${modalTab === 'info' ? 'active' : ''}`}
                    onClick={() => setModalTab('info')}
                  >
                    <i className="ti ti-info-circle" /> Giới thiệu & Chi tiết
                  </button>
                  <button
                    className={`as-modal-nav-tab ${modalTab === 'chapters' ? 'active' : ''}`}
                    onClick={() => {
                      setModalTab('chapters')
                      if (chaptersList.length === 0 && selectedNovel) {
                        loadChaptersForNovel(selectedNovel.id)
                      }
                    }}
                  >
                    <i className="ti ti-list" /> Mục lục chương ({chaptersList.length || selectedNovel.totalChapters || '...'})
                  </button>
                </div>

                <div className="as-modal-body">
                  {/* TAB 1: INFO */}
                  {modalTab === 'info' && (
                    <>
                      <div className="as-modal-hero">
                        <div className="as-modal-cover-wrap">
                          <NovelCover
                            src={selectedNovel.cover}
                            alt={selectedNovel.title}
                            novelIdOrName={selectedNovel.id}
                            className="as-modal-cover"
                          />
                        </div>

                        <div className="as-modal-hero-info">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <h2 className="as-modal-title">{selectedNovel.translatedTitle}</h2>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => toggleNovelBlur(selectedNovel.id)}
                              title="Bật/Tắt làm mờ ảnh bìa cho truyện này"
                              style={{
                                fontSize: '0.78rem',
                                padding: '4px 8px',
                                flexShrink: 0,
                                color: isCoverBlurred(selectedNovel.id) ? 'var(--gold)' : 'var(--ink2)',
                                borderColor: isCoverBlurred(selectedNovel.id) ? 'var(--gold)' : 'var(--paper3)',
                              }}
                            >
                              <i className={isCoverBlurred(selectedNovel.id) ? 'ti ti-eye-off' : 'ti ti-eye'} />{' '}
                              {isCoverBlurred(selectedNovel.id) ? 'Đang mờ bìa' : 'Không làm mờ'}
                            </button>
                          </div>
                          <div className="as-modal-orig-title">Tên gốc: {selectedNovel.title}</div>

                          <div className="as-modal-meta-grid">
                            <div className="as-modal-meta-item">
                              <span className="as-modal-meta-label">Tác giả</span>
                              <span className="as-modal-meta-value">
                                {selectedNovel.translatedAuthor} ({selectedNovel.author})
                              </span>
                            </div>

                            <div className="as-modal-meta-item">
                              <span className="as-modal-meta-label">Thể loại</span>
                              <span className="as-modal-meta-value">
                                {translateCategory(selectedNovel.category)}
                              </span>
                            </div>

                            <div className="as-modal-meta-item">
                              <span className="as-modal-meta-label">Tình trạng</span>
                              <span className="as-modal-meta-value">{selectedNovel.status || 'Đang ra'}</span>
                            </div>

                            {selectedNovel.wordCount && (
                              <div className="as-modal-meta-item">
                                <span className="as-modal-meta-label">Số chữ</span>
                                <span className="as-modal-meta-value">{selectedNovel.wordCount}</span>
                              </div>
                            )}

                            {selectedNovel.views && (
                              <div className="as-modal-meta-item">
                                <span className="as-modal-meta-label">Lượt xem / Độ hot</span>
                                <span className="as-modal-meta-value">{selectedNovel.views}</span>
                              </div>
                            )}

                            <div className="as-modal-meta-item">
                              <span className="as-modal-meta-label">Tổng số chương</span>
                              <span className="as-modal-meta-value">
                                {chaptersList.length || selectedNovel.totalChapters || 'Đang cập nhật'} chương
                              </span>
                            </div>
                          </div>

                          {/* Tags */}
                          {selectedNovel.tags && selectedNovel.tags.length > 0 && (
                            <div className="as-modal-tags">
                              {selectedNovel.tags.map((t, idx) => (
                                <span key={idx} className="as-modal-tag">
                                  #{selectedNovel.translatedTags[idx] || t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Synopsis / Intro Box */}
                      <div className="as-modal-intro-box">
                        <div className="as-modal-intro-header">
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                            <i className="ti ti-align-left" /> Tóm tắt & Giới thiệu nội dung
                          </h4>

                          <div className="as-modal-intro-tabs">
                            <button
                              className={`as-modal-intro-tab-btn ${introTab === 'vi' ? 'active' : ''}`}
                              onClick={() => setIntroTab('vi')}
                            >
                              🇻🇳 Bản Dịch (VietPhrase)
                            </button>
                            <button
                              className={`as-modal-intro-tab-btn ${introTab === 'zh' ? 'active' : ''}`}
                              onClick={() => setIntroTab('zh')}
                            >
                              🇨🇳 Tiếng Trung Gốc
                            </button>
                          </div>
                        </div>

                        <div className="as-modal-intro-text">
                          {introTab === 'vi'
                            ? selectedNovel.translatedFullIntro || selectedNovel.fullIntro || 'Không có đoạn giới thiệu.'
                            : selectedNovel.fullIntro || '暂无简介。'}
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 2: CHAPTER DIRECTORY */}
                  {modalTab === 'chapters' && (
                    <div>
                      {/* Search box within chapters */}
                      <div className="as-chapter-search-box">
                        <i className="ti ti-search" style={{ color: 'var(--ink3)' }} />
                        <input
                          type="text"
                          placeholder="Tìm chương theo số hoặc tên chương..."
                          value={chapterSearchKeyword}
                          onChange={(e) => setChapterSearchKeyword(e.target.value)}
                        />
                        {chapterSearchKeyword && (
                          <button
                            type="button"
                            onClick={() => setChapterSearchKeyword('')}
                            style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {chaptersLoading ? (
                        <div className="as-loading-state" style={{ padding: '40px 20px' }}>
                          <i className="ti ti-loader animate-spin as-loading-spinner" />
                          <p>Đang tải toàn bộ mục lục chương từ AliceSW...</p>
                        </div>
                      ) : (
                        <div className="as-chapters-grid">
                          {filteredChapters.map((ch, idx) => (
                            <button
                              key={ch.url + '_' + idx}
                              className="as-chapter-btn"
                              onClick={() => handleReadOnline(selectedNovel, ch.index - 1)}
                              title="Bấm để đọc trực tiếp chương này"
                            >
                              <span className="as-chapter-title">
                                {translateMode === 'zh' ? ch.title : ch.translatedTitle || ch.title}
                              </span>
                              {translateMode === 'bilingual' && (
                                <span className="as-chapter-orig">{ch.title}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Batch Download Progress Display */}
                  {downloadProgress && (
                    <div className="as-dl-progress-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                        <span>
                          <i className="ti ti-download animate-bounce" /> Đang tải trọn bộ ({downloadProgress.current}/
                          {downloadProgress.total} chương)...
                        </span>
                        <span>{downloadProgress.percent}%</span>
                      </div>
                      <div className="as-dl-progress-bar-wrap">
                        <div className="as-dl-progress-bar-fill" style={{ width: `${downloadProgress.percent}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="as-modal-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={selectedNovel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    >
                      <i className="ti ti-external-link" /> Trang gốc
                    </a>

                    <button
                      className="btn-ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedNovel.url)
                        setSaveSuccessMsg('Đã sao chép liên kết truyện vào bộ nhớ đệm!')
                        setTimeout(() => setSaveSuccessMsg(null), 3000)
                      }}
                      title="Sao chép link truyện"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                    >
                      <i className="ti ti-copy" /> Copy Link
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Download Full Book button */}
                    <button
                      className="btn-ghost"
                      onClick={() => handleBatchDownload(selectedNovel)}
                      disabled={isDownloading}
                      style={{
                        border: '1px solid var(--gold)',
                        color: 'var(--gold)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className={isDownloading ? 'ti ti-loader animate-spin' : 'ti ti-cloud-download'} />
                      {isDownloading ? 'Đang tải về...' : '⚡ Tải Trọn Bộ Offline'}
                    </button>

                    {/* Read Online Now button */}
                    <button
                      className="btn-primary"
                      onClick={() => handleReadOnline(selectedNovel, 0)}
                      disabled={launchingChapter}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className={launchingChapter ? 'ti ti-loader animate-spin' : 'ti ti-book-2'} />
                      {launchingChapter ? 'Đang mở đọc...' : '📖 Đọc Ngay (Chương 1)'}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
