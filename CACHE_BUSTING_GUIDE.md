# 🔄 Hướng dẫn Cache Busting

## Vấn đề
Khi deploy phiên bản mới, trình duyệt người dùng vẫn sử dụng file cũ từ cache, gây ra lỗi giao diện hoặc chức năng không hoạt động.

## Giải pháp đã implement
Hệ thống tự động phát hiện và reload khi có phiên bản mới, người dùng không cần làm gì.

## Cách sử dụng

### Khi deploy phiên bản mới:

**Chỉ cần 1 bước duy nhất:**

Mở file `public/js/config.js` và tăng số VERSION:

```javascript
window.SIRA_CONFIG = {
  VERSION: '1.0.2',  // ← Tăng từ 1.0.1 lên 1.0.2
  // ...
};
```

**Xong!** Không cần làm gì thêm.

### Cách hoạt động:

1. **Lần đầu user vào:** VERSION được lưu vào localStorage
2. **Khi bạn deploy mới:** Tăng VERSION trong config.js
3. **Lần user vào sau:** 
   - Script so sánh VERSION mới vs VERSION cũ
   - Nếu khác → Tự động reload trang (hard reload)
   - Clear cache và load code mới
   - Chỉ reload 1 lần duy nhất

### Quy tắc đặt VERSION:

**Semantic Versioning:**
- `1.0.0` → `1.0.1`: Bug fixes nhỏ
- `1.0.0` → `1.1.0`: Thêm tính năng mới
- `1.0.0` → `2.0.0`: Thay đổi lớn (breaking changes)

**Hoặc đơn giản:**
- Chỉ cần tăng số cuối: `1.0.1` → `1.0.2` → `1.0.3`

### Files đã được tích hợp:

✅ `public/index.html`
✅ `public/welcome.html`
✅ `public/dashboard.html`
✅ `public/assignments-manager.html`
✅ `public/evaluation.html`
✅ `public/reports.html`
✅ `public/review.html`
✅ `public/person-report.html`
✅ `public/no-access.html`

### Log kiểm tra:

Mở Developer Console (F12) để xem:
- Console sẽ hiển thị: `🔄 Phát hiện phiên bản mới (1.0.2), đang làm mới cache...`
- Trang tự động reload 1 lần

### Ví dụ workflow:

```bash
# 1. Fix bug hoặc thêm feature
git add .
git commit -m "Fix: Sửa lỗi filter"

# 2. Mở public/js/config.js
# Tăng VERSION: '1.0.1' -> '1.0.2'

# 3. Deploy
firebase deploy

# 4. User tự động được update, không cần Ctrl+F5
```

### Lưu ý:

- ⚠️ **QUAN TRỌNG:** Nhớ tăng VERSION trước khi deploy
- ✅ Nếu quên tăng VERSION, user vẫn có thể dùng Ctrl+F5 như cũ
- ✅ VERSION được lưu trong localStorage (không mất khi tắt browser)
- ✅ Hoạt động trên tất cả trình duyệt hiện đại

### Troubleshooting:

**Q: Tôi deploy nhưng user vẫn thấy giao diện cũ?**
A: Kiểm tra đã tăng VERSION trong config.js chưa.

**Q: Có cần xóa cache của Firebase Hosting không?**
A: Không cần, script tự động xử lý ở client-side.

**Q: VERSION có ảnh hưởng gì đến API không?**
A: Không, chỉ ảnh hưởng đến frontend cache.

## Technical Details

**File:** `public/js/config.js`
```javascript
window.SIRA_CONFIG = {
  VERSION: '1.0.1',
  // ...
};
```

**Auto-reload script** (có trong mọi HTML file):
```javascript
(function() {
  const CURRENT_VERSION = window.SIRA_CONFIG.VERSION;
  const storedVersion = localStorage.getItem('app_version');
  
  if (storedVersion && storedVersion !== CURRENT_VERSION) {
    console.log('🔄 Phát hiện phiên bản mới...');
    localStorage.setItem('app_version', CURRENT_VERSION);
    location.reload(true); // Hard reload
  } else {
    localStorage.setItem('app_version', CURRENT_VERSION);
  }
})();
```
