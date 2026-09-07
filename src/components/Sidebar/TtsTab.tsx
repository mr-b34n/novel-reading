import { useEffect, useState } from 'react'
import { useReaderStore } from '@/stores/useReaderStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playTts, pauseTts, stopTts } from '@/lib/tts'
import { useUiStore } from '@/stores/useUiStore'
import './TtsTab.css'

export default function TtsTab() {
  const { ttsPlaying, ttsActive, setTtsActive, ttsVoice, setTtsVoice, ttsRate, setTtsRate } = useReaderStore()
  const { settings, updateSettings } = useSettingsStore()
  const { setSidebarOpen } = useUiStore()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const currentEngine = settings.ttsEngine || 'audio'
  const keepAwake = settings.keepScreenAwake ?? true

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      const allVoices = window.speechSynthesis.getVoices()
      // Filter for Vietnamese or fallback to all
      const viVoices = allVoices.filter(v => v.lang.includes('vi'))
      setVoices(viVoices.length > 0 ? viVoices : allVoices)
      
      if (!ttsVoice && allVoices.length > 0) {
        setTtsVoice(viVoices[0] || allVoices[0])
      }
    }

    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
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
            <div className="sp-label">CHẾ ĐỘ ĐỌC (ENGINE)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: currentEngine === 'audio' ? 'rgba(212, 160, 23, 0.12)' : 'var(--bg-card)',
                  border: currentEngine === 'audio' ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <input
                  type="radio"
                  name="ttsEngine"
                  value="audio"
                  checked={currentEngine === 'audio'}
                  onChange={() => updateSettings({ ttsEngine: 'audio' })}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>🔊 Đọc Nền & Màn hình khóa (Khuyên dùng iPhone)</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    Chạy tiếp tục khi tắt/khóa màn hình. Hỗ trợ bảng điều khiển Màn hình khóa (Lockscreen) & Tai nghe / AirPods.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: currentEngine === 'web' ? 'rgba(212, 160, 23, 0.12)' : 'var(--bg-card)',
                  border: currentEngine === 'web' ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <input
                  type="radio"
                  name="ttsEngine"
                  value="web"
                  checked={currentEngine === 'web'}
                  onChange={() => updateSettings({ ttsEngine: 'web' })}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>🎙️ Giọng đọc Trình duyệt (SpeechSynthesis)</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    Dùng giọng sẵn có của thiết bị. (iOS sẽ dừng khi khóa màn hình).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {currentEngine === 'web' && voices.length > 0 && (
            <div className="sp-section">
              <div className="sp-label">GIỌNG ĐỌC HỆ THỐNG</div>
              <select className="tts-select" value={ttsVoice?.voiceURI || ''} onChange={handleVoiceChange}>
                {voices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sp-section">
            <div className="sp-row">
              <label style={{ fontSize: 13 }}>Giữ màn hình luôn sáng khi đọc</label>
              <input
                type="checkbox"
                className="toggle"
                checked={keepAwake}
                onChange={e => updateSettings({ keepScreenAwake: e.target.checked })}
              />
            </div>
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
