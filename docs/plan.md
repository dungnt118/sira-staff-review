# Kế Hoạch Staff Reviewer - Ứng Dụng Đánh Giá Nhân Viên

## 📋 Tổng Quan Dự Án

**Staff Reviewer** là ứng dụng web đơn giản để nhân viên đánh giá lẫn nhau dựa trên dữ liệu được quản lý hoàn toàn trong Google Sheets. Không có vai trò quản trị phức tạp, mọi quy tắc đánh giá được định nghĩa sẵn trong các sheet.

### 🎯 Mục Tiêu
- Tạo interface đơn giản cho việc đánh giá nhân viên
- Tự động mapping nhân viên qua email đăng nhập
- Hiển thị form đánh giá theo tiêu chí được định sẵn
- Tự động lưu kết quả vào Google Sheets

## 🗂️ Cấu Trúc Google Sheets Chuẩn Hóa

### **EMPLOYEES**: Danh sách nhân viên
```
| employee_id | name | email | department | position | status |
|-------------|------|-------|------------|----------|---------|
| EMP001 | Nguyễn Văn A | nva@company.com | IT | Developer | Active |
```

### **ASSIGNMENTS**: Phân công đánh giá (ai đánh giá ai)
```
| assignment_id | reviewer_email | reviewee_employee_id | period | criteria_group | status |
|---------------|----------------|---------------------|---------|----------------|--------|
| ASG001 | manager@company.com | EMP001 | 2024-Q1 | TECH_STAFF | Active |
```

### **CRITERIA**: Tiêu chí đánh giá
```
| criteria_id | criteria_group | criteria_name | description | weight | type |
|-------------|----------------|---------------|-------------|---------|------|
| CR001 | TECH_STAFF | Kỹ năng lập trình | Đánh giá kỹ năng code | 30 | scale_1_5 |
```

### **RESPONSES**: Kết quả đánh giá
```
| response_id | assignment_id | criteria_id | score | comment | created_at |
|-------------|---------------|-------------|-------|---------|------------|
| RES001 | ASG001 | CR001 | 4 | Code tốt | 2024-03-15 |
```

### **REPORT**: Báo cáo tổng hợp (tự động tính)
```
| employee_id | period | total_score | avg_score | completed_reviews | status |
|-------------|--------|-------------|-----------|-------------------|---------|
| EMP001 | 2024-Q1 | 85 | 4.25 | 3 | Completed |
```

## 🔄 User Journey & Workflow

### **Bước 1: Truy Cập Ứng Dụng**
```
Người dùng -> Truy cập link app -> Google Login -> Welcome Page
```

### **Bước 2: Nhận Diện Nhân Viên (Welcome Page)**
```
Email đăng nhập -> Tìm trong EMPLOYEES sheet -> 
├─ Tìm thấy: Hiển thị thông tin nhân viên, chuyển đến Dashboard
└─ Không tìm thấy: Chuyển đến trang "Không có quyền truy cập"
```

### **Bước 3: Mapping Assignment**
```
Email người dùng -> Tìm trong ASSIGNMENTS sheet (reviewer_email) ->
├─ Có assignment: Hiển thị danh sách người cần đánh giá
└─ Không có: Hiển thị "Không có nhiệm vụ đánh giá"
```

### **Bước 4: Form Đánh Giá**
```
Chọn người để đánh giá -> Lấy criteria_group từ ASSIGNMENTS ->
Hiển thị form với các tiêu chí từ CRITERIA sheet
```

### **Bước 5: Lưu Kết Quả**
```
Submit form -> Tự động mapping employee_id ->
Lưu vào RESPONSES sheet -> Cập nhật REPORT sheet
```

## 🏗️ Kiến Trúc Ứng Dụng

### **Frontend Structure**
```
public/
├── index.html (Landing page + Google Login)
├── welcome.html (Employee mapping & info display)
├── dashboard.html (Assignment list)
├── review.html (Review form)
├── no-access.html (Unauthorized page)
├── css/
│   └── app.css (Simple, clean styling)
└── js/
    ├── auth.js (Google authentication)
    ├── sheets-api.js (Google Sheets integration)
    ├── employee-mapper.js (Employee mapping logic)
    ├── review-form.js (Dynamic form generation)
    └── app.js (Main app logic)
```

### **Backend Functions**
```
functions/src/
├── index.ts (Main entry point)
├── sheets/
│   ├── sheets-client.ts (Google Sheets API client)
│   ├── employee-service.ts (Employee lookup)
│   ├── assignment-service.ts (Assignment lookup)
│   ├── criteria-service.ts (Criteria lookup)
│   └── response-service.ts (Save responses)
└── api/
    ├── employee-lookup.ts (POST /api/employee-lookup)
    ├── get-assignments.ts (GET /api/assignments/:email)
    ├── get-criteria.ts (GET /api/criteria/:group)
    └── save-response.ts (POST /api/save-response)
```

