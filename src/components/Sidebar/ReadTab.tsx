import { useSettingsStore } from '@/stores/useSettingsStore'

export default function ReadTab() {
  const { settings, updateSettings, resetSettings, toggleNovelBlur, clearUnblurredNovels } = useSettingsStore()

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

  const autoBlur = settings.autoBlurCovers !== false
  const unblurredList = settings.unblurredNovels || []

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Cover Blur Settings Section */}
      <div className="sp-section" style={{ background: 'var(--paper2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--paper3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold)', marginBottom: 10 }}>
          <i className="ti ti-eye-off" style={{ fontSize: '1rem' }} />
          <span>TỰ ĐỘNG LÀM MỜ ẢNH BÌA</span>
        </div>

        <div className="sp-row" style={{ marginBottom: 8 }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Làm mờ tất cả ảnh bìa</label>
          <input
            type="checkbox"
            className="toggle"
            checked={autoBlur}
            onChange={(e) => updateSettings({ autoBlurCovers: e.target.checked })}
          />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink3)', marginBottom: 10, lineHeight: 1.4 }}>
          Tự động làm mờ ảnh bìa toàn bộ truyện trong Thư viện và trên nguồn AliceSW.
        </div>

        {autoBlur && (
          <>
            <div className="sp-row" style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '0.85rem' }}>Bỏ mờ khi rê chuột (Hover)</label>
              <input
                type="checkbox"
                className="toggle"
                checked={settings.unblurOnHover !== false}
                onChange={(e) => updateSettings({ unblurOnHover: e.target.checked })}
              />
            </div>

            <div className="sp-row" style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.85rem' }}>Độ mờ ({settings.blurIntensity || 14}px)</label>
              <input
                type="range"
                min="6"
                max="28"
                step="2"
                style={{ width: '110px', accentColor: 'var(--gold)' }}
                value={settings.blurIntensity || 14}
                onChange={(e) => updateSettings({ blurIntensity: Number(e.target.value) })}
              />
            </div>

            {/* Whitelisted unblurred novels list */}
            <div style={{ borderTop: '1px dashed var(--paper3)', paddingTop: 10, marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink2)' }}>
                  Truyện đã tắt làm mờ ({unblurredList.length}):
                </span>
                {unblurredList.length > 0 && (
                  <button
                    type="button"
                    onClick={clearUnblurredNovels}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Làm mờ lại tất cả
                  </button>
                )}
              </div>

              {unblurredList.length === 0 ? (
                <div style={{ fontSize: '0.76rem', color: 'var(--ink3)', fontStyle: 'italic' }}>
                  (Hiện tất cả truyện đều đang được làm mờ)
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: '120px', overflowY: 'auto' }}>
                  {unblurredList.map((item) => (
                    <span
                      key={item}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'var(--paper)',
                        border: '1px solid var(--paper3)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        color: 'var(--ink)',
                        maxWidth: '100%',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={item}>
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleNovelBlur(item)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', fontSize: '0.85rem' }}
                        title="Bật làm mờ lại truyện này"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
