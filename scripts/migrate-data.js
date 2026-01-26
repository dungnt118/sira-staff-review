const XLSX = require('xlsx');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

/**
 * Script để migrate dữ liệu từ file Excel DS NHÂN SỰ.xlsx 
 * vào Google Sheets ASSIGNMENTS và CRITERIA
 */
class DataMigrator {
  constructor() {
    this.spreadsheetId = '1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko';
    this.serviceAccountPath = '../functions/serviceAccount.json';
    this.sheets = null;
  }

  /**
   * Initialize Google Sheets API với Service Account
   */
  async initSheetsAPI() {
    try {
      console.log('🔑 Khởi tạo Google Sheets API với Service Account...');
      
      if (!fs.existsSync(this.serviceAccountPath)) {
        throw new Error('Không tìm thấy file serviceAccount.json trong thư mục functions');
      }

      const auth = new GoogleAuth({
        keyFile: this.serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Khởi tạo Google Sheets API thành công');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo Google Sheets API:', error.message);
      throw error;
    }
  }

  /**
   * Đọc file Excel và extract dữ liệu
   */
  readExcelFile() {
    const excelPath = path.join(__dirname, '../docs/DS NHÂN SỰ.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`File không tồn tại: ${excelPath}`);
    }

    console.log(`📖 Đang đọc file: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    
    console.log('📊 Các sheet có trong file:', workbook.SheetNames);
    
    // Đọc tất cả sheets
    const data = {};
    workbook.SheetNames.forEach(sheetName => {
      console.log(`📄 Đang đọc sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Log một vài dòng đầu để kiểm tra structure
      console.log(`   📝 Header: ${JSON.stringify(jsonData[0])}`);
      console.log(`   📝 Số dòng: ${jsonData.length}`);
      if (jsonData.length > 1) {
        console.log(`   📝 Dòng mẫu: ${JSON.stringify(jsonData[1])}`);
      }
      
      data[sheetName] = jsonData;
    });

    return data;
  }

  /**
   * Chuẩn hóa dữ liệu thành format ASSIGNMENTS
   * ASSIGNMENTS sheet structure:
   * assignment_id, reviewer_email, reviewee_employee_id, period, criteria_group, status
   */
  generateAssignments(employeeData) {
    console.log('🔄 Đang chuẩn hóa dữ liệu ASSIGNMENTS...');
    
    const assignments = [];
    const assignmentId = 1;
    
    // Giả định: Tạo assignments dựa trên cấu trúc phòng ban
    // Mỗi nhân viên sẽ được đánh giá bởi manager của phòng ban
    const departments = {};
    
    // Nhóm nhân viên theo phòng ban
    employeeData.forEach((row, index) => {
      if (index === 0) return; // Skip header
      
      const [employeeId, name, department, position, email] = row;
      if (!department || !email) return;
      
      if (!departments[department]) {
        departments[department] = [];
      }
      
      departments[department].push({
        employeeId,
        name,
        department,
        position,
        email
      });
    });

    console.log('📋 Phòng ban và số lượng nhân viên:');
    Object.keys(departments).forEach(dept => {
      console.log(`   ${dept}: ${departments[dept].length} người`);
    });

    // Tạo assignments
    let currentAssignmentId = 1;
    
    Object.keys(departments).forEach(deptName => {
      const deptEmployees = departments[deptName];
      
      // Tìm manager/lead của phòng ban (người có position cao nhất)
      const managers = deptEmployees.filter(emp => {
        const position = (emp.position || '').toString().toLowerCase();
        return position.includes('giám đốc') ||
               position.includes('trưởng') ||
               position.includes('manager') ||
               position.includes('tp.') ||
               position.includes('quản lý');
      });
      
      const reviewers = managers.length > 0 ? managers : [deptEmployees[0]]; // Fallback to first employee
      
      // Tạo assignments cho từng nhân viên trong phòng ban
      deptEmployees.forEach(reviewee => {
        // Chọn reviewer (không tự review)
        const reviewer = reviewers.find(r => r.employeeId !== reviewee.employeeId) || reviewers[0];
        
        if (reviewer && reviewer.employeeId !== reviewee.employeeId) {
          assignments.push([
            `ASG${currentAssignmentId.toString().padStart(3, '0')}`, // assignment_id
            reviewer.email,                                          // reviewer_email  
            reviewee.employeeId,                                     // reviewee_employee_id
            '2026_Q1',                                              // period
            'STANDARD_CRITERIA',                                    // criteria_group
            'PENDING'                                               // status
          ]);
          currentAssignmentId++;
        }
      });
    });

    console.log(`✅ Đã tạo ${assignments.length} assignments`);
    return assignments;
  }

