import { useReaderStore } from '@/stores/useReaderStore'
import { useTranslateStore } from '@/stores/useTranslateStore'
import { translator } from '@/lib/translator'
import type { TtsWord } from '@/types'

// Global references for TTS
let synth: SpeechSynthesis | null = null
let utterance: SpeechSynthesisUtterance | null = null

export function initTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    synth = window.speechSynthesis
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
  if (!synth) return

  const {
    ttsWords,
    ttsCursor,
    ttsVoice,
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
      setTimeout(() => {
        playTts()
      }, 500)
    } else {
      setTtsPlaying(false)
    }
    return
  }

  const word = ttsWords[ttsCursor]
  if (!word) return

  // Translate text before reading if translate mode is enabled
  let textToSpeak = word.text
  if (applyDict && mode !== 'off') {
    textToSpeak = translator.translateText(textToSpeak)
  }

  utterance = new SpeechSynthesisUtterance(textToSpeak)
  if (ttsVoice) utterance.voice = ttsVoice
  utterance.rate = ttsRate
  utterance.lang = 'vi-VN'

  utterance.onend = () => {
    setTtsCursor(ttsCursor + 1)
    setTimeout(() => {
      if (useReaderStore.getState().ttsPlaying) {
        playTts()
      }
    }, 50)
  }

  utterance.onerror = (e) => {
    console.error('TTS Error:', e)
    setTtsPlaying(false)
  }

  synth.speak(utterance)
  setTtsPlaying(true)
}

export function pauseTts() {
  if (!synth) return
  synth.cancel()
  useReaderStore.getState().setTtsPlaying(false)
}

export function stopTts() {
  if (!synth) return
  synth.cancel()
  useReaderStore.getState().setTtsPlaying(false)
  useReaderStore.getState().setTtsCursor(0)
}
