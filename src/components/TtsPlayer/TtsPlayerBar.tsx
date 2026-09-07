import { useState, useEffect } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playTts, pauseTts, stopTts } from '@/lib/tts'
import './TtsPlayerBar.css'

function detectOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { name: 'Hệ điều hành', icon: 'ti-device-desktop' }
  }
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''

  const isIOS = /iPhone|iPad|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isMac = /Macintosh|Mac OS X/.test(ua) && !isIOS
  const isWindows = /Windows/.test(ua)

  if (isIOS) return { name: 'iOS (iPhone / iPad)', icon: 'ti-brand-apple' }
  if (isAndroid) return { name: 'Android', icon: 'ti-brand-android' }
  if (isMac) return { name: 'macOS', icon: 'ti-brand-apple' }
  if (isWindows) return { name: 'Windows', icon: 'ti-brand-windows' }
  return { name: 'Thiết bị', icon: 'ti-device-desktop' }
}

export default function TtsPlayerBar() {
  const {
    ttsWords,
    ttsCursor,
    setTtsCursor,
    ttsPlaying,
    ttsVoice,
    setTtsVoice,
    ttsRate,
    setTtsRate,
    chapters,
    currentChapter,
    setCurrentChapter,
  } = useReaderStore()

  const { settings, updateSettings } = useSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [osInfo] = useState(detectOS())

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      const allVoices = window.speechSynthesis.getVoices()
      // Sort Vietnamese voices to the top
      const sorted = [...allVoices].sort((a, b) => {
        const aVi = a.lang.toLowerCase().includes('vi')
        const bVi = b.lang.toLowerCase().includes('vi')
        if (aVi && !bVi) return -1
        if (!aVi && bVi) return 1
        return a.name.localeCompare(b.name)
      })
      setVoices(sorted)
    }

    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (!value) {
      setTtsVoice(null)
    } else {
      const selected = voices.find((v) => v.voiceURI === value) || null
      setTtsVoice(selected)
    }
    if (ttsPlaying) {
      setTimeout(() => playTts(), 50)
    }
  }

  const chapter = chapters[currentChapter]
  const totalWords = ttsWords.length
  const progressPercent = totalWords > 0 ? Math.round(((ttsCursor + 1) / totalWords) * 100) : 0

  const handleSeek = (newCursor: number) => {
    const clamped = Math.max(0, Math.min(totalWords - 1, newCursor))
    setTtsCursor(clamped)
    if (ttsPlaying) {
      setTimeout(() => {
        playTts()
      }, 50)
    }
  }

  const handlePlayPause = () => {
    if (ttsPlaying) {
      pauseTts()
    } else {
      playTts()
    }
  }

  const handleStop = () => {
    stopTts()
  }

  const handlePrevSentence = () => {
    if (ttsCursor > 0) {
      handleSeek(ttsCursor - 1)
    }
  }

  const handleNextSentence = () => {
    if (ttsCursor < totalWords - 1) {
      handleSeek(ttsCursor + 1)
    }
  }

  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
      setTtsCursor(0)
      if (ttsPlaying) {
        setTimeout(() => playTts(), 200)
      }
    }
  }

  const handleNextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1)
      setTtsCursor(0)
      if (ttsPlaying) {
        setTimeout(() => playTts(), 200)
      }
    }
  }

  return (
    <div className="tts-player-bar-wrap">
      {/* Settings Popup Menu */}
      {showSettings && (
        <div className="tts-settings-popover">
          <div className="tsp-head">
            <span className="tsp-title">
              <i className="ti ti-settings" /> Cài đặt giọng đọc
            </span>
            <button className="tsp-close" onClick={() => setShowSettings(false)}>
              <i className="ti ti-x" />
            </button>
          </div>

          <div className="tsp-body">
            {/* System OS Badge */}
            <div className="tsp-os-badge">
              <i className={`ti ${osInfo.icon}`} />
              <span>Hệ điều hành nhận diện: <strong>{osInfo.name}</strong></span>
            </div>

            {/* Voice Selection */}
            <div className="tsp-row">
              <span className="tsp-label">Chọn giọng đọc:</span>
              <select
                className="tsp-select"
                value={ttsVoice?.voiceURI || ''}
                onChange={handleVoiceChange}
              >
                <option value="">
                  🔊 Mặc định: Luồng Âm Thanh Nền Cloud (Phát khi tắt màn hình)
                </option>

                {voices.length > 0 && (
                  <optgroup label={`Giọng đọc Native HDH (${osInfo.name})`}>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        🎙️ {v.name} ({v.lang}) {v.lang.toLowerCase().includes('vi') ? '★ Tiếng Việt' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="tsp-row">
              <span className="tsp-label">Tốc độ đọc: {ttsRate}x</span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={ttsRate}
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                className="tsp-slider"
              />
            </div>

            <div className="tsp-row-toggle">
              <label htmlFor="keepAwakeToggle">Giữ màn hình luôn sáng khi đọc</label>
              <input
                id="keepAwakeToggle"
                type="checkbox"
                className="toggle"
                checked={settings.keepScreenAwake ?? true}
                onChange={(e) => updateSettings({ keepScreenAwake: e.target.checked })}
              />
            </div>

            <div className="tsp-row-toggle">
              <label htmlFor="highlightToggle">Tự động cuộn theo câu đang đọc</label>
              <input
                id="highlightToggle"
                type="checkbox"
                className="toggle"
                checked={settings.highlightTts ?? true}
                onChange={(e) => updateSettings({ highlightTts: e.target.checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Bar Controls */}
      <div className="tts-player-bar">
        {/* Top Info & Progress Bar */}
        <div className="tpb-top-row">
          <div className="tpb-chapter-info">
            <span className="tpb-ch-title">{chapter ? `#${currentChapter + 1} - ${chapter.title}` : 'Chưa chọn chương'}</span>
            <span className="tpb-pos-badge">{totalWords > 0 ? `${ttsCursor + 1}/${totalWords} (${progressPercent}%)` : '0/0'}</span>
          </div>

          <div className="tpb-slider-wrap">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalWords - 1)}
              value={ttsCursor}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="tpb-progress-slider"
              disabled={totalWords === 0}
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="tpb-controls-row">
          <div className="tpb-btn-group">
            <button
              className="tpb-btn"
              title="Chương trước"
              onClick={handlePrevChapter}
              disabled={currentChapter === 0}
            >
              <i className="ti ti-chevron-left" />
            </button>

            <button
              className="tpb-btn"
              title="Câu trước"
              onClick={handlePrevSentence}
              disabled={ttsCursor === 0}
            >
              <i className="ti ti-player-skip-back" />
            </button>

            <button
              className="tpb-btn tpb-btn-main"
              title={ttsPlaying ? 'Tạm dừng' : 'Phát'}
              onClick={handlePlayPause}
            >
              <i className={`ti ${ttsPlaying ? 'ti-player-pause' : 'ti-player-play'}`} />
            </button>

            <button
              className="tpb-btn"
              title="Dừng đọc"
              onClick={handleStop}
              disabled={!ttsPlaying && ttsCursor === 0}
            >
              <i className="ti ti-player-stop" />
            </button>

            <button
              className="tpb-btn"
              title="Câu sau"
              onClick={handleNextSentence}
              disabled={ttsCursor >= totalWords - 1}
            >
              <i className="ti ti-player-skip-forward" />
            </button>

            <button
              className="tpb-btn"
              title="Chương sau"
              onClick={handleNextChapter}
              disabled={currentChapter === chapters.length - 1}
            >
              <i className="ti ti-chevron-right" />
            </button>
          </div>

          <button
            className={`tpb-btn tpb-btn-settings ${showSettings ? 'active' : ''}`}
            title="Cài đặt TTS"
            onClick={() => setShowSettings(!showSettings)}
          >
            <i className="ti ti-settings" />
          </button>
        </div>
      </div>
    </div>
  )
}
