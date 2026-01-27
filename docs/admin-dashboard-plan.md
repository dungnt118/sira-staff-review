# Kế hoạch phát triển Admin Dashboard & Reporting

**Mục tiêu**: Xây dựng tính năng báo cáo cho ADMIN với phân tích dữ liệu từ sheet EVALUATIONS

**Ngày bắt đầu**: 27/01/2026

---

## 📋 GIAI ĐOẠN 1: XÁC ĐỊNH ROLE & HIỂN THỊ NÚT BÁO CÁO

### ✅ Task 1.1: Cập nhật Backend - Employee Model & API
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Thêm field `role` vào TypeScript interface `Employee` trong `sheets-client.ts`
- [ ] Cập nhật method `getEmployeeByEmail()` để đọc cột `role` từ EMPLOYEES sheet
- [ ] Cập nhật method `getAllEmployeesAsMap()` để include `role` field
- [ ] Test với data có role="ADMIN" và role khác (VD: "USER", "MANAGER")

**File cần sửa**:
- `functions/src/sheets/sheets-client.ts`

**Acceptance Criteria**:
- API trả về `role` field cho employee
- Role được map case-insensitive
- Default role = "USER" nếu cell trống

---

### ✅ Task 1.2: Cập nhật Frontend - Welcome Page với Admin Button
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Lưu `role` vào sessionStorage khi login thành công
- [ ] Thêm conditional rendering: Hiển thị nút "📊 Xem Báo cáo" nếu `role === "ADMIN"`
- [ ] Style nút Admin button (màu khác biệt, VD: orange/gold)
- [ ] Link nút đến trang `/reports.html`

**File cần sửa**:
- `public/welcome.html` - line ~180-220 (sau bảng assignments)

**UI Design**:
```html
<!-- Nút xuất hiện trên header hoặc dưới welcome message -->
<div class="admin-actions" style="display: none;" id="adminPanel">
  <button class="btn-admin" onclick="window.location.href='reports.html'">
    📊 Xem Báo cáo Đánh giá
  </button>
</div>
```

**Acceptance Criteria**:
- Nút chỉ hiển thị khi `sessionStorage.getItem('role') === 'ADMIN'`
- Click nút navigate đến reports.html
- Non-admin users không thấy nút

---

## 📊 GIAI ĐOẠN 2: XÂY DỰNG BACKEND REPORTING API

### ✅ Task 2.1: Thiết kế API Endpoint - getReportData
**Trạng thái**: 🟢 Đã xong

**API Specification**:
```
GET /getReportData
Response: {
  success: true,
  data: {
    topEmployees: [{email, name, totalScore, evaluationCount}, ...], // Top 5
    topManagers: [{email, name, totalScore, evaluationCount}, ...],  // Top 3
    notEvaluatedReviewers: [{email, name, assignmentCount}, ...],    // Chưa đánh giá
    notEvaluatedReviewees: [{email, name}, ...],                     // Chưa được đánh giá
    evaluatedReviewees: [{email, name, evaluationCount}, ...],       // Đã được đánh giá
    summary: {
      totalEmployees: number,
      totalManagers: number,
      totalEvaluations: number,
      completionRate: number
    }
  }
}
```

**Công việc**:
- [ ] Tạo method `getReportData()` trong `sheets-client.ts`
- [ ] Fetch toàn bộ EVALUATIONS sheet (evaluation_id, reviewer_email, reviewee_email, target_type, score)
- [ ] Fetch toàn bộ ASSIGNMENTS sheet để xác định người chưa đánh giá
- [ ] Fetch toàn bộ EMPLOYEES để join data và lấy role

**File tạo mới/sửa**:
- `functions/src/sheets/sheets-client.ts` - add `getReportData()` method
- `functions/src/index.ts` - add endpoint `getReportData`

---

### ✅ Task 2.2: Xử lý Logic - Top 5 Employees & Top 3 Managers
**Trạng thái**: 🟢 Đã xong

**Logic xử lý**:
```typescript
// Pseudo-code
1. Group evaluations by reviewee_email
2. Calculate for each reviewee:
   - totalScore = SUM(score)
   - evaluationCount = COUNT(*)
   - avgScore = totalScore / evaluationCount
3. Join with EMPLOYEES to get name, role
4. Filter by target_type:
   - EMPLOYEE evaluations → topEmployees
   - MANAGER evaluations → topManagers
5. Sort by totalScore DESC
6. Take TOP 5 employees, TOP 3 managers
```

**Công việc**:
- [ ] Implement grouping và aggregation logic
- [ ] Sort và filter top performers
- [ ] Handle edge cases (0 evaluations, tie scores)

---

### ✅ Task 2.3: Xử lý Logic - Reviewers chưa đánh giá
**Trạng thái**: 🟢 Đã xong

**Logic**:
```typescript
1. Lấy tất cả ASSIGNMENTS với status != "COMPLETED"
2. Group by reviewer_email, count assignments
3. Join với EMPLOYEES để lấy name
4. Return danh sách {email, name, pendingAssignments}
```

**Công việc**:
- [ ] Filter assignments by status
- [ ] Aggregate pending count per reviewer
- [ ] Sort by pendingAssignments DESC

---

### ✅ Task 2.4: Xử lý Logic - Reviewees chưa được đánh giá & đã được đánh giá
**Trạng thái**: 🟢 Đã xong

**Logic**:
```typescript
// Chưa được đánh giá:
1. Lấy danh sách unique reviewee_email từ ASSIGNMENTS
2. Lấy danh sách unique reviewee_email từ EVALUATIONS
3. NOT_EVALUATED = ASSIGNMENTS.reviewees - EVALUATIONS.reviewees
4. Join EMPLOYEES để lấy name

// Đã được đánh giá:
1. Lấy unique reviewee_email từ EVALUATIONS
2. Count evaluations per reviewee
3. Join EMPLOYEES để lấy name
```

**Công việc**:
- [ ] Implement set difference logic
- [ ] Count evaluations per reviewee
- [ ] Handle employees with multiple target_types

---

### ✅ Task 2.5: Tạo Endpoint & Test
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Tạo endpoint `getReportData` trong `functions/src/index.ts`
- [ ] Add CORS headers
- [ ] Add authentication check (chỉ ADMIN mới gọi được)
- [ ] Test với emulator
- [ ] Verify response structure
- [ ] Add error handling

**Security**:
- Kiểm tra `reviewer_email` từ query param
- Gọi `getEmployeeByEmail(reviewer_email)` để verify role="ADMIN"
- Return 403 Forbidden nếu không phải ADMIN

---

## 🎨 GIAI ĐOẠN 3: XÂY DỰNG FRONTEND DASHBOARD

### ✅ Task 3.1: Tạo Page - reports.html
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Tạo file `public/reports.html`
- [ ] Copy structure từ `welcome.html` (header, footer, CSS)
- [ ] Add page title "📊 Báo cáo Đánh giá Nhân sự"
- [ ] Add loading spinner khi fetch data
- [ ] Check role từ sessionStorage - redirect nếu không phải ADMIN

**Layout Design**:
```
+------------------------------------------+
|  🏠 Về Dashboard | 👤 Admin: [Name]     |
+------------------------------------------+
|  📊 BÁO CÁO ĐÁNH GIÁ NHÂN SỰ            |
+------------------------------------------+
|  📈 Tổng quan                            |
|  - Tổng đánh giá: X                     |
|  - Tỷ lệ hoàn thành: Y%                 |
|  - Nhân viên đã đánh giá: Z             |
+------------------------------------------+
|  🏆 TOP NHÂN VIÊN XUẤT SẮC (5)          |
|  [Table with rank, name, score, count]  |
+------------------------------------------+
|  👔 TOP QUẢN LÝ XUẤT SẮC (3)            |
|  [Table with rank, name, score, count]  |
+------------------------------------------+
|  ⚠️ NHÂN VIÊN CHƯA ĐÁNH GIÁ            |
|  [List with name, pending count]        |
+------------------------------------------+
|  📝 THÀNH VIÊN CHƯA ĐƯỢC ĐÁNH GIÁ      |
|  [List with name, email]                |
+------------------------------------------+
|  ✅ THÀNH VIÊN ĐÃ ĐƯỢC ĐÁNH GIÁ        |
|  [List with name, evaluation count]     |
+------------------------------------------+
```

---

### ✅ Task 3.2: API Integration - config.js
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Add endpoint `GET_REPORT_DATA: '/getReportData'` vào `ENDPOINTS`
- [ ] Add method `SIRA_API.getReportData(adminEmail)` để fetch report
- [ ] Handle errors và return user-friendly messages

**File sửa**:
- `public/js/config.js`

---

### ✅ Task 3.3: Render Top Performers Tables
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Implement function `renderTopEmployees(data)` với table HTML
- [ ] Implement function `renderTopManagers(data)` với table HTML
- [ ] Add rank badges (🥇🥈🥉 cho top 3)
- [ ] Format điểm số (1 decimal place)
- [ ] Highlight top 1 với background color

**Table Structure**:
```html
<table class="report-table">
  <thead>
    <tr>
      <th>Hạng</th>
      <th>Tên</th>
      <th>Tổng điểm</th>
      <th>Số đánh giá</th>
      <th>Điểm TB</th>
    </tr>
  </thead>
  <tbody>
    <!-- Dynamic rows -->
  </tbody>
</table>
```

---

### ✅ Task 3.4: Render Lists - Chưa đánh giá & Chưa được đánh giá
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Render list nhân viên chưa đánh giá (với số lượng assignments pending)
- [ ] Render list thành viên chưa được đánh giá
- [ ] Render list thành viên đã được đánh giá (với số lượng evaluations)
- [ ] Add search/filter functionality
- [ ] Add export to CSV button (optional)

**UI Design**:
- Card-based layout hoặc simple list
- Show count: "Tổng: X người"
- Collapsible sections nếu list dài

---

### ✅ Task 3.5: Styling & Polish
**Trạng thái**: 🟢 Đã xong

**Công việc**:
- [ ] Add CSS cho report tables (responsive design)
- [ ] Add colors: gold cho top 1, silver cho top 2, bronze cho top 3
- [ ] Add animations (fade-in khi load data)
- [ ] Mobile responsive layout
- [ ] Add print CSS cho in báo cáo

**File tạo mới** (optional):
- `public/css/reports.css` - dedicated stylesheet

---

## 🧪 GIAI ĐOẠN 4: TESTING & OPTIMIZATION

### ✅ Task 4.1: End-to-End Testing
**Trạng thái**: 🔴 Chưa bắt đầu

**Test Cases**:
- [ ] Login với ADMIN role → Thấy nút "Xem báo cáo"
- [ ] Login với USER role → Không thấy nút
- [ ] Click nút → Navigate đến reports.html
- [ ] reports.html fetch data thành công
- [ ] Top 5 employees hiển thị đúng
- [ ] Top 3 managers hiển thị đúng
- [ ] Lists chưa đánh giá/chưa được đánh giá accurate
- [ ] Non-admin access reports.html → Redirect về welcome.html

---

### ✅ Task 4.2: Performance Optimization
**Trạng thái**: 🔴 Chưa bắt đầu

**Công việc**:
- [ ] Cache report data trong sessionStorage (expire sau 5 phút)
- [ ] Add refresh button để manually reload data
- [ ] Optimize getReportData() - fetch all sheets parallel với Promise.all
- [ ] Add loading indicator với progress percentage

---

### ✅ Task 4.3: Error Handling & Edge Cases
**Trạng thái**: 🔴 Chưa bắt đầu

**Scenarios to handle**:
- [ ] Không có evaluation nào → Show empty state
- [ ] Tie scores trong top performers → Sort by name
- [ ] Employee không có trong EMPLOYEES sheet → Show email thay vì name
- [ ] API timeout → Show retry button
- [ ] Permission denied → Redirect với error message

---

## 📦 DELIVERABLES

**Backend**:
- ✅ Employee interface với `role` field
- ✅ Endpoint GET `/getReportData` với authentication
- ✅ Aggregation logic cho top performers, pending lists

**Frontend**:
- ✅ Welcome.html với conditional admin button
- ✅ reports.html - full dashboard page
- ✅ config.js với getReportData API wrapper
- ✅ CSS styling cho report tables

**Documentation**:
- ✅ API documentation for getReportData endpoint
- ✅ User guide: Cách xem báo cáo (admin only)

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Deploy cloud functions với endpoint mới
- [ ] Deploy hosting với reports.html
- [ ] Update Firebase config nếu cần
- [ ] Test trên production environment
- [ ] Monitor logs cho errors
- [ ] Update README.md với feature mới

---

## 📝 NOTES & DECISIONS

**Column role trong EMPLOYEES**:
- Giá trị: "ADMIN", "MANAGER", "USER"
- Default: "USER"
- Case-insensitive comparison

**Security**:
- Endpoint getReportData check ADMIN role
- Frontend check role trước khi render
- SessionStorage lưu role (có thể fake client-side, nhưng API vẫn validate)

**Performance Target**:
- getReportData API: < 2s
- Reports page load: < 3s total
- Support up to 500 employees, 5000 evaluations

---

**Cập nhật lần cuối**: 27/01/2026  
**Trạng thái tổng thể**: 🔴 Chưa bắt đầu (0/18 tasks)
