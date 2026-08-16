import { useEffect, useState } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { playTts, pauseTts, stopTts } from '@/lib/tts'
import { useUiStore } from '@/stores/useUiStore'
import './TtsTab.css'

export default function TtsTab() {
  const { ttsPlaying, ttsActive, setTtsActive, ttsVoice, setTtsVoice, ttsRate, setTtsRate } = useReaderStore()
  const { setSidebarOpen } = useUiStore()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices()
      // Filter for Vietnamese or fallback to all
      const viVoices = allVoices.filter(v => v.lang.includes('vi'))
      setVoices(viVoices.length > 0 ? viVoices : allVoices)
      
      if (!ttsVoice && allVoices.length > 0) {
        setTtsVoice(viVoices[0] || allVoices[0])
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTtsActive(e.target.checked)
    if (!e.target.checked) {
      stopTts()
    }
  }

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = voices.find(v => v.voiceURI === e.target.value)
    if (v) setTtsVoice(v)
  }

  const handlePlay = () => {
    if (ttsPlaying) pauseTts()
    else {
      playTts()
      if (window.innerWidth <= 600) setSidebarOpen(false)
    }
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      <div className="sp-section">
        <div className="sp-row">
          <label>Bật tính năng Nghe (TTS)</label>
          <input
            type="checkbox"
            className="toggle"
            checked={ttsActive}
            onChange={handleToggleActive}
          />
        </div>
      </div>

      {ttsActive && (
        <>
          <div className="sp-section">
            <div className="sp-label">GIỌNG ĐỌC</div>
            <select className="tts-select" value={ttsVoice?.voiceURI || ''} onChange={handleVoiceChange}>
              {voices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="sp-section">
            <div className="sp-row">
              <label>Tốc độ đọc: {ttsRate}x</label>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={ttsRate}
                onChange={e => setTtsRate(parseFloat(e.target.value))}
                style={{ width: '150px' }}
              />
            </div>
          </div>

          <div className="tts-controls">
            <button className="tts-btn tts-btn-stop" onClick={stopTts} disabled={!ttsPlaying}>
              <i className="ti ti-player-stop" />
            </button>
            <button className="tts-btn tts-btn-play" onClick={handlePlay}>
              <i className={`ti ${ttsPlaying ? 'ti-player-pause' : 'ti-player-play'}`} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
