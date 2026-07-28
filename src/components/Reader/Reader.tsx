import { useEffect, useRef } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { parseTtsWords, initTTS, stopTts } from '@/lib/tts'
import { formatCleanChapterTitle } from '@/lib/chineseNumerals'
import WelcomeScreen from './WelcomeScreen'
import ChapterContent from './ChapterContent'
import './Reader.css'

export default function Reader() {
  const { chapters, bookTitle, currentChapter, setCurrentChapter, setTtsWords, setChapterProgress } = useReaderStore()
  const settings = useSettingsStore((s) => s.settings)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeChapterRef = useRef<number | null>(null)
  const activeBookRef = useRef<string | null>(null)

  const chapter = chapters[currentChapter]

  useEffect(() => {
    initTTS()
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    // Prevent scroll events from saving or calculating during a chapter/book switch before DOM settles
    if (activeChapterRef.current !== null && activeChapterRef.current !== currentChapter) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (bookTitle && currentChapter >= 0) {
      localStorage.setItem(`novreader_scroll_${bookTitle}`, scrollTop.toString())
    }
    const maxScroll = scrollHeight - clientHeight
    const pct = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))) : (scrollTop > 0 ? 100 : 0)
    setChapterProgress(pct)
  }

  useEffect(() => {
    // Save reading chapter index in localStorage
    if (bookTitle && currentChapter >= 0) {
      localStorage.setItem('novreader_pos_' + bookTitle, currentChapter.toString())
    }

    const isNewBook = activeBookRef.current !== null && activeBookRef.current !== bookTitle
    const isChapterSwitch = !isNewBook && activeChapterRef.current !== null && activeChapterRef.current !== currentChapter
    activeBookRef.current = bookTitle
    activeChapterRef.current = currentChapter

    // Restore scroll position on initial load / same chapter re-render, or reset to top on chapter change
    const timer = setTimeout(() => {
      if (!scrollRef.current) return
      if (isChapterSwitch) {
        // When switching chapters (forwards or backwards), reading progress MUST reset to the beginning (0).
        // Only save progress for the chapter currently being read.
        scrollRef.current.scrollTop = 0
        if (bookTitle) {
          localStorage.setItem(`novreader_scroll_${bookTitle}`, '0')
          localStorage.removeItem(`novreader_scroll_${bookTitle}_${currentChapter}`)
        }
        setChapterProgress(0)
      } else {
        // Initial load of the book (or same chapter re-render after translation finishes)
        const savedScroll =
          localStorage.getItem(`novreader_scroll_${bookTitle}`) ||
          localStorage.getItem(`novreader_scroll_${bookTitle}_${currentChapter}`)
        if (savedScroll && Number(savedScroll) > 0) {
          scrollRef.current.scrollTop = Number(savedScroll)
        } else {
          scrollRef.current.scrollTop = 0
        }
        handleScroll()
      }
    }, 60)
    return () => clearTimeout(timer)
  }, [currentChapter, bookTitle, chapter?.content, chapter?.translatedText])

  useEffect(() => {
    // Parse TTS words for this chapter
    if (chapter) {
      const paragraphs = chapter.content.split('\n\n').filter((p) => p.trim() !== '')
      setTtsWords(parseTtsWords(paragraphs))
      stopTts() // stop any playing audio on chapter change
    }
  }, [chapter?.content, setTtsWords])

  if (!chapter) {
    return <WelcomeScreen />
  }

  const handlePrev = () => {
    if (currentChapter > 0) setCurrentChapter(currentChapter - 1)
  }

  const handleNext = () => {
    if (currentChapter < chapters.length - 1) setCurrentChapter(currentChapter + 1)
  }

  // Touch swipe to change chapter
  const touchStartY = useRef<number | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!settings.swipeToChange) return
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!settings.swipeToChange || touchStartY.current === null) return
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY.current - touchEndY
    touchStartY.current = null

    if (Math.abs(deltaY) > 80) { // threshold
      const el = scrollRef.current
      if (!el) return
      
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
      const isAtTop = el.scrollTop < 50

      // Swiped up (user pulled up) and at bottom -> Next chapter
      if (deltaY > 0 && isAtBottom) {
        handleNext()
      }
      // Swiped down (user pulled down) and at top -> Prev chapter
      else if (deltaY < 0 && isAtTop) {
        handlePrev()
      }
    }
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
      <div 
        className="reader-scroll-area" 
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="reader-content-wrap">
          <h1 className="chapter-heading">{chapter.isIntro ? '' : `#${currentChapter + 1} - `}{formatCleanChapterTitle(chapter.title, currentChapter)}</h1>
          {chapter.subtitle && <div className="chapter-sub">{chapter.subtitle}</div>}

          <div
            className={`chapter-body ${settings.dropcap && !chapter.isIntro ? 'dropcap' : ''} ${
              settings.justify ? 'justify' : ''
            }`}
          >
            <ChapterContent content={chapter.content} />
          </div>

          <div className="chapter-nav-bottom">
            <button className="btn-ghost" onClick={handlePrev} disabled={currentChapter === 0} style={{ width: 'fit-content' }}>
              &#8592; Chương trước
            </button>
            <button className="btn-ghost" onClick={handleNext} disabled={currentChapter === chapters.length - 1} style={{ width: 'fit-content' }}>
              Chương sau &#8594;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
