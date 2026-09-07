import { useReaderStore } from '@/stores/useReaderStore'
import { useTranslateStore } from '@/stores/useTranslateStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { translator } from '@/lib/translator'
import type { TtsWord } from '@/types'

// Global references for TTS
let synth: SpeechSynthesis | null = null
let utterance: SpeechSynthesisUtterance | null = null
let audioPlayer: HTMLAudioElement | null = null
let wakeLockSentinel: any = null

export function initTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    synth = window.speechSynthesis
  }
}

export async function requestWakeLock() {
  try {
    const keepAwake = useSettingsStore.getState().settings.keepScreenAwake ?? true
    if (keepAwake && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      if (!wakeLockSentinel) {
        wakeLockSentinel = await navigator.wakeLock.request('screen')
      }
    }
  } catch (err) {
    console.warn('Wake Lock request failed:', err)
  }
}

export function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {})
    wakeLockSentinel = null
  }
}

export function setupMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

  const { bookTitle, chapters, currentChapter } = useReaderStore.getState()
  const chapter = chapters[currentChapter]
  const chapterTitle = chapter ? (chapter.title || `Chương ${currentChapter + 1}`) : 'Chương đọc'

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapterTitle,
      artist: bookTitle || 'NovReader',
      album: 'NovReader TTS Reader',
      artwork: [
        { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      ],
    })

    navigator.mediaSession.setActionHandler('play', () => {
      playTts()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      pauseTts()
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const { currentChapter: curIdx } = useReaderStore.getState()
      if (curIdx > 0) {
        useReaderStore.getState().setCurrentChapter(curIdx - 1)
        useReaderStore.getState().setTtsCursor(0)
        setTimeout(() => playTts(), 200)
      }
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const { currentChapter: curIdx, chapters: chs } = useReaderStore.getState()
      if (curIdx < chs.length - 1) {
        useReaderStore.getState().setCurrentChapter(curIdx + 1)
        useReaderStore.getState().setTtsCursor(0)
        setTimeout(() => playTts(), 200)
      }
    })
  } catch (err) {
    console.warn('MediaSession setup warning:', err)
  }
}

export function parseTtsWords(paragraphs: string[]): TtsWord[] {
  const words: TtsWord[] = []
  let globalIndex = 0

  paragraphs.forEach((p, pIdx) => {
    // Split paragraph into chunks by punctuation to improve TTS cadence
    const chunks = p.split(/([.,;:!?])/)
    let currentText = ''

    chunks.forEach((chunk) => {
      if (/^[.,;:!?]$/.test(chunk)) {
        currentText += chunk
        if (currentText.trim()) {
          words.push({ text: currentText.trim(), index: globalIndex++, pIdx })
        }
        currentText = ''
      } else {
        if (currentText.trim()) {
          words.push({ text: currentText.trim(), index: globalIndex++, pIdx })
        }
        currentText = chunk
      }
    })

    if (currentText.trim()) {
      words.push({ text: currentText.trim(), index: globalIndex++, pIdx })
    }
  })

  return words
}

export function playTts() {
  const {
    ttsWords,
    ttsCursor,
    ttsRate,
    setTtsPlaying,
    setTtsCursor,
    chapters,
    currentChapter,
    setCurrentChapter,
  } = useReaderStore.getState()
  const { applyDict, mode } = useTranslateStore.getState()

  if (ttsCursor >= ttsWords.length) {
    // Move to next chapter
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1)
      setTtsCursor(0)
      setTimeout(() => {
        playTts()
      }, 500)
    } else {
      stopTts()
    }
    return
  }

  const word = ttsWords[ttsCursor]
  if (!word) return

  // Translate text before reading if translate mode is enabled
  let textToSpeak = word.text
  if (applyDict && mode !== 'off') {
    textToSpeak = translator.translateText(textToSpeak) || textToSpeak
  }

  // Set up screen wake lock & lockscreen controls
  requestWakeLock()
  setupMediaSession()

  // 1. Native OS Voice Engine (SpeechSynthesis with selected OS voice)
  if (ttsVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (audioPlayer) {
      audioPlayer.pause()
    }
    if (!synth) {
      synth = window.speechSynthesis
    }
    synth.cancel()

    utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.voice = ttsVoice
    utterance.rate = ttsRate || 1.0
    utterance.lang = ttsVoice.lang || 'vi-VN'

    utterance.onend = () => {
      const state = useReaderStore.getState()
      state.setTtsCursor(state.ttsCursor + 1)
      if (state.ttsPlaying) {
        setTimeout(() => playTts(), 50)
      } else {
        releaseWakeLock()
      }
    }

    utterance.onerror = (e) => {
      console.error('Native SpeechSynthesis Error:', e)
      setTtsPlaying(false)
      releaseWakeLock()
    }

    synth.speak(utterance)
    setTtsPlaying(true)
    return
  }

  // 2. Cloud Audio Stream Engine (Default fallback & Screen-lock background playback)
  if (synth) synth.cancel()

  if (!audioPlayer) {
    audioPlayer = new Audio()
  }

  const ttsAudioUrl = `/api/source/alicesw/tts?text=${encodeURIComponent(textToSpeak)}&lang=vi`
  audioPlayer.src = ttsAudioUrl
  audioPlayer.playbackRate = ttsRate || 1.0

  audioPlayer.onended = () => {
    const state = useReaderStore.getState()
    state.setTtsCursor(state.ttsCursor + 1)
    if (state.ttsPlaying) {
      setTimeout(() => playTts(), 50)
    }
  }

  audioPlayer.onerror = (e) => {
    console.error('Audio Stream TTS Error:', e)
    setTtsPlaying(false)
    releaseWakeLock()
  }

  audioPlayer
    .play()
    .then(() => {
      setTtsPlaying(true)
    })
    .catch((err) => {
      console.error('Audio Stream Play Failed:', err)
      setTtsPlaying(false)
      releaseWakeLock()
    })
}

export function pauseTts() {
  if (synth) synth.cancel()
  if (audioPlayer) audioPlayer.pause()
  useReaderStore.getState().setTtsPlaying(false)
  releaseWakeLock()
}

export function stopTts() {
  if (synth) synth.cancel()
  if (audioPlayer) {
    audioPlayer.pause()
    audioPlayer.currentTime = 0
  }
  useReaderStore.getState().setTtsPlaying(false)
  useReaderStore.getState().setTtsCursor(0)
  releaseWakeLock()
}
