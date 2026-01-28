## ✅ Sửa xong: Bulk Assignment Filtering

### Vấn đề:
Khi chọn Reviewer và Loại đánh giá, dropdown Reviewee vẫn show những người đã có assignment.

### Nguyên nhân:
- So sánh email không chuẩn hóa (case-sensitive, có khoảng trắng)
- Không kiểm tra null/undefined kỹ lưỡng

### Sửa xong:

#### 1. **Chuẩn hóa dữ liệu**
```javascript
// Trước: a.reviewer_email === reviewer
// Sau:  a.reviewer_email?.toLowerCase() === reviewer?.toLowerCase()
```
- Email: `.toLowerCase().trim()`
- Target Type: `.toUpperCase().trim()`

#### 2. **Console Logging Chi Tiết**
Khi chọn Reviewer + Loại đánh giá, console sẽ show:
```
📋 Filtering reviewees {reviewer: "email@...", targetType: "EMPLOYEE", ...}
  ❌ Người A - bỏ vì là reviewer
  ❌ Người B - bỏ vì: assignment(email@...->email@..., EMPLOYEE)
  ✅ Người C - giữ lại
  ✅ Người D - giữ lại
📊 Result: 42 available (từ 45 tổng)
```

#### 3. **Cách Test**

**Bước 1:** Hard refresh (Ctrl+Shift+R)
**Bước 2:** F12 → Console tab
**Bước 3:** Xem có message "✅ Loaded data" không?
**Bước 4:** Vào modal "Thêm gộp", chọn Reviewer
**Bước 5:** Chọn Loại đánh giá
**Bước 6:** Xem Console:
- Nếu thấy "❌ [Tên] - bỏ vì: assignment(...)" → OK, người đó không show trong dropdown
- Nếu không thấy, nhưng người đó vẫn ở dropdown → có vấn đề

### Gỡ rối nếu vẫn không được:

| Triệu chứng | Kiểm tra |
|---|---|
| Dropdown trống | Console: "allAssignmentsCount: 0" → Check API call |
| Tất cả mọi người ở dropdown | "allAssignmentsCount: 0" → allAssignments rỗng |
| Ai cũng ở console nhưng dropdown khác | Reload page, xem lại |
| Lỗi API | Mở Network tab, tìm `getAllAssignments` response |

### Files đã sửa:
- ✅ `public/assignments-manager.html` - filterAndUpdateBulkRevieweeSelect() + loadData()
- ✅ `public/js/config.js` - API endpoints (đã từng sửa)
- ✅ `functions/src/sheets/sheets-client.ts` - getAllAssignments() (đã từng sửa)
