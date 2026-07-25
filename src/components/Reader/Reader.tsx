import { useEffect, useRef } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'
import { parseTtsWords, initTTS, stopTts } from '@/lib/tts'
import { parseChapterTitle } from '@/lib/chineseNumerals'
import WelcomeScreen from './WelcomeScreen'
import ChapterContent from './ChapterContent'
import './Reader.css'

export default function Reader() {
  const { chapters, bookTitle, currentChapter, setCurrentChapter, setTtsWords } = useReaderStore()
  const settings = useSettingsStore((s) => s.settings)
  const { setSidebarOpen, setActiveTab } = useUiStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const chapter = chapters[currentChapter]

  useEffect(() => {
    initTTS()
  }, [])

  useEffect(() => {
    // Save reading position in localStorage
    if (bookTitle && currentChapter >= 0) {
      localStorage.setItem('novreader_pos_' + bookTitle, currentChapter.toString())
    }

    // Reset scroll when chapter changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }

    // Parse TTS words for this chapter
    if (chapter) {
      const paragraphs = chapter.content.split('\n\n').filter((p) => p.trim() !== '')
      setTtsWords(parseTtsWords(paragraphs))
      stopTts() // stop any playing audio on chapter change
    }
  }, [currentChapter, chapter, setTtsWords, bookTitle])

  if (!chapter) {
    return <WelcomeScreen />
  }

  const handlePrev = () => {
    if (currentChapter > 0) setCurrentChapter(currentChapter - 1)
  }

  const handleNext = () => {
    if (currentChapter < chapters.length - 1) setCurrentChapter(currentChapter + 1)
  }

  // Inject CSS variables for Reader settings
  const readerStyle = {
    '--bg-reader': settings.bgColor,
    '--text-reader': settings.textColor,
    '--font-reader': `"${settings.font}", serif`,
    '--fs-reader': `${settings.fontSize}px`,
    '--lh-reader': settings.lineH,
    '--w-reader': `${settings.width}px`,
    '--para-space': `${settings.paraSpace}em`,
  } as React.CSSProperties

  return (
    <div className="reader-container" style={readerStyle}>
      {/* Top progress bar */}
      <div
        className="top-progress-bar"
        style={{ width: `${(currentChapter / Math.max(chapters.length - 1, 1)) * 100}%` }}
      />

      <div className="reader-scroll-area" ref={scrollRef}>
        <div className="reader-content-wrap">
          <h1 className="chapter-heading">{parseChapterTitle(chapter.title) || chapter.title}</h1>
          {chapter.subtitle && <div className="chapter-sub">{chapter.subtitle}</div>}

          <div
            className={`chapter-body ${settings.dropcap && !chapter.isIntro ? 'dropcap' : ''} ${
              settings.justify ? 'justify' : ''
            }`}
          >
            <ChapterContent content={chapter.content} />
          </div>

          <div className="chapter-nav-bottom">
            <button className="btn-ghost" onClick={handlePrev} disabled={currentChapter === 0}>
              &#8592; Chương trước
            </button>
            <button className="btn-ghost" onClick={() => { setActiveTab('chapters'); setSidebarOpen(true); }}>
              <i className="ti ti-list" /> Danh sách
            </button>
            <button className="btn-ghost" onClick={handleNext} disabled={currentChapter === chapters.length - 1}>
              Chương sau &#8594;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
