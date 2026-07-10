# NovReader - Website đọc truyện chữ

NovReader là website đọc truyện chữ (file `.txt`) theo hướng tối giản, tập trung vào trải nghiệm đọc lâu dài trên cả máy tính và điện thoại. Ứng dụng chạy hoàn toàn phía trình duyệt, không cần backend.

## Mục tiêu sử dụng

- Tạo một không gian đọc truyện gọn, dễ tập trung, ít thao tác.
- Hỗ trợ người dùng tự tải truyện `.txt` và đọc ngay mà không cần cài đặt phức tạp.
- Cá nhân hóa trải nghiệm đọc (font, cỡ chữ, nền, căn lề, giãn dòng...).
- Hỗ trợ nghe truyện bằng Text-to-Speech (TTS) và theo dõi tiến độ đọc.

## Chức năng chính

### 1) Quản lý thư viện truyện
- Tải truyện từ file `.txt`.
- Lưu truyện cục bộ bằng IndexedDB.
- Hiển thị danh sách truyện đã lưu kèm phần trăm đang đọc.
- Xóa truyện khỏi thư viện khi không còn cần thiết.

### 2) Tách chương linh hoạt
- Tự động nhận diện chương.
- Hỗ trợ nhiều kiểu tiêu đề chương (ví dụ: `Chương`, `Chapter`, `Hồi`, `Phần`, hoặc phân cách tùy chỉnh).
- Hỗ trợ trang **Giới thiệu** (chương mở đầu/chương 0).

### 3) Trình đọc tối ưu trải nghiệm
- Điều chỉnh cỡ chữ, giãn dòng, độ rộng vùng đọc, lề trong, khoảng cách đoạn.
- Chọn font và màu nền/màu chữ.
- Chế độ giao diện tối.
- Chế độ chữ hoa đầu đoạn (drop cap).
- Căn đều hai bên.

### 4) Điều hướng và theo dõi tiến độ
- Danh sách chương + chọn chương nhanh.
- Nút chuyển chương trước/sau.
- Thanh tiến độ đọc trong sidebar và thanh tiến độ trên cùng.
- Nhớ vị trí đọc theo từng truyện/chương.
- Hỗ trợ kéo cuộn ở mép trên/dưới để chuyển chương nhanh (mobile/desktop).

### 5) Text-to-Speech (TTS)
- Bật/tắt TTS ngay trong giao diện đọc.
- Phát/tạm dừng, tua lùi/tiến theo cụm từ.
- Chỉnh tốc độ, âm lượng, cao độ.
- Chọn giọng tiếng Việt khả dụng từ trình duyệt.
- Tùy chọn tô sáng từ đang được đọc.

### 6) Giới hạn thời gian đọc
- Bật giới hạn thời lượng đọc theo phút.
- Tự khóa tiếp tục đọc khi hết thời gian cài đặt.

### 7) PWA & offline
- Có `manifest.json` và `sw.js` để hỗ trợ cài như ứng dụng web và dùng cache/offline cơ bản khi được phục vụ qua HTTP/HTTPS.

## Công nghệ sử dụng

- HTML, CSS, JavaScript thuần (single-page app).
- Web Speech API cho TTS.
- IndexedDB + LocalStorage để lưu dữ liệu cục bộ.
- Service Worker cho khả năng offline cơ bản.

## Cách sử dụng nhanh

1. Mở website.
2. Chọn **Tải sách mới** và chọn file `.txt` (UTF-8).
3. Chọn cách tách chương (hoặc để tự động).
4. Bắt đầu đọc trong giao diện Reader.
5. Tùy chỉnh thông số đọc và TTS trong sidebar.