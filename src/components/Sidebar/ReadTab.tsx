import { useSettingsStore } from '@/stores/useSettingsStore'

export default function ReadTab() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  const fonts = [
    { id: 'Lora', label: 'Lora' },
    { id: 'Inter', label: 'Inter' },
    { id: 'Arial', label: 'Arial' },
    { id: 'Times New Roman', label: 'Times' },
  ]

  const bgColors = [
    '#faf7f2', // Giấy
    '#ffffff', // Trắng
    '#f4ecd8', // Vàng nhạt
    '#e0e8f0', // Xanh nhạt
    '#222222', // Đen
  ]

  return (
    <div style={{ paddingBottom: 20 }}>
      <div className="sp-section">
        <div className="sp-row">
          <label>Chế độ tối (Global)</label>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.globalDark}
            onChange={(e) => updateSettings({ globalDark: e.target.checked })}
          />
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-label">MÀU NỀN ĐỌC (MÁY TÍNH)</div>
        <div className="bg-swatches" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {bgColors.map((bg) => (
            <div
              key={bg}
              onClick={() => updateSettings({ bgColor: bg, textColor: bg === '#222222' ? '#e0e0e0' : '#1a1612' })}
              style={{
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                background: bg, border: settings.bgColor === bg ? '2.5px solid var(--gold)' : '2.5px solid var(--paper3)'
              }}
            />
          ))}
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-label">FONT CHỮ</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {fonts.map((f) => (
            <button
              key={f.id}
              className={`btn-ghost ${settings.font === f.id ? 'active' : ''}`}
              style={{ padding: '6px 12px', minWidth: 0 }}
              onClick={() => updateSettings({ font: f.id })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-row">
          <label>Cỡ chữ (px)</label>
          <input
            type="number"
            className="sp-num"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
          />
        </div>
        <div className="sp-row">
          <label>Giãn dòng</label>
          <input
            type="number"
            step="0.1"
            className="sp-num"
            value={settings.lineH}
            onChange={(e) => updateSettings({ lineH: Number(e.target.value) })}
          />
        </div>
        <div className="sp-row">
          <label>Chiều rộng (px)</label>
          <input
            type="number"
            step="10"
            className="sp-num"
            value={settings.width}
            onChange={(e) => updateSettings({ width: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-row">
          <label>Căn đều hai bên (Justify)</label>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.justify}
            onChange={(e) => updateSettings({ justify: e.target.checked })}
          />
        </div>
        <div className="sp-row">
          <label>Chữ to đầu dòng (Dropcap)</label>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.dropcap}
            onChange={(e) => updateSettings({ dropcap: e.target.checked })}
          />
        </div>
        <div className="sp-row">
          <label>Vuốt để qua chương (Mobile)</label>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.swipeToChange ?? true}
            onChange={(e) => updateSettings({ swipeToChange: e.target.checked })}
          />
        </div>
      </div>

      <div className="sp-section" style={{ border: 'none', marginTop: 10 }}>
        <button className="btn-ghost" style={{ width: '100%' }} onClick={resetSettings}>
          Khôi phục mặc định
        </button>
      </div>
    </div>
  )
}
