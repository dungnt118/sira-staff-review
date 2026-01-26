# Staff Reviewer Data Migration Scripts

Scripts để migrate dữ liệu từ file Excel DS NHÂN SỰ.xlsx vào Google Sheets để app Staff Reviewer có thể hoạt động.

## 🎯 Mục đích

Chuẩn hóa và đẩy dữ liệu từ file Excel vào các sheet:
- **ASSIGNMENTS**: Phân công đánh giá (ai đánh giá ai)
- **CRITERIA**: Tiêu chí đánh giá cho từng loại nhân viên

## 📁 Structure

```
scripts/
├── package.json           # Dependencies
├── preview-excel.js      # Preview dữ liệu Excel
├── test-connection.js    # Test kết nối Google Sheets
├── migrate-data.js       # Migration với Service Account
├── export-csv.js         # Export CSV để import thủ công ⭐ KHUYẾN NGHỊ
├── output/               # Folder chứa file CSV export
│   ├── assignments.csv   
│   └── criteria.csv
└── README.md            # Hướng dẫn
```

## 🚀 Cách sử dụng

### Bước 1: Cài đặt dependencies
```bash
cd scripts
npm install
```

### Bước 2: Preview dữ liệu Excel
```bash
npm run preview
```
Script sẽ phân tích file Excel và hiển thị structure các sheet.

### Bước 3A: Export CSV (KHUYẾN NGHỊ ⭐)
```bash
npm run export
```

Script sẽ tạo 2 file CSV:
- `output/assignments.csv` - Dữ liệu phân công đánh giá
- `output/criteria.csv` - Tiêu chí đánh giá

**Sau đó import thủ công vào Google Sheets:**
1. Mở [Google Sheets](https://sheets.google.com)
2. Mở spreadsheet "DS NHÂN SỰ"
3. Chọn sheet "ASSIGNMENTS"
4. File → Import → Upload file `assignments.csv`
5. Chọn "Replace data" để thay thế dữ liệu hiện tại
6. Lặp lại với sheet "CRITERIA" và file `criteria.csv`

### Bước 3B: Migration tự động (CẦN SERVICE ACCOUNT)
```bash
npm run test     # Test kết nối trước
npm run migrate  # Chạy migration
```

## 📊 Logic tạo dữ liệu

### ASSIGNMENTS
- Phân công dựa trên cấu trúc phòng ban
- Manager/Trưởng phòng đánh giá nhân viên trong phòng
- Nếu không có manager, nhân viên đầu tiên trong danh sách sẽ làm reviewer
- Không tự đánh giá (reviewer ≠ reviewee)

### CRITERIA  
- **EMPLOYEE**: 5 tiêu chí cơ bản (chất lượng, tiến độ, teamwork, thái độ, học hỏi)
- **MANAGER**: 5 tiêu chí quản lý (lãnh đạo, quản lý nhóm, ra quyết định, tầm nhìn, phát triển nhân tài)

## 🔧 Configuration

### Google Sheets API
- **Spreadsheet ID**: `1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko`
- **API Key** (đọc): `AIzaSyDmkaE51CRnu4AJPo6uAc9Web19sZ-CeHU`
- **Service Account** (ghi): `functions/serviceAccount.json`

### Excel Input
- **File**: `docs/DS NHÂN SỨ.xlsx`
- **Sheet ưu tiên**: EMPLOYEES → DS EMAIL CBNV → PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ

## 📝 Output Format

### assignments.csv
```csv
assignment_id,reviewer_email,reviewee_employee_id,period,criteria_group,status
1,manager@company.com,123,2024-Q4,EMPLOYEE,PENDING
```

### criteria.csv
```csv
criteria_id,criteria_name,target_type
1,Chất lượng công việc,EMPLOYEE
```

## ⚠️ Lưu ý

1. **Excel file** phải có sheet chứa thông tin nhân viên với cột email
2. **Service Account** cần quyền edit trên Google Sheets target
3. **API Key** chỉ có quyền read, không thể ghi dữ liệu
4. **CSV export** là cách an toàn và dễ kiểm soát nhất

## 🛠️ Troubleshooting

### Lỗi "Module not found"
```bash
cd scripts
npm install
```

### Lỗi "Login Required" khi migrate
- Service account không có quyền truy cập sheet
- Sử dụng CSV export thay thế

### File Excel không tìm thấy  
- Đảm bảo file `DS NHÂN SỚ.xlsx` có trong `docs/`
- Check đường dẫn tuyệt đối trong console output

## 📈 Kết quả mong đợi

Sau khi import thành công:
- Sheet **ASSIGNMENTS** có ~15-25 records phân công đánh giá
- Sheet **CRITERIA** có 10 tiêu chí chuẩn
- App Staff Reviewer có thể load assignments và hiển thị form đánh giá

🎉 **Happy reviewing!**