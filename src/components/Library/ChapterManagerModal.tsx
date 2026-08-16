import { useState } from 'react'
import type { Book, Chapter } from '@/types'
import { isIntroChapter } from '@/lib/parser'
import { formatCleanChapterTitle } from '@/lib/chineseNumerals'
import './ChapterManagerModal.css'

interface ChapterManagerModalProps {
  book: Book
  onClose: () => void
  onSave: (updatedChapters: Chapter[]) => Promise<void>
}

export default function ChapterManagerModal({ book, onClose, onSave }: ChapterManagerModalProps) {
  const [chapters, setChapters] = useState<Chapter[]>(() =>
    book.chapters.map((ch) => ({ ...ch }))
  )
  const [search, setSearch] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Chapter>({ title: '', content: '' })
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<{
    title: string
    customNumber: string
    content: string
    insertPosition: 'end' | 'start' | 'after'
    afterIndex: number
  }>({
    title: '',
    customNumber: '',
    content: '',
    insertPosition: 'end',
    afterIndex: chapters.length > 0 ? chapters.length - 1 : 0,
  })

  const [saving, setSaving] = useState(false)

  const filteredIndices = chapters
    .map((_, idx) => idx)
    .filter((idx) => {
      if (!search.trim()) return true
      const ch = chapters[idx]
      const q = search.toLowerCase()
      return (
        ch.title.toLowerCase().includes(q) ||
        (idx + 1).toString() === q
      )
    })

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx)
    setEditForm({ ...chapters[idx] })
  }

  const handleSaveEdit = () => {
    if (editingIndex === null) return
    const next = [...chapters]
    next[editingIndex] = { ...editForm }
    setChapters(next)
    setEditingIndex(null)
  }

  const handleDelete = (idx: number) => {
    if (confirm(`Bạn có chắc chắn muốn xóa chương "${chapters[idx].title}"?`)) {
      const next = chapters.filter((_, i) => i !== idx)
      setChapters(next)
      if (editingIndex === idx) setEditingIndex(null)
    }
  }

  const handleConfirmAdd = () => {
    if (!addForm.title.trim() && !addForm.content.trim()) {
      alert('Vui lòng nhập tên chương hoặc nội dung.')
      return
    }

    const newCh: Chapter = {
      title: addForm.title.trim() || `Chương ${chapters.length + 1}`,
      content: addForm.content.trim(),
      customNumber: addForm.customNumber.trim() || undefined,
      isIntro: /^giới thiệu$|^lời tựa$|^chương 0$/i.test(addForm.title.trim()),
    }

    const next = [...chapters]
    if (addForm.insertPosition === 'start') {
      next.unshift(newCh)
    } else if (addForm.insertPosition === 'end') {
      next.push(newCh)
    } else if (addForm.insertPosition === 'after') {
      const insertAt = Math.min(Math.max(0, addForm.afterIndex + 1), next.length)
      next.splice(insertAt, 0, newCh)
    }

    setChapters(next)
    setShowAddModal(false)
    setAddForm({
      title: '',
      customNumber: '',
      content: '',
      insertPosition: 'end',
      afterIndex: next.length > 0 ? next.length - 1 : 0,
    })
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await onSave(chapters)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra khi lưu danh sách chương.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-box" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <div>
            <h2><i className="ti ti-list-check" /> Quản lý Chương</h2>
            <p>Thêm, chỉnh sửa tên chương hoặc số chương tùy chỉnh (x.5, x.1, 序章...)</p>
          </div>
          <button className="cm-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cm-toolbar">
          <div className="cm-search">
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Tìm theo tên chương hoặc số thứ tự..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}>×</button>}
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-plus" /> Thêm chương mới
          </button>
        </div>

        <div className="cm-list">
          {filteredIndices.length === 0 ? (
            <div className="cm-empty">Không tìm thấy chương nào.</div>
          ) : (
            filteredIndices.map((idx) => {
              const ch = chapters[idx]
              const isEditing = editingIndex === idx
              const isIntro = isIntroChapter(ch)

              return (
                <div key={idx} className={`cm-item ${isEditing ? 'editing' : ''}`}>
                  {isEditing ? (
                    <div className="cm-edit-form">
                      <div className="cm-form-grid">
                        <div className="cm-field">
                          <label>Tên chương:</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="e.g. Chương 44.5: Luyện tập hoặc 序章"
                          />
                        </div>
                        <div className="cm-field">
                          <label>Số chương tùy chỉnh (tuỳ chọn):</label>
                          <input
                            type="text"
                            value={editForm.customNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, customNumber: e.target.value || undefined })}
                            placeholder="e.g. 44.5 hoặc 0"
                          />
                        </div>
                      </div>
                      <div className="cm-field">
                        <label>Nội dung văn bản chương:</label>
                        <textarea
                          rows={6}
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          placeholder="Nội dung chương..."
                        />
                      </div>
                      <div className="cm-edit-actions">
                        <button className="btn-ghost" onClick={() => setEditingIndex(null)}>Hủy</button>
                        <button className="btn-primary" onClick={handleSaveEdit}>Lưu chương này</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="cm-item-info">
                        <span className="cm-idx">#{idx + 1}</span>
                        <div className="cm-item-main">
                          <div className="cm-item-title-row">
                            <span className="cm-item-title">{formatCleanChapterTitle(ch.title, idx) || '(Không có tên)'}</span>
                            {isIntro && <span className="cm-badge intro">Giới thiệu</span>}
                            {ch.customNumber && <span className="cm-badge num">Số: {ch.customNumber}</span>}
                          </div>
                        </div>
                        <span className="cm-len">{ch.content.length.toLocaleString()} ký tự</span>
                      </div>
                      <div className="cm-item-actions">
                        <button className="cm-action-btn" title="Chỉnh sửa chương" onClick={() => handleStartEdit(idx)}>
                          <i className="ti ti-edit" />
                        </button>
                        <button className="cm-action-btn delete" title="Xóa chương" onClick={() => handleDelete(idx)}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="cm-footer">
          <div className="cm-stats">
            Tổng: <strong>{chapters.length} chương</strong>
          </div>
          <div className="cm-footer-btns">
            <button className="btn-ghost" onClick={onClose} disabled={saving}>Hủy thay đổi</button>
            <button className="btn-primary" onClick={handleSaveAll} disabled={saving}>
              {saving ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-check" />} Lưu tất cả
            </button>
          </div>
        </div>

        {/* Add Chapter Modal */}
        {showAddModal && (
          <div className="cm-add-overlay" onClick={() => setShowAddModal(false)}>
            <div className="cm-add-box" onClick={(e) => e.stopPropagation()}>
              <div className="cm-add-header">
                <h3><i className="ti ti-plus" /> Thêm Chương mới</h3>
                <button onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="cm-add-body">
                <div className="cm-field">
                  <label>Tên chương / Tiêu đề:</label>
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    placeholder="e.g. Chương 44.5: Ngoại truyện, 序章, hoặc Chương Luyện Tập"
                  />
                </div>
                <div className="cm-form-grid">
                  <div className="cm-field">
                    <label>Số chương tùy chỉnh (x.5, x.1...):</label>
                    <input
                      type="text"
                      value={addForm.customNumber}
                      onChange={(e) => setAddForm({ ...addForm, customNumber: e.target.value })}
                      placeholder="e.g. 44.5, 1.1 hoặc 0"
                    />
                  </div>
                </div>
                <div className="cm-field">
                  <label>Vị trí chèn:</label>
                  <div className="cm-pos-radio">
                    <label>
                      <input
                        type="radio"
                        checked={addForm.insertPosition === 'end'}
                        onChange={() => setAddForm({ ...addForm, insertPosition: 'end' })}
                      />
                      Cuối truyện
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={addForm.insertPosition === 'start'}
                        onChange={() => setAddForm({ ...addForm, insertPosition: 'start' })}
                      />
                      Đầu truyện
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={addForm.insertPosition === 'after'}
                        onChange={() => setAddForm({ ...addForm, insertPosition: 'after' })}
                      />
                      Sau chương thứ:
                    </label>
                  </div>
                  {addForm.insertPosition === 'after' && (
                    <select
                      value={addForm.afterIndex}
                      onChange={(e) => setAddForm({ ...addForm, afterIndex: Number(e.target.value) })}
                      style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--paper3)', background: 'var(--paper)', color: 'var(--ink)' }}
                    >
                      {chapters.map((c, i) => (
                        <option key={i} value={i}>
                          #{i + 1} - {formatCleanChapterTitle(c.title, i) || `Chương ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="cm-field">
                  <label>Nội dung văn bản:</label>
                  <textarea
                    rows={8}
                    value={addForm.content}
                    onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                    placeholder="Dán hoặc gõ nội dung chương vào đây..."
                  />
                </div>
              </div>
              <div className="cm-add-footer">
                <button className="btn-ghost" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button className="btn-primary" onClick={handleConfirmAdd}>Thêm vào danh sách</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