  /**
   * Chuẩn hóa dữ liệu thành format CRITERIA
   * CRITERIA sheet structure: 
   * criteria_id, criteria_group, criteria_name, description, weight, type
   */
  generateCriteria() {
    console.log('🔄 Đang chuẩn hóa dữ liệu CRITERIA...');
    
    // Tạo bộ tiêu chí chuẩn cho đánh giá nhân viên
    const criteria = [
      // Header
      ['criteria_id', 'criteria_group', 'criteria_name', 'description', 'weight', 'type'],
      
      // Tiêu chí đánh giá chuẩn
      ['CR001', 'STANDARD_CRITERIA', 'Chất lượng công việc', 'Đánh giá chất lượng và độ chính xác trong công việc được giao', '25', 'RATING'],
      ['CR002', 'STANDARD_CRITERIA', 'Hiệu suất làm việc', 'Khả năng hoàn thành công việc đúng thời hạn và đạt mục tiêu', '20', 'RATING'],
      ['CR003', 'STANDARD_CRITERIA', 'Kỹ năng chuyên môn', 'Trình độ chuyên môn và kỹ năng kỹ thuật trong lĩnh vực công tác', '20', 'RATING'],
      ['CR004', 'STANDARD_CRITERIA', 'Tinh thần trách nhiệm', 'Thái độ làm việc nghiêm túc và tinh thần trách nhiệm với công việc', '15', 'RATING'],
      ['CR005', 'STANDARD_CRITERIA', 'Kỹ năng giao tiếp', 'Khả năng giao tiếp, phối hợp làm việc với đồng nghiệp và cấp trên', '10', 'RATING'],
      ['CR006', 'STANDARD_CRITERIA', 'Tính sáng tạo', 'Khả năng đưa ra ý tưởng mới và cải tiến quy trình làm việc', '10', 'RATING'],
      
      // Tiêu chí cho lãnh đạo
      ['CR007', 'LEADERSHIP_CRITERIA', 'Khả năng lãnh đạo', 'Kỹ năng quản lý, điều hành và dẫn dắt team', '30', 'RATING'],
      ['CR008', 'LEADERSHIP_CRITERIA', 'Tầm nhìn chiến lược', 'Khả năng đề ra chiến lược và định hướng phát triển', '25', 'RATING'], 
      ['CR009', 'LEADERSHIP_CRITERIA', 'Quản lý nhân sự', 'Kỹ năng quản lý, phát triển và động viên nhân viên', '25', 'RATING'],
      ['CR010', 'LEADERSHIP_CRITERIA', 'Ra quyết định', 'Khả năng ra quyết định đúng đắn trong các tình huống khó khăn', '20', 'RATING']
    ];

    console.log(`✅ Đã tạo ${criteria.length - 1} criteria`);
    return criteria;
  }

  /**
   * Ghi dữ liệu vào Google Sheets
   */
  async writeToGoogleSheets(sheetName, data, range = 'A:Z') {
    try {
      console.log(`📤 Đang ghi ${data.length} dòng vào sheet ${sheetName}...`);
      
      // Clear existing data first
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`
      });

      // Write new data
      const result = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });

      console.log(`✅ Đã ghi thành công vào ${sheetName}: ${result.data.updatedRows} dòng`);
      return result;
      
    } catch (error) {
      console.error(`❌ Lỗi khi ghi vào ${sheetName}:`, error.message);
      throw error;
    }
  }

  /**
   * Chạy migration process chính
   */
  async migrate() {
    try {
      console.log('🚀 Bắt đầu quá trình migration dữ liệu...\n');
      
      // Initialize Google Sheets API với Service Account
      await this.initSheetsAPI();
      
      // 1. Đọc file Excel
      const excelData = this.readExcelFile();
      console.log('');

      // 2. Tìm sheet chứa dữ liệu nhân viên
      let employeeData = null;
      for (const [sheetName, data] of Object.entries(excelData)) {
        // Tìm sheet có chứa thông tin nhân viên (có cột email/tên)
        if (data.length > 1 && data[0]) {
          const headers = data[0].map(h => (h || '').toString().toLowerCase());
          if (headers.some(h => h.includes('email') || h.includes('mail')) ||
              headers.some(h => h.includes('tên') || h.includes('name'))) {
            employeeData = data;
            console.log(`📋 Sử dụng sheet "${sheetName}" làm nguồn dữ liệu nhân viên`);
            break;
          }
        }
      }

      if (!employeeData) {
        throw new Error('Không tìm thấy sheet chứa thông tin nhân viên');
      }

      // 3. Chuẩn hóa dữ liệu
      const assignments = this.generateAssignments(employeeData);
      const criteria = this.generateCriteria();
      console.log('');

      // 4. Ghi vào Google Sheets
      console.log('📤 Bắt đầu ghi dữ liệu vào Google Sheets...');
      
      // Thêm header cho assignments
      const assignmentsWithHeader = [
        ['assignment_id', 'reviewer_email', 'reviewee_employee_id', 'period', 'criteria_group', 'status'],
        ...assignments
      ];
      
      await this.writeToGoogleSheets('ASSIGNMENTS', assignmentsWithHeader);
      await this.writeToGoogleSheets('CRITERIA', criteria);

      console.log('\n🎉 Migration hoàn thành thành công!');
      console.log(`📊 Kết quả:`);
      console.log(`   - ASSIGNMENTS: ${assignments.length} records`);
      console.log(`   - CRITERIA: ${criteria.length - 1} records`);
      
    } catch (error) {
      console.error('\n❌ Migration thất bại:', error.message);
      console.error('Chi tiết lỗi:', error.stack);
      process.exit(1);
    }
  }
}

// Chạy migration nếu script được gọi trực tiếp
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.migrate();
}

module.exports = DataMigrator;