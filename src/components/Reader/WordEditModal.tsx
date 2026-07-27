import { useState, useEffect, useMemo } from 'react'
import { useTranslateStore } from '@/stores/useTranslateStore'
import { convertohanviets } from '@/lib/hanviet'
import { translator, type TranslatedToken } from '@/lib/translator'
import './WordEditModal.css'

interface WordEditModalProps {
  token: TranslatedToken
  bookTitle: string
  chapterIndex: number
  onClose: () => void
}

export default function WordEditModal({
  token,
  bookTitle,
  chapterIndex,
  onClose,
}: WordEditModalProps) {
  const { saveUserCustomName, removeUserCustomName, activeCustomNames } = useTranslateStore()

  const [paragraphText, setParagraphText] = useState(token.paragraphText || '')
  const [charStart, setCharStart] = useState<number>(token.charStart ?? -1)
  const [charEnd, setCharEnd] = useState<number>(token.charEnd ?? -1)

  const [zh, setZh] = useState(token.zh)
  const [vi, setVi] = useState(token.vi)
  const [vpMeaning, setVpMeaning] = useState(token.vi)
  const [scope, setScope] = useState<'chapter' | 'global' | 'global_all'>('global')
  const [isBlacklist, setIsBlacklist] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Re-calculate Hanviet whenever Chinese phrase changes
  const hanviet = convertohanviets(zh)

  // Get alternative meanings from dictionaries
  const altMeanings = useMemo(() => {
    return translator.getAltMeanings(zh)
  }, [zh])

  // Check if this zh phrase already exists in custom names
  const existing = activeCustomNames.find((e) => e.zh === zh)

  useEffect(() => {
    let pText = token.paragraphText || ''
    let cStart = token.charStart ?? -1
    let cEnd = token.charEnd ?? -1

    if (pText && cStart < 0 && token.zh) {
      cStart = pText.indexOf(token.zh)
      if (cStart >= 0) {
        cEnd = cStart + token.zh.length
      }
    }

    setParagraphText(pText)
    setCharStart(cStart)
    setCharEnd(cEnd)
    setZh(token.zh)

    if (existing) {
      setVi(existing.vi)
      setVpMeaning(existing.vi)
      setIsBlacklist(!!existing.isBlacklist)
      if (existing.chapterIndex === 'global_all') {
        setScope('global_all')
      } else if (existing.chapterIndex === 'global') {
        setScope('global')
      } else {
        setScope('chapter')
      }
    } else {
      setVi(token.vi)
      setVpMeaning(token.vi)
      setIsBlacklist(false)
    }
  }, [token, existing])

  // Helper to update range when expanding / shrinking selection
  const updateRange = (newStart: number, newEnd: number) => {
    if (!paragraphText || newStart < 0 || newEnd > paragraphText.length || newStart >= newEnd) return
    const newZh = paragraphText.substring(newStart, newEnd)
    setCharStart(newStart)
    setCharEnd(newEnd)
    setZh(newZh)

    // Auto set Hán Việt as default for names or auto-translate
    const newHv = convertohanviets(newZh)
    const newVi = translator.translateText(newZh) || newHv
    setVi(newVi)
    setVpMeaning(newVi)
  }

  const handleExpandLeft = () => {
    if (charStart > 0) updateRange(charStart - 1, charEnd)
  }

  const handleShrinkLeft = () => {
    if (charStart < charEnd - 1) updateRange(charStart + 1, charEnd)
  }

  const handleExpandRight = () => {
    if (paragraphText && charEnd < paragraphText.length) updateRange(charStart, charEnd + 1)
  }

  const handleShrinkRight = () => {
    if (charEnd > charStart + 1) updateRange(charStart, charEnd - 1)
  }

  // Capitalize all words (e.g. "tiêu viêm" -> "Tiêu Viêm")
  const handleCapitalizeAll = () => {
    if (!vi) return
    const words = vi.split(/(\s+)/)
    const capped = words
      .map((w) => {
        if (/^\s+$/.test(w) || !w) return w
        return w.charAt(0).toUpperCase() + w.slice(1)
      })
      .join('')
    setVi(capped)
  }

  // Capitalize first letter
  const handleCapitalizeFirst = () => {
    if (!vi) return
    const trimmed = vi.trim()
    if (!trimmed) return
    const words = vi.split(/(\s+)/)
    let firstFound = false
    const result = words.map((w) => {
      if (/^\s+$/.test(w) || !w) return w
      if (!firstFound) {
        firstFound = true
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      }
      return w.toLowerCase()
    })
    setVi(result.join(''))
  }

  // Lowercase the last word
  const handleLowercaseLast = () => {
    if (!vi) return
    const words = vi.split(/(\s+)/)
    for (let i = words.length - 1; i >= 0; i--) {
      if (/\S/.test(words[i])) {
        if (words[i] !== words[i].toLowerCase()) {
          words[i] = words[i].toLowerCase()
          break
        }
      }
    }
    setVi(words.join(''))
  }

  // Lowercase all
  const handleLowercase = () => {
    if (!vi) return
    setVi(vi.toLowerCase())
  }

  // Convert directly to Hán Việt (e.g. "夏青珊" -> "Hạ Thanh San")
  const getFormattedHanviet = (text: string) => {
    const hvString = convertohanviets(text)
    if (!hvString) return ''
    const words = hvString.split(/\s+/).filter(Boolean)
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  const formattedHv = useMemo(() => getFormattedHanviet(zh), [zh])

  const handleToggleHanviet = () => {
    if (vi === formattedHv) {
      const fallbackVp = vpMeaning !== formattedHv ? vpMeaning : (translator.translateText(zh) || '')
      setVi(fallbackVp !== formattedHv ? fallbackVp : vpMeaning)
    } else {
      setVpMeaning(vi)
      setVi(formattedHv)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setVi(val)
    if (val !== formattedHv) {
      setVpMeaning(val)
    }
  }

  const handleSave = async () => {
    if (!zh.trim()) return
    if (!isBlacklist && !vi.trim()) return

    const targetChapter = scope === 'chapter' ? chapterIndex : (scope === 'global_all' ? 'global_all' : 'global')
    await saveUserCustomName(bookTitle, targetChapter, zh.trim(), vi.trim(), isBlacklist)

    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 500)
  }

  const handleDeleteExisting = async () => {
    if (!existing) return
    await removeUserCustomName(existing.key, bookTitle, chapterIndex)
    onClose()
  }

  // Chinese context previews
  const prevContextZh =
    paragraphText && charStart > 0
      ? paragraphText.substring(Math.max(0, charStart - 8), charStart)
      : ''
  const nextContextZh =
    paragraphText && charEnd < paragraphText.length
      ? paragraphText.substring(charEnd, Math.min(paragraphText.length, charEnd + 8))
      : ''

  return (
    <div className="word-modal-backdrop" onClick={onClose}>
      <div className="word-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="word-modal-body">
          {/* Chinese Range Selection Control (Simple line, no title/border, raw zh) */}
          {paragraphText && charStart >= 0 && charEnd >= 0 && (
            <div className="word-expand-compact">
              <div className="expand-compact-row">
                {/* Left controls */}
                <div className="expand-icon-group">
                  <button
                    type="button"
                    className="btn-icon-expand"
                    onClick={handleExpandLeft}
                    disabled={charStart <= 0}
                    title="Mở rộng sang trái (+1 từ)"
                  >
                    <i className="ti ti-chevron-left" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-expand"
                    onClick={handleShrinkLeft}
                    disabled={charStart >= charEnd - 1}
                    title="Thu hẹp từ bên trái (-1 từ)"
                  >
                    <i className="ti ti-minus" />
                  </button>
                </div>

                {/* Context preview in raw Chinese */}
                <div className="word-context-preview flex-1">
                  <span className="ctx-dim prev" dir="rtl">{prevContextZh}</span>
                  <span className="ctx-active">{zh}</span>
                  <span className="ctx-dim next">{nextContextZh}</span>
                </div>

                {/* Right controls */}
                <div className="expand-icon-group">
                  <button
                    type="button"
                    className="btn-icon-expand"
                    onClick={handleShrinkRight}
                    disabled={charEnd <= charStart + 1}
                    title="Thu hẹp từ bên phải (-1 từ)"
                  >
                    <i className="ti ti-minus" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-expand"
                    onClick={handleExpandRight}
                    disabled={charEnd >= paragraphText.length}
                    title="Mở rộng sang phải (+1 từ)"
                  >
                    <i className="ti ti-chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Field with integrated Hanviet button */}
          <div className="word-box">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <input
                type="text"
                className="word-box-input focus-highlight"
                style={{ paddingRight: '42px', width: '100%' }}
                value={vi}
                onChange={handleInputChange}
                placeholder={isBlacklist ? "Blacklist - Sẽ bị bỏ qua khi dịch" : "Nhập nghĩa dịch mong muốn..."}
                disabled={isBlacklist}
              />
              <button
                type="button"
                onClick={handleToggleHanviet}
                disabled={isBlacklist}
                className="btn-inside-input-hv"
                title={vi === formattedHv ? "Click để chuyển về nghĩa Vietphrase" : `Click để chuyển sang Hán Việt (${hanviet})`}
              >
                <i className="ti ti-language" />
              </button>
            </div>

            {/* Alternative meanings from dictionaries */}
            {altMeanings.length > 0 && (
              <div className="alt-meanings-group">
                <span className="alt-label">Các nghĩa khác:</span>
                <div className="alt-chips">
                  {altMeanings.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn-alt-chip ${vi === m ? 'active' : ''}`}
                      onClick={() => setVi(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Capitalization & Format Actions */}
            <div className="word-transform-actions">
              <button
                type="button"
                className="btn-transform"
                onClick={handleCapitalizeAll}
                title="Viết hoa tất cả các từ"
              >
                Hoa toàn bộ
              </button>

              <button
                type="button"
                className="btn-transform"
                onClick={handleCapitalizeFirst}
                title="Viết hoa chữ cái đầu tiên"
              >
                Đầu câu
              </button>

              <button
                type="button"
                className="btn-transform"
                onClick={handleLowercaseLast}
                title="Chuyển từ cuối cùng thành chữ thường"
              >
                Thường chữ cuối
              </button>

              <button
                type="button"
                className="btn-transform"
                onClick={handleLowercase}
                title="Chuyển tất cả thành chữ thường"
              >
                Thường toàn bộ
              </button>
            </div>
          </div>

          {/* Minimalist Scope selection */}
          <div className="word-box scope-box-minimal">
            <span className="word-box-label">Phạm vi:</span>
            <div className="scope-options-minimal">
              <button
                type="button"
                className={`btn-scope ${scope === 'global_all' ? 'active' : ''}`}
                onClick={() => setScope('global_all')}
              >
                Mọi truyện
              </button>

              <button
                type="button"
                className={`btn-scope ${scope === 'global' ? 'active' : ''}`}
                onClick={() => setScope('global')}
              >
                Truyện này
              </button>

              <button
                type="button"
                className={`btn-scope ${scope === 'chapter' ? 'active' : ''}`}
                onClick={() => setScope('chapter')}
              >
                Chỉ chương này
              </button>
            </div>
          </div>

          <div className="word-box scope-box-minimal" style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => setIsBlacklist(!isBlacklist)}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink2)' }}>
              <input
                type="checkbox"
                checked={isBlacklist}
                onChange={(e) => setIsBlacklist(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Đưa vào Blacklist (Bỏ qua khi dịch)
            </label>
          </div>

          {savedSuccess && (
            <div className="word-toast-success">
              <i className="ti ti-check" /> Đã lưu name thành công!
            </div>
          )}
        </div>

        <div className="word-modal-foot">
          {existing && (
            <button className="btn-word-delete" onClick={handleDeleteExisting}>
              <i className="ti ti-trash" /> Xóa Name
            </button>
          )}

          <button className="btn-word-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-word-save" onClick={handleSave}>
            <i className="ti ti-device-floppy" /> Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

