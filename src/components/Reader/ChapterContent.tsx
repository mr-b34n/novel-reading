import { useEffect, useMemo } from 'react'
import { useTranslateStore } from '@/stores/useTranslateStore'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { translator, type TranslatedToken } from '@/lib/translator'
import { getChapterCache, saveChapterCache } from '@/lib/vietphraseDb'
import WordEditModal from './WordEditModal'

interface ChapterContentProps {
  content: string
}

export default function ChapterContent({ content }: ChapterContentProps) {
  const { mode, isDbLoaded, initDb, loadChapterNames, setSelectedToken, selectedToken, activeCustomNames, retranslateTrigger } =
    useTranslateStore()
  const { chapters, bookTitle, currentChapter, ttsActive, ttsWords, ttsCursor, enableTranslate, setChapterTranslation } =
    useReaderStore()
  const highlightTts = useSettingsStore((s) => s.settings.highlightTts)

  // Split content into paragraphs cleanly
  const paragraphs = useMemo(() => {
    if (!content) return []
    if (content.includes('\n\n') || content.includes('\r\n\r\n')) {
      return content.split(/\r?\n\r?\n/).filter((p) => p.trim() !== '')
    }
    return content.split(/\r?\n/).filter((p) => p.trim() !== '')
  }, [content])

  const currentChapterObj = chapters[currentChapter]

  // Memoize tokens for instant rendering without blocking on async useEffect
  const displayTokens = useMemo(() => {
    if (!enableTranslate || mode === 'off' || !paragraphs.length) return []
    if (currentChapterObj?.translatedTokens && currentChapterObj.translatedTokens.length === paragraphs.length) {
      return currentChapterObj.translatedTokens
    }
    return paragraphs.map((para) => translator.translateToTokens(para))
  }, [enableTranslate, mode, paragraphs, currentChapterObj?.translatedTokens, activeCustomNames, isDbLoaded, retranslateTrigger])

  // Load custom chapter-specific names and translated tokens (with DB caching & pre-translating)
  useEffect(() => {
    if (!bookTitle || currentChapter < 0) return

    let isMounted = true

    async function loadAndCacheChapter() {
      if (!isDbLoaded) {
        await initDb()
      }

      if (!enableTranslate || mode === 'off') {
        return
      }

      // Load custom names for chapter
      await loadChapterNames(bookTitle, currentChapter)

      // Check RAM store first
      if (currentChapterObj?.translatedTokens && currentChapterObj.translatedTokens.length === paragraphs.length) {
        return
      }

      // Check DB cache first
      const cachedData = await getChapterCache(bookTitle, currentChapter)
      if (cachedData && cachedData.tokens && cachedData.tokens.length === paragraphs.length) {
        if (isMounted) {
          setChapterTranslation(currentChapter, cachedData.tokens, cachedData.translatedText)
        }
      } else {
        // Always translate fresh after loading chapter custom names
        const fresh = paragraphs.map((para) => translator.translateToTokens(para))
        const plainText = fresh.map((paraTokens) => paraTokens.map((t: TranslatedToken) => t.vi).join(' ')).join('\n\n')

        if (isMounted) {
          setChapterTranslation(currentChapter, fresh, plainText)
        }
        await saveChapterCache(bookTitle, currentChapter, mode, fresh, plainText)
      }

      // Pre-translate Next Chapter (+1) in background
      const nextChapterIdx = currentChapter + 1
      if (nextChapterIdx < chapters.length) {
        const nextChapter = chapters[nextChapterIdx]
        if (nextChapter && nextChapter.content && !nextChapter.translatedTokens) {
          setTimeout(async () => {
            const nextCached = await getChapterCache(bookTitle, nextChapterIdx)
            if (nextCached && nextCached.tokens) {
              setChapterTranslation(nextChapterIdx, nextCached.tokens, nextCached.translatedText)
            } else {
              const nextParas = nextChapter.content.includes('\n\n')
                ? nextChapter.content.split(/\r?\n\r?\n/).filter((p) => p.trim() !== '')
                : nextChapter.content.split(/\r?\n/).filter((p) => p.trim() !== '')
              const nextTokens = nextParas.map((p) => translator.translateToTokens(p))
              const nextText = nextTokens.map((paraTokens) => paraTokens.map((t: TranslatedToken) => t.vi).join(' ')).join('\n\n')
              setChapterTranslation(nextChapterIdx, nextTokens, nextText)
              await saveChapterCache(bookTitle, nextChapterIdx, mode, nextTokens, nextText)
            }
          }, 300)
        }
      }
    }

    loadAndCacheChapter()

    return () => {
      isMounted = false
    }
  }, [bookTitle, currentChapter, mode, paragraphs, enableTranslate, isDbLoaded, retranslateTrigger])

  const handleTokenClick = (token: TranslatedToken) => {
    if (token.source === 'punct') return
    setSelectedToken(token)
  }

  // Helper to render interactive token with proper word spacing
  const renderToken = (token: TranslatedToken, idx: number, array: TranslatedToken[]) => {
    if (token.source === 'punct') {
      const nextToken = array[idx + 1]
      const isClosingPunct = /^[,.:;!?”’）》】]$/.test(token.vi.trim())
      const needSpace = isClosingPunct && nextToken && nextToken.source !== 'punct'

      return (
        <span key={idx}>
          {token.vi}
          {needSpace && ' '}
        </span>
      )
    }

    if (!token.vi || token.vi === '') {
      return null
    }

    const sourceClass =
      token.source === 'custom'
        ? 'token-custom'
        : token.source === 'names' || token.source === 'pronouns'
        ? 'token-name'
        : 'token-word'

    const nextToken = array[idx + 1]
    const isNextClosingPunct =
      nextToken && nextToken.source === 'punct' && /^[,.:;!?”’）》】]$/.test(nextToken.vi.trim())
    const needSpaceAfter = !isNextClosingPunct

    return (
      <span key={idx}>
        <span
          className={`interactive-word ${sourceClass}`}
          title={`Gốc: ${token.zh} | Hán Việt: ${token.hanviet} | Bấm để sửa`}
          onClick={() => handleTokenClick(token)}
        >
          {token.vi}
        </span>
        {needSpaceAfter && ' '}
      </span>
    )
  }

  // 1. Off mode OR Not a translated story
  if (!enableTranslate || mode === 'off') {
    if (ttsActive && ttsWords.length > 0) {
      const wordsByPara: (typeof ttsWords)[] = []
      ttsWords.forEach((w) => {
        if (!wordsByPara[w.pIdx]) wordsByPara[w.pIdx] = []
        wordsByPara[w.pIdx].push(w)
      })

      return (
        <>
          {wordsByPara.map((words, i) => {
            if (!words) return null
            return (
              <p key={i}>
                {words.map((w, wIdx) => {
                  const isHighlight = highlightTts && w.index === ttsCursor
                  return (
                    <span key={wIdx} className={isHighlight ? 'tts-hl' : ''}>
                      {w.text}{' '}
                    </span>
                  )
                })}
              </p>
            )
          })}
        </>
      )
    }

    return (
      <>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </>
    )
  }

  // 2. TTS mode with highlighting for translated book
  if (ttsActive && ttsWords.length > 0) {
    const wordsByPara: (typeof ttsWords)[] = []
    ttsWords.forEach((w) => {
      if (!wordsByPara[w.pIdx]) wordsByPara[w.pIdx] = []
      wordsByPara[w.pIdx].push(w)
    })

    return (
      <>
        {wordsByPara.map((words, i) => {
          if (!words) return null
          const tokens = displayTokens[i] || []

          return (
            <div key={i} className="trans-para">
              {mode !== 'replace' && (
                <div className="trans-zh">
                  {words.map((w, wIdx) => {
                    const isHighlight = highlightTts && w.index === ttsCursor
                    return (
                      <span key={wIdx} className={isHighlight ? 'tts-hl' : ''}>
                        {w.text}{' '}
                      </span>
                    )
                  })}
                </div>
              )}

              <div className={`trans-vi ${mode === 'replace' ? 'trans-replace' : ''}`}>
                {tokens.map((t: TranslatedToken, tIdx: number, arr: TranslatedToken[]) => renderToken(t, tIdx, arr))}
              </div>
            </div>
          )
        })}

        {selectedToken && (
          <WordEditModal
            token={selectedToken}
            bookTitle={bookTitle}
            chapterIndex={currentChapter}
            onClose={() => setSelectedToken(null)}
          />
        )}
      </>
    )
  }

  // 3. Normal Translation Mode (Dual / Replace)
  return (
    <>
      {paragraphs.map((original, i) => {
        const tokens = displayTokens[i] || []

        return (
          <div key={i} className="trans-para">
            {mode !== 'replace' && <div className="trans-zh">{original}</div>}
            <div className={`trans-vi ${mode === 'replace' ? 'trans-replace' : ''}`}>
              {tokens.map((token: TranslatedToken, tIdx: number, arr: TranslatedToken[]) => renderToken(token, tIdx, arr))}
            </div>
          </div>
        )
      })}

      {selectedToken && (
        <WordEditModal
          token={selectedToken}
          bookTitle={bookTitle}
          chapterIndex={currentChapter}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </>
  )
}
