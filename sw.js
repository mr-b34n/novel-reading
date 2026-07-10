const CACHE_NAME = 'novreader-cache-v1'; // Đổi v1 thành v2, v3... nếu bạn muốn ép xóa sạch cache cũ lập tức khi cập nhật lớn
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 1. Sự kiện Cài đặt (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Ép Service Worker mới cài đặt được kích hoạt ngay lập tức, không chờ người dùng tắt ứng dụng
  self.skipWaiting();
});

// 2. Sự kiện Kích hoạt (Activate)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Xóa bỏ các cache cũ nếu tên không nằm trong whitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Giành quyền kiểm soát tất cả các tab đang mở ngay lập tức để áp dụng SW mới
  event.waitUntil(self.clients.claim());
});

// 3. Sự kiện Bắt các gói tin (Fetch) - Sử dụng chiến lược Stale-While-Revalidate
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        
        // Tạo một request mạng để kiểm tra và tải bản mới nhất (Revalidate)
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Kiểm tra nếu response hợp lệ (status 200, cùng domain) thì mới cập nhật vào cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();

            // Không lưu cache các dịch vụ bên ngoài không cần thiết như Google Auth/APIs
            if (!event.request.url.includes('google.com') && !event.request.url.includes('googleapis.com')) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        }).catch(() => {
          // Bắt lỗi khi mất mạng hoàn toàn (Offline) -> Trình duyệt không bị crash vì đã có bản cache cứu cánh dưới đây
        });

        // TRẢ VỀ NGAY LẬP TỨC: Bản cache (nếu có) để app load cực nhanh, nếu không có cache thì đợi bản từ mạng (fetchPromise)
        return cachedResponse || fetchPromise;
      })
  );
});
