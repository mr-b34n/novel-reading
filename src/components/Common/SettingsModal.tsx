import React from 'react'
import ReadTab from '@/components/Sidebar/ReadTab'
import './SettingsModal.css'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div className="set-modal-backdrop" onClick={onClose}>
      <div className="set-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-header">
          <div className="set-modal-title">
            <i className="ti ti-settings" style={{ color: 'var(--gold)', fontSize: '1.25rem' }} />
            <span>Cài Đặt Hệ Thống & Giao Diện</span>
          </div>
          <button className="set-modal-close" onClick={onClose} title="Đóng">
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="set-modal-body">
          <ReadTab />
        </div>
      </div>
    </div>
  )
}
