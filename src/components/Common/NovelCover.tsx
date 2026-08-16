import React, { useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import './NovelCover.css'

interface NovelCoverProps {
  src?: string | null
  alt?: string
  novelIdOrName?: string | null
  className?: string
  containerClassName?: string
  fallbackTheme?: { bg: string; text: string; accent: string }
  totalChapters?: number
  showQuickToggle?: boolean
  showBadgeOnBlurred?: boolean
  style?: React.CSSProperties
  imgStyle?: React.CSSProperties
  onClick?: (e: React.MouseEvent) => void
  loading?: 'lazy' | 'eager'
}

export default function NovelCover({
  src,
  alt = 'Bìa truyện',
  novelIdOrName,
  className = '',
  containerClassName = '',
  fallbackTheme,
  totalChapters,
  showQuickToggle = true,
  showBadgeOnBlurred = false,
  style,
  imgStyle,
  onClick,
  loading = 'lazy',
}: NovelCoverProps) {
  const { settings, isCoverBlurred, toggleNovelBlur } = useSettingsStore()
  const [imgError, setImgError] = useState(false)
  const [tempReveal, setTempReveal] = useState(false)

  const isGloballyBlurred = isCoverBlurred(novelIdOrName)
  const isBlurred = isGloballyBlurred && !tempReveal
  const blurPx = settings.blurIntensity || 14
  const unblurOnHover = settings.unblurOnHover !== false

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (novelIdOrName) {
      toggleNovelBlur(novelIdOrName)
    } else {
      setTempReveal(!tempReveal)
    }
  }

  const effectiveSrc = !imgError && src ? src : null

  return (
    <div
      className={`nc-container ${containerClassName} ${isBlurred ? 'nc-is-blurred' : ''} ${
        unblurOnHover ? 'nc-hover-unblur' : ''
      }`}
      style={{
        ...style,
        ['--cover-blur-px' as any]: `${blurPx}px`,
      }}
      onClick={onClick}
    >
      {effectiveSrc ? (
        <img
          src={effectiveSrc}
          alt={alt}
          loading={loading}
          className={`nc-image ${className} ${isBlurred ? 'nc-blurred-img' : ''}`}
          style={imgStyle}
          onError={() => setImgError(true)}
        />
      ) : fallbackTheme ? (
        <div
          className={`nc-fallback ${className}`}
          style={{ background: fallbackTheme.bg, color: fallbackTheme.text, ...imgStyle }}
        >
          <div className="nc-fb-border" style={{ borderColor: fallbackTheme.accent }}>
            <span className="nc-fb-ornament" style={{ color: fallbackTheme.accent }}>
              ❦
            </span>
            <span className="nc-fb-title">{alt || novelIdOrName || 'Truyện'}</span>
            {totalChapters !== undefined && (
              <span
                className="nc-fb-badge"
                style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: fallbackTheme.accent }}
              >
                {totalChapters} chương
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`nc-default-fallback ${className}`} style={imgStyle}>
          <i className="ti ti-book" />
          <span>{alt || novelIdOrName || 'Truyện'}</span>
        </div>
      )}

      {/* Quick Reveal / Blur indicator and toggle button */}
      {showQuickToggle && effectiveSrc && (
        <div className="nc-overlay-actions">
          <button
            type="button"
            className={`nc-quick-btn ${isBlurred ? 'blurred' : 'revealed'}`}
            onClick={handleToggleClick}
            title={
              isGloballyBlurred
                ? 'Bìa đang làm mờ. Bấm để bỏ làm mờ truyện này trong cài đặt'
                : 'Bìa đang hiển thị rõ. Bấm để bật làm mờ truyện này'
            }
          >
            <i className={isBlurred ? 'ti ti-eye-off' : 'ti ti-eye'} />
            <span className="nc-quick-btn-tooltip">
              {isBlurred ? 'Mở khóa bìa' : 'Làm mờ bìa'}
            </span>
          </button>
        </div>
      )}

      {/* Small badge when blurred if requested */}
      {showBadgeOnBlurred && isBlurred && (
        <div className="nc-blurred-badge">
          <i className="ti ti-shield-check" /> Đã làm mờ
        </div>
      )}
    </div>
  )
}