## 🚀 Development Plan - 3 Phases

### **Phase 1: Core Infrastructure (Tuần 1)**

#### 1.1 Google Sheets API Setup
- [ ] Cấu hình Service Account cho Google Sheets
- [ ] Test kết nối với 5 sheets: EMPLOYEES, ASSIGNMENTS, CRITERIA, RESPONSES, REPORT
- [ ] Tạo base Sheets service class

#### 1.2 Authentication Flow  
- [ ] Upgrade Google Login hiện tại
- [ ] Implement employee mapping logic
- [ ] Tạo trang "No Access" cho unauthorized users

#### 1.3 Basic API Endpoints
- [ ] `/api/employee-lookup` - Tìm nhân viên theo email
- [ ] `/api/assignments/:email` - Lấy assignment của người dùng
- [ ] CORS và error handling

### **Phase 2: Review System (Tuần 2-3)**

#### 2.1 Employee Mapping & Welcome Page
- [ ] Welcome page hiển thị thông tin nhân viên đã mapping
- [ ] Dashboard hiển thị danh sách người cần đánh giá
- [ ] Navigation flow giữa các trang

#### 2.2 Dynamic Review Form
- [ ] `/api/criteria/:group` - Lấy tiêu chí theo group
- [ ] Tạo form động theo tiêu chí
- [ ] Validation input (scale 1-5, text comments)

#### 2.3 Save Response System
- [ ] `/api/save-response` - Lưu kết quả đánh giá
- [ ] Auto mapping với employee_id
- [ ] Update RESPONSES sheet
- [ ] Basic success/error feedback

### **Phase 3: Polish & Deploy (Tuần 4)**

#### 3.1 User Experience
- [ ] Loading states và error messages
- [ ] Responsive design cho mobile
- [ ] Progress indicators cho form

#### 3.2 Reporting (Optional)
- [ ] Simple view của REPORT sheet data
- [ ] Basic charts cho completed reviews
- [ ] Export functionality (nếu cần)

#### 3.3 Production Ready
- [ ] Security review
- [ ] Performance optimization
- [ ] Deploy lên Firebase Hosting

## 📊 Technical Implementation Details

### **Google Sheets Integration**

#### Base Sheets Service
```typescript
// functions/src/sheets/sheets-client.ts
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4 } from 'googleapis';

export class SheetsClient {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  
  constructor() {
    const auth = new GoogleAuth({
      keyFile: './serviceAccount.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = new sheets_v4.Sheets({ auth });
    this.spreadsheetId = 'YOUR_SHEET_ID';
  }
  
  async getEmployeeByEmail(email: string) {
    // Read EMPLOYEES sheet, tìm theo email
  }
  
  async getAssignmentsByEmail(email: string) {
    // Read ASSIGNMENTS sheet, tìm theo reviewer_email  
  }
  
  async getCriteriaByGroup(group: string) {
    // Read CRITERIA sheet, filter theo criteria_group
  }
  
  async saveResponse(responseData: ResponseData) {
    // Append to RESPONSES sheet
  }
}
```

#### API Endpoints Structure
```typescript
// functions/src/api/employee-lookup.ts
export const employeeLookup = onRequest(async (req, res) => {
  const { email } = req.body;
  const sheetsClient = new SheetsClient();
  
  try {
    const employee = await sheetsClient.getEmployeeByEmail(email);
    if (employee) {
      res.json({ success: true, employee });
    } else {
      res.json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **Frontend Flow**

#### Employee Mapping
```javascript
// public/js/employee-mapper.js
class EmployeeMapper {
  async mapCurrentUser() {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    
    const response = await fetch('/api/employee-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    
    const result = await response.json();
    return result.success ? result.employee : null;
  }
}
```

#### Dynamic Form Generation
```javascript
// public/js/review-form.js
class ReviewForm {
  async generateForm(criteriaGroup, revieweeId) {
    const criteria = await this.getCriteria(criteriaGroup);
    const formHtml = criteria.map(criterion => 
      this.createCriterionInput(criterion)
    ).join('');
    
    document.getElementById('review-form').innerHTML = formHtml;
  }
  
