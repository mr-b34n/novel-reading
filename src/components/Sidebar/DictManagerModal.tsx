import { useRef, useState } from 'react'
import { useTranslateStore } from '@/stores/useTranslateStore'
import './DictManagerModal.css'

export default function DictManagerModal({ onClose }: { onClose: () => void }) {
  const {
    vpCount,
    namesCount,
    luatNhanCount,
    pronounsCount,
    isImporting,
    importProgress,
    importStatus,
    importFile,
    clearStore,
  } = useTranslateStore()
  const vpInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const luatNhanInputRef = useRef<HTMLInputElement>(null)
  const pronounsInputRef = useRef<HTMLInputElement>(null)
  const [confirmDeleteType, setConfirmDeleteType] = useState<{
    type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns'
    label: string
  } | null>(null)

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importFile(file, type)
    if (e.target) e.target.value = ''
  }

  const handleClear = (type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns', label: string) => {
    setConfirmDeleteType({ type, label })
  }

  return (
    <div className="dict-modal-overlay" onClick={onClose}>
      <div className="dict-modal-card" onClick={e => e.stopPropagation()}>
        <div className="dict-modal-head">
          <div className="dict-modal-title">
            <i className="ti ti-book-download" /> Quản lý Từ Điển
          </div>
          <button className="dict-modal-close" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        
        <div className="dict-modal-body">
          <div className="dict-stat-row">
            <span className="dict-stat-label">Từ Vietphrase:</span>
            <span className="dict-stat-val">
              {vpCount.toLocaleString()}
              {vpCount > 0 && (
                <button
                  className="dict-stat-clear"
                  title="Xóa từ điển này"
                  onClick={() => handleClear('vietphrase', 'Vietphrase')}
                >
                  <i className="ti ti-trash" />
                </button>
              )}
            </span>
          </div>
          <div className="dict-stat-row">
            <span className="dict-stat-label">Từ Names (Tên riêng):</span>
            <span className="dict-stat-val">
              {namesCount.toLocaleString()}
              {namesCount > 0 && (
                <button
                  className="dict-stat-clear"
                  title="Xóa từ điển này"
                  onClick={() => handleClear('names', 'Names')}
                >
                  <i className="ti ti-trash" />
                </button>
              )}
            </span>
          </div>
          <div className="dict-stat-row">
            <span className="dict-stat-label">Luật Nhân (Grammar):</span>
            <span className="dict-stat-val">
              {luatNhanCount.toLocaleString()}
              {luatNhanCount > 0 && (
                <button
                  className="dict-stat-clear"
                  title="Xóa từ điển này"
                  onClick={() => handleClear('luatnhan', 'Luật Nhân')}
                >
                  <i className="ti ti-trash" />
                </button>
              )}
            </span>
          </div>
          <div className="dict-stat-row">
            <span className="dict-stat-label">Đại từ nhân xưng:</span>
            <span className="dict-stat-val">
              {pronounsCount.toLocaleString()}
              {pronounsCount > 0 && (
                <button
                  className="dict-stat-clear"
                  title="Xóa từ điển này"
                  onClick={() => handleClear('pronouns', 'Đại từ nhân xưng')}
                >
                  <i className="ti ti-trash" />
                </button>
              )}
            </span>
          </div>

          {confirmDeleteType && (
            <div className="dict-confirm-box">
              <div className="dict-confirm-title">
                <i className="ti ti-alert-triangle" /> Xác nhận xóa từ điển "{confirmDeleteType.label}"?
              </div>
              <div className="dict-confirm-desc">
                Toàn bộ từ trong từ điển này sẽ bị xóa khỏi bộ nhớ thiết bị. Thao tác này không thể hoàn tác.
              </div>
              <div className="dict-confirm-actions">
                <button className="btn-ghost" onClick={() => setConfirmDeleteType(null)}>Hủy</button>
                <button
                  className="dict-btn-danger"
                  onClick={async () => {
                    await clearStore(confirmDeleteType.type)
                    setConfirmDeleteType(null)
                  }}
                >
                  <i className="ti ti-trash" /> Xóa vĩnh viễn
                </button>
              </div>
            </div>
          )}

          <div className="dict-actions">
            <input 
              type="file" 
              accept=".txt" 
              ref={vpInputRef} 
              style={{ display: 'none' }} 
              onChange={e => handleFile(e, 'vietphrase')} 
            />
            <button className="dict-file-btn" onClick={() => vpInputRef.current?.click()} disabled={isImporting}>
              <i className="ti ti-upload" /> Tải lên Vietphrase (.txt)
            </button>

            <input 
              type="file" 
              accept=".txt" 
              ref={nameInputRef} 
              style={{ display: 'none' }} 
              onChange={e => handleFile(e, 'names')} 
            />
            <button className="dict-file-btn" onClick={() => nameInputRef.current?.click()} disabled={isImporting}>
              <i className="ti ti-upload" /> Tải lên Names (.txt)
            </button>

            <input 
              type="file" 
              accept=".txt" 
              ref={luatNhanInputRef} 
              style={{ display: 'none' }} 
              onChange={e => handleFile(e, 'luatnhan')} 
            />
            <button className="dict-file-btn" onClick={() => luatNhanInputRef.current?.click()} disabled={isImporting}>
              <i className="ti ti-upload" /> Tải lên Luật Nhân (.txt)
            </button>

            <input 
              type="file" 
              accept=".txt" 
              ref={pronounsInputRef} 
              style={{ display: 'none' }} 
              onChange={e => handleFile(e, 'pronouns')} 
            />
            <button className="dict-file-btn" onClick={() => pronounsInputRef.current?.click()} disabled={isImporting}>
              <i className="ti ti-upload" /> Tải lên Đại từ (.txt)
            </button>
          </div>

          {importStatus && (
            <div className="dict-status">
              {importStatus}
              {isImporting && importProgress > 0 && ` (${importProgress}%)`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
