# Hướng dẫn sử dụng Assignments Manager

## Tổng quan

**Assignments Manager** là công cụ dành cho Admin để quản lý việc gán người đánh giá (assignments) một cách dễ dàng và trực quan, thay vì phải thao tác trực tiếp trên Google Sheets.

## Tính năng chính

### 1. **Hiển thị danh sách Assignments**
- Tự động tải tất cả assignments hiện có từ Google Sheets
- Hiển thị đầy đủ thông tin:
  - Reviewer (người đánh giá) với tên, email, phòng ban
  - Reviewee (người được đánh giá) với tên, email, phòng ban
  - Loại đánh giá (EMPLOYEE/MANAGER)
  - Trạng thái (PENDING/COMPLETED)

### 2. **Bộ lọc mạnh mẽ**
- Lọc theo Reviewer
- Lọc theo Reviewee
- Lọc theo loại đánh giá (EMPLOYEE/MANAGER)
- Lọc theo trạng thái (PENDING/COMPLETED)
- Có thể kết hợp nhiều bộ lọc cùng lúc

### 3. **Thống kê tổng quan**
- Tổng số Assignments
- Tổng số nhân viên
- Số assignment đang chờ
- Số assignment đã hoàn thành

### 4. **Thao tác quản lý**

#### Thêm Assignment mới
1. Click nút **"➕ Thêm Assignment"**
2. Chọn Reviewer từ danh sách dropdown
3. Chọn Reviewee từ danh sách dropdown
4. Chọn loại đánh giá (EMPLOYEE hoặc MANAGER)
5. Chọn trạng thái (PENDING hoặc COMPLETED)
6. Click **"Lưu"**

**Lưu ý:**
- Reviewer và Reviewee không được trùng nhau
- Hệ thống sẽ kiểm tra trùng lặp (reviewer + reviewee + target_type)

#### Sửa Assignment
1. Click nút **"Sửa"** ở assignment muốn chỉnh sửa
2. Thay đổi thông tin cần thiết
3. Click **"Lưu"**

#### Xóa Assignment
1. Click nút **"Xóa"** ở assignment muốn xóa
2. Xác nhận xóa

### 5. **Thao tác hàng loạt (Bulk Actions)**

#### Chọn nhiều assignments
- Click checkbox ở đầu mỗi hàng để chọn
- Hoặc click checkbox "Select All" để chọn tất cả

#### Xóa hàng loạt
1. Chọn các assignments cần xóa
2. Click nút **"Xóa"** trong Bulk Actions
3. Xác nhận

#### Cập nhật trạng thái hàng loạt
1. Chọn các assignments cần cập nhật
2. Click **"Đánh dấu hoàn thành"** hoặc **"Đánh dấu chờ"**
3. Xác nhận

### 6. **Lưu thay đổi vào Google Sheets**

**QUAN TRỌNG:** Tất cả các thao tác (thêm, sửa, xóa) chỉ được lưu tạm trong bộ nhớ trình duyệt. Để cập nhật vào Google Sheets:

1. Click nút **"💾 Lưu tất cả thay đổi"**
2. Xác nhận
3. Hệ thống sẽ cập nhật toàn bộ dữ liệu vào sheet ASSIGNMENTS

**Cơ chế hoạt động:**
- Xóa toàn bộ dữ liệu cũ trong sheet ASSIGNMENTS (giữ lại header)
- Ghi lại toàn bộ assignments mới (đã được chỉnh sửa)
- Đảm bảo tính nhất quán dữ liệu

## Truy cập công cụ

### Từ Dashboard
1. Đăng nhập với tài khoản ADMIN
2. Click nút **"🎯 Quản lý Assignments"** trên header

### Trực tiếp
- URL: `https://your-domain.com/assignments-manager.html`

**Lưu ý:** Chỉ tài khoản có role = ADMIN mới có quyền truy cập

## Cấu trúc dữ liệu

### Sheet ASSIGNMENTS

| Cột | Mô tả | Bắt buộc |
|-----|-------|----------|
| reviewer_email | Email người đánh giá | Có |
| reviewee_email | Email người được đánh giá | Có |
| target_type | Loại đánh giá (EMPLOYEE/MANAGER) | Có |
| status | Trạng thái (PENDING/COMPLETED) | Không (mặc định: PENDING) |
| period | Kỳ đánh giá | Không |

## API Endpoints

### 1. GET /getAllEmployees
Lấy danh sách tất cả nhân viên

**Response:**
```json
{
  "success": true,
  "employees": [
    {
      "employee_id": "...",
      "name": "...",
      "email": "...",
      "department": "...",
      "position": "...",
      "status": "...",
      "role": "..."
    }
  ]
}
```

### 2. GET /getAllAssignments
Lấy danh sách tất cả assignments

**Response:**
```json
{
  "success": true,
  "assignments": [
    {
      "reviewer_email": "...",
      "reviewee_email": "...",
      "target_type": "EMPLOYEE",
      "status": "PENDING",
      "period": "..."
    }
  ]
}
```

### 3. POST /updateAllAssignments
Cập nhật toàn bộ assignments

**Request:**
```json
{
  "assignments": [
    {
      "reviewer_email": "...",
      "reviewee_email": "...",
      "target_type": "EMPLOYEE",
      "status": "PENDING",
      "period": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assignments updated successfully",
  "count": 10
}
```

## Best Practices

### 1. Backup trước khi thao tác
- Nên download/export sheet ASSIGNMENTS trước khi thực hiện thao tác lớn
- Hoặc kiểm tra kỹ trên giao diện trước khi click "Lưu tất cả thay đổi"

### 2. Kiểm tra dữ liệu
- Đảm bảo Reviewer và Reviewee tồn tại trong hệ thống
- Kiểm tra loại đánh giá phù hợp với vị trí của Reviewee
- Xác nhận không có assignment trùng lặp không cần thiết

### 3. Sử dụng bộ lọc
- Khi có nhiều assignments, sử dụng bộ lọc để tìm nhanh
- Kết hợp nhiều bộ lọc để tìm chính xác

### 4. Thao tác hàng loạt
- Sử dụng bulk actions khi cần cập nhật nhiều assignments cùng lúc
- Tiết kiệm thời gian và giảm thiểu lỗi

### 5. Tải lại dữ liệu
- Click nút "🔄 Tải lại" để đồng bộ dữ liệu mới nhất từ Google Sheets
- Đặc biệt khi có nhiều admin cùng thao tác

## Troubleshooting

### Lỗi "Không thể tải dữ liệu"
- Kiểm tra kết nối internet
- Kiểm tra quyền truy cập Google Sheets
- Thử tải lại trang

### Lỗi "Assignment này đã tồn tại"
- Đã có assignment với cùng reviewer + reviewee + target_type
- Sửa thông tin hoặc xóa assignment cũ trước

### Lỗi "Bạn không có quyền truy cập"
- Đảm bảo tài khoản có role = ADMIN
- Liên hệ administrator để cấp quyền

### Dữ liệu không đồng bộ
- Click "🔄 Tải lại" để refresh dữ liệu
- Xóa cache trình duyệt nếu cần

## Cải tiến trong tương lai

- [ ] Import assignments từ file CSV/Excel
- [ ] Export assignments ra file CSV/Excel
- [ ] Lịch sử thay đổi (audit log)
- [ ] Gợi ý assignments tự động dựa trên cơ cấu tổ chức
- [ ] Kiểm tra xung đột (conflict detection)
- [ ] Thông báo cho người được gán (email notification)

## Liên hệ hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng liên hệ:
- Email: support@company.com
- Hotline: 1900-xxxx