  createCriterionInput(criterion) {
    switch(criterion.type) {
      case 'scale_1_5':
        return `<div class="criterion">
          <label>${criterion.criteria_name}</label>
          <input type="range" min="1" max="5" data-criterion="${criterion.criteria_id}">
        </div>`;
      case 'text':
        return `<div class="criterion">
          <label>${criterion.criteria_name}</label>
          <textarea data-criterion="${criterion.criteria_id}"></textarea>
        </div>`;
    }
  }
}
```

### **Data Flow Examples**

#### 1. Employee Login & Mapping
```
User logs in with email: "john@company.com"
↓
Call /api/employee-lookup with email
↓
Search EMPLOYEES sheet for email match
↓
Return: { employee_id: "EMP001", name: "John Doe", department: "IT" }
↓
Store in frontend state, redirect to dashboard
```

#### 2. Get Review Assignments
```
User email: "manager@company.com"
↓
Call /api/assignments/manager@company.com
↓
Search ASSIGNMENTS sheet where reviewer_email = "manager@company.com"
↓
Return: [
  { assignment_id: "ASG001", reviewee_employee_id: "EMP001", criteria_group: "TECH_STAFF" },
  { assignment_id: "ASG002", reviewee_employee_id: "EMP002", criteria_group: "TECH_STAFF" }
]
↓
Display list of people to review
```

#### 3. Generate Review Form
```
User selects reviewee EMP001
↓
Get criteria_group "TECH_STAFF" from assignment
↓
Call /api/criteria/TECH_STAFF
↓
Return criteria list for that group
↓
Generate dynamic form with appropriate input types
```

#### 4. Save Review Response
```
User submits form
↓
Collect all criterion scores/comments
↓
Call /api/save-response with:
{
  assignment_id: "ASG001",
  responses: [
    { criteria_id: "CR001", score: 4, comment: "Good work" },
    { criteria_id: "CR002", score: 5, comment: "Excellent" }
  ]
}
↓
For each response, append row to RESPONSES sheet
↓
Return success confirmation
```

## 🔒 Security & Validation

### Input Validation
- Email format validation
- Score range validation (1-5 for scales)
- Required field validation
- Sanitize text inputs

### Access Control
- Google authentication required
- Employee mapping required to proceed
- Assignment validation (chỉ được đánh giá người được assign)

### Error Handling
- Graceful fallbacks cho các API calls
- Clear error messages cho users
- Logging cho debugging

## 🎨 UI/UX Design Principles

### Simple & Clean
- Minimal interface, focus vào functionality
- Clear navigation flow
- Mobile-responsive design

### User-Friendly
- Progress indicators
- Auto-save drafts (optional)
- Clear instructions
- Loading states

### Accessible
- Semantic HTML
- Keyboard navigation
- Screen reader friendly
- High contrast colors

## 📱 Responsive Design

### Mobile-First Approach
```css
/* Mobile styles first */
.review-form {
  padding: 1rem;
  max-width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .review-form {
    max-width: 600px;
    margin: 0 auto;
  }
}
```

## 📈 Success Metrics

### Core Functionality
- [ ] Employee mapping success rate > 95%
- [ ] Review form completion rate > 80%
- [ ] Data accuracy in RESPONSES sheet

### User Experience
- [ ] Page load time < 3 seconds
- [ ] Mobile usability score > 80
- [ ] Zero critical JavaScript errors

### Business Impact
- [ ] Review completion time reduced
- [ ] Higher participation rate
- [ ] Accurate data collection

## 🚀 Deployment Strategy

### Development Environment
```bash
# Local development với Firebase Emulators
npm run serve  # Start Firebase emulators
```

### Staging Environment
- Deploy trên Firebase Hosting subdomain
- Test với staging Google Sheet
- UAT với real users

### Production Environment
- Production Firebase Hosting
- Production Google Sheet
- Monitoring và analytics setup

## ✅ Implementation Checklist

### Phase 1 - Infrastructure ✓
- [ ] Google Sheets API connection
- [ ] Service Account setup
- [ ] Base API endpoints
- [ ] Employee mapping logic

### Phase 2 - Core Features
- [ ] Welcome page & employee display
- [ ] Assignment listing
- [ ] Dynamic review form
- [ ] Response saving system

### Phase 3 - Polish & Deploy  
- [ ] Error handling & validation
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Production deployment

---

## 💡 Key Differences từ Plan Cũ

1. **Đơn giản hóa**: Không có complex role management, chỉ mapping email
2. **Google Sheets driven**: Mọi rule/logic được define trong sheets, không hardcode
3. **Linear workflow**: Clear flow từ login → mapping → assignments → review → save
4. **Minimal CRUD**: Chỉ READ từ các config sheets, chỉ WRITE vào RESPONSES
5. **User-focused**: Tập trung vào trải nghiệm đánh giá, không phải quản lý hệ thống

Kế hoạch mới này phù hợp với yêu cầu đơn giản và workflow rõ ràng mà bạn đã mô tả!