import { useUiStore } from '@/stores/useUiStore'
import './WelcomeScreen.css'

export default function WelcomeScreen() {
  const { setCurrentView } = useUiStore()

  return (
    <div className="welcome-screen">
      <div className="welcome-logo">NovReader</div>
      <p className="welcome-desc">Trải nghiệm đọc truyện mượt mà, tối giản</p>

      <div className="welcome-features">
        <div className="wf-item">
          <i className="ti ti-typography" />
          <span>Tùy chỉnh font chữ & màu sắc</span>
        </div>
        <div className="wf-item">
          <i className="ti ti-headphones" />
          <span>Nghe đọc truyện (TTS)</span>
        </div>
        <div className="wf-item">
          <i className="ti ti-language" />
          <span>Dịch tên tự động</span>
        </div>
        <div className="wf-item">
          <i className="ti ti-wifi-off" />
          <span>Hỗ trợ offline</span>
        </div>
      </div>

      <button className="btn-primary" onClick={() => setCurrentView('library')}>
        <i className="ti ti-books" style={{ marginRight: 6 }} /> Đến Thư Viện Truyện
      </button>
    </div>
  )
}
