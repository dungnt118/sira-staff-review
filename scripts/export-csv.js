const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script export dữ liệu từ Excel ra CSV để import vào Google Sheets
 */
class CSVExporter {
  constructor() {
    this.excelPath = path.join(__dirname, '../docs/DS NHÂN SỰ.xlsx');
  }

  readExcelFile() {
    console.log('📖 Đang đọc file Excel...');
    const workbook = XLSX.readFile(this.excelPath);
    const sheetNames = workbook.SheetNames;
    console.log('📊 Sheets tìm thấy:', sheetNames);

    // Tìm sheet EMPLOYEES hoặc sheet có data nhân viên
    let employeeSheet = null;
    if (sheetNames.includes('EMPLOYEES')) {
      employeeSheet = workbook.Sheets['EMPLOYEES'];
    } else if (sheetNames.includes('DS EMAIL CBNV')) {
      employeeSheet = workbook.Sheets['DS EMAIL CBNV'];
    } else if (sheetNames.includes('PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ')) {
      employeeSheet = workbook.Sheets['PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ'];
    }

    if (!employeeSheet) {
      throw new Error('Không tìm thấy sheet chứa dữ liệu nhân viên');
    }

    const data = XLSX.utils.sheet_to_json(employeeSheet, { header: 1 });
    return data;
  }

  generateAssignments(employeeData) {
    console.log('🔄 Tạo dữ liệu ASSIGNMENTS...');
    
    const assignments = [];
    const departments = {};

    // Parse employee data
    employeeData.forEach((row, index) => {
      if (index === 0 || !row || row.length === 0) return; // Skip header và row trống
      
      let employeeId, name, department, position, email;
      
      // Handle different sheet structures
      if (row[0] === 'BAN LÃNH ĐẠO' || typeof row[0] === 'string' && row[0].includes('LÃNH ĐẠO')) {
        return; // Skip department headers
      }
      
      // If first column is number (STT), use different mapping
      if (typeof row[0] === 'number') {
        [employeeId, name, position, , email] = row; // DS EMAIL CBNV format
        department = position; // Use position as department for now
      } else {
        [employeeId, name, department, position, email] = row; // EMPLOYEES format
      }

      if (!email || !name) return;

      if (!departments[department]) {
        departments[department] = [];
      }

      departments[department].push({
        employeeId: employeeId || index,
        name,
        department,
        position: position || 'Nhân viên',
        email
      });
    });

    console.log('📋 Phòng ban tìm thấy:');
    Object.keys(departments).forEach(dept => {
      console.log(`   ${dept}: ${departments[dept].length} người`);
    });

    // Generate assignments
    let assignmentId = 1;
    Object.keys(departments).forEach(deptName => {
      const deptEmployees = departments[deptName];
      
      // Find managers
      const managers = deptEmployees.filter(emp => {
        const pos = (emp.position || '').toLowerCase();
        return pos.includes('giám đốc') || 
               pos.includes('trưởng') || 
               pos.includes('quản lý') ||
               pos.includes('manager') ||
               pos.includes('tp.');
      });

      const reviewers = managers.length > 0 ? managers : [deptEmployees[0]];
      
      deptEmployees.forEach(reviewee => {
        const reviewer = reviewers.find(r => r.email !== reviewee.email) || reviewers[0];
        
        if (reviewer && reviewer.email !== reviewee.email) {
          assignments.push([
            assignmentId++,
            reviewer.email,
            reviewee.employeeId,
            '2024-Q4',
            reviewee.position.toLowerCase().includes('giám đốc') || 
            reviewee.position.toLowerCase().includes('trưởng') || 
            reviewee.position.toLowerCase().includes('quản lý') ? 'MANAGER' : 'EMPLOYEE',
            'PENDING'
          ]);
        }
      });
    });

    return assignments;
  }

  generateCriteria() {
    console.log('🔄 Tạo dữ liệu CRITERIA...');
    
    const criteria = [
      // Header
      ['criteria_id', 'criteria_name', 'target_type'],
      
      // Employee criteria
      [1, 'Chất lượng công việc', 'EMPLOYEE'],
      [2, 'Tiến độ hoàn thành công việc', 'EMPLOYEE'],
      [3, 'Khả năng làm việc nhóm', 'EMPLOYEE'],
      [4, 'Thái độ làm việc', 'EMPLOYEE'],
      [5, 'Khả năng học hỏi và phát triển', 'EMPLOYEE'],
      
      // Manager criteria  
      [6, 'Khả năng lãnh đạo', 'MANAGER'],
      [7, 'Khả năng quản lý nhóm', 'MANAGER'],
      [8, 'Khả năng ra quyết định', 'MANAGER'],
      [9, 'Tầm nhìn chiến lược', 'MANAGER'],
      [10, 'Khả năng phát triển nhân tài', 'MANAGER']
    ];

    return criteria;
  }

  convertToCSV(data) {
    return data.map(row => {
      return row.map(cell => {
        // Escape commas and quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',');
    }).join('\n');
  }

  export() {
    try {
      console.log('🚀 Bắt đầu export dữ liệu...\n');
      
      // Read Excel
      const employeeData = this.readExcelFile();
      console.log(`📊 Đọc được ${employeeData.length} dòng từ Excel\n`);
      
      // Generate data
      const assignments = this.generateAssignments(employeeData);
      const criteria = this.generateCriteria();
      
      console.log(`\n📋 Đã tạo:`);
      console.log(`   - ${assignments.length} assignments`);
      console.log(`   - ${criteria.length - 1} criteria\n`);
      
      // Add headers
      const assignmentsWithHeader = [
        ['assignment_id', 'reviewer_email', 'reviewee_employee_id', 'period', 'criteria_group', 'status'],
        ...assignments
      ];
      
      // Convert to CSV
      const assignmentsCSV = this.convertToCSV(assignmentsWithHeader);
      const criteriaCSV = this.convertToCSV(criteria);
      
      // Write files
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      fs.writeFileSync(path.join(outputDir, 'assignments.csv'), assignmentsCSV, 'utf8');
      fs.writeFileSync(path.join(outputDir, 'criteria.csv'), criteriaCSV, 'utf8');
      
      console.log('📁 Files exported:');
      console.log(`   - ${path.join(outputDir, 'assignments.csv')}`);
      console.log(`   - ${path.join(outputDir, 'criteria.csv')}`);
      
      console.log('\n🎯 Hướng dẫn import:');
      console.log('1. Mở Google Sheets: https://sheets.google.com');
      console.log('2. Mở spreadsheet: DS NHÂN SỰ');
      console.log('3. Chọn sheet ASSIGNMENTS -> File -> Import -> Upload CSV assignments.csv');
      console.log('4. Chọn sheet CRITERIA -> File -> Import -> Upload CSV criteria.csv');
      console.log('5. Chọn "Replace data" để thay thế dữ liệu hiện tại');
      
      console.log('\n🎉 Export hoàn thành!');
      
    } catch (error) {
      console.error('❌ Export thất bại:', error.message);
      process.exit(1);
    }
  }
}

// Run export
if (require.main === module) {
  const exporter = new CSVExporter();
  exporter.export();
}

module.exports = CSVExporter;