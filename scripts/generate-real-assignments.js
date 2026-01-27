const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script để parse quy tắc đánh giá từ sheet "PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ"
 * và tạo assignments chính xác theo quy định thực tế
 */
class RealAssignmentsGenerator {
  constructor() {
    this.excelPath = path.join(__dirname, '../docs/DS NHÂN SỰ.xlsx');
  }

  readExcelFile() {
    console.log('📖 Đang đọc file Excel...');
    const workbook = XLSX.readFile(this.excelPath);
    
    // Đọc sheet quy tắc đánh giá
    const evaluationRulesSheet = workbook.Sheets['PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ'];
    const evaluationRules = XLSX.utils.sheet_to_json(evaluationRulesSheet, { header: 1 });
    
    // Đọc sheet danh sách nhân viên  
    const employeeSheet = workbook.Sheets['EMPLOYEES'];
    const employeeData = XLSX.utils.sheet_to_json(employeeSheet, { header: 1 });
    
    return { evaluationRules, employeeData };
  }

  parseEvaluationRules(evaluationRules) {
    console.log('🔍 Phân tích quy tắc đánh giá...');
    
    const rules = [];
    let currentDepartmentHeader = null;
    
    evaluationRules.forEach((row, index) => {
      if (index === 0) return; // Skip header
      if (!row || row.length === 0) return; // Skip empty rows
      
      // Detect department headers like "BAN LÃNH ĐẠO"
      if (typeof row[0] === 'string' && row[0].includes('LÃNH ĐẠO')) {
        currentDepartmentHeader = row[0];
        return;
      }
      
      const [stt, name, email, position, note] = row;
      
      if (!email || !note) return;
      
      // Parse the evaluation rules from note
      const evaluatorInfo = {
        name,
        email,
        position,
        department: currentDepartmentHeader,
        rules: this.parseEvaluationNote(note)
      };
      
      rules.push(evaluatorInfo);
    });
    
    return rules;
  }

  parseEvaluationNote(note) {
    if (!note) return {};
    
    const rules = {
      evaluateEmployees: [], // CBNV
      evaluateManagers: []   // Quản lý  
    };
    
    // Split by line breaks and parse each line
    const lines = note.toString().split('\n');
    
    lines.forEach(line => {
      if (line.includes('Đánh giá CBNV:')) {
        const departments = line.replace('Đánh giá CBNV:', '').trim();
        rules.evaluateEmployees = departments.split(',').map(d => d.trim());
      } else if (line.includes('Đánh giá Quản lý:')) {
        const departments = line.replace('Đánh giá Quản lý:', '').trim();
        rules.evaluateManagers = departments.split(',').map(d => d.trim());
      }
    });
    
    return rules;
  }

  mapEmployeesByDepartment(employeeData) {
    const departmentMap = {};
    
    employeeData.forEach((row, index) => {
      if (index === 0) return; // Skip header
      
      const [employeeId, name, department, position, email] = row;
      if (!email || !department) return;
      
      if (!departmentMap[department]) {
        departmentMap[department] = [];
      }
      
      departmentMap[department].push({
        employeeId,
        name,
        department,
        position,
        email,
        isManager: this.isManagerPosition(position)
      });
    });
    
    return departmentMap;
  }

  isManagerPosition(position) {
    if (!position) return false;
    const pos = position.toLowerCase();
    return pos.includes('giám đốc') ||
           pos.includes('trưởng') ||
           pos.includes('quản lý') ||
           pos.includes('manager') ||
           pos.includes('tp.');
  }

  generateRealAssignments(evaluationRules, departmentMap) {
    console.log('🔄 Tạo assignments theo quy tắc thực tế...');
    
    const assignments = [];
    let assignmentId = 1;
    
    evaluationRules.forEach(evaluator => {
      console.log(`\n👤 ${evaluator.name} (${evaluator.email}):`);
      
      // Handle CBNV (Employee) evaluations
      if (evaluator.rules.evaluateEmployees.length > 0) {
        console.log(`   📋 Đánh giá CBNV: ${evaluator.rules.evaluateEmployees.join(', ')}`);
        
        evaluator.rules.evaluateEmployees.forEach(targetDept => {
          const normalizedDept = this.normalizeDepartmentName(targetDept);
          const employees = this.findEmployeesByDepartment(normalizedDept, departmentMap);
          
          employees.filter(emp => !emp.isManager && emp.email !== evaluator.email).forEach(employee => {
            assignments.push([
              assignmentId++,
              evaluator.email,
              employee.employeeId,
              '2024-Q4', 
              'EMPLOYEE',
              'PENDING'
            ]);
            console.log(`      ✓ ${employee.name} (${employee.email}) từ ${employee.department}`);
          });
        });
      }
      
      // Handle Manager evaluations  
      if (evaluator.rules.evaluateManagers.length > 0) {
        console.log(`   👔 Đánh giá Quản lý: ${evaluator.rules.evaluateManagers.join(', ')}`);
        
        evaluator.rules.evaluateManagers.forEach(targetDept => {
          const normalizedDept = this.normalizeDepartmentName(targetDept);
          const managers = this.findEmployeesByDepartment(normalizedDept, departmentMap);
          
          managers.filter(emp => emp.isManager && emp.email !== evaluator.email).forEach(manager => {
            assignments.push([
              assignmentId++,
              evaluator.email,
              manager.employeeId,
              '2024-Q4',
              'MANAGER', 
              'PENDING'
            ]);
            console.log(`      ✓ ${manager.name} (${manager.email}) từ ${manager.department}`);
          });
        });
      }
    });
    
    return assignments;
  }

  normalizeDepartmentName(deptName) {
    const mapping = {
      'Kế toán': 'HCNS - KT',
      'HCNS': 'HCNS - KT', 
      'Kho HN': 'KHO HN',
      'Kho HCM': 'KHO HCM',
      'Kinh Doanh 1': 'P. KDAM1',
      'Kinh Doanh 2': 'P. KDAM2', 
      'Kinh Doanh 3': 'P. KDAM3',
      'Marketing': 'MKT + VẬN HÀNH',
      'Ban Lãnh Đạo': 'BAN LÃNH ĐẠO'
    };
    
    return mapping[deptName] || deptName;
  }

  findEmployeesByDepartment(targetDept, departmentMap) {
    // Exact match first
    if (departmentMap[targetDept]) {
      return departmentMap[targetDept];
    }
    
    // Fuzzy search
    for (const [dept, employees] of Object.entries(departmentMap)) {
      if (dept.includes(targetDept) || targetDept.includes(dept)) {
        return employees;
      }
    }
    
    return [];
  }

  convertToCSV(data) {
    return data.map(row => {
      return row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',');
    }).join('\n');
  }

  generate() {
    try {
      console.log('🚀 Tạo assignments theo quy tắc thực tế...\n');
      
      // Read data
      const { evaluationRules, employeeData } = this.readExcelFile();
      
      // Parse evaluation rules
      const parsedRules = this.parseEvaluationRules(evaluationRules);
      console.log(`📋 Tìm thấy ${parsedRules.length} người có quyền đánh giá`);
      
      // Map employees by department
      const departmentMap = this.mapEmployeesByDepartment(employeeData);
      console.log(`🏢 Tìm thấy ${Object.keys(departmentMap).length} phòng ban`);
      
      // Generate assignments
      const assignments = this.generateRealAssignments(parsedRules, departmentMap);
      
      // Add header
      const assignmentsWithHeader = [
        ['assignment_id', 'reviewer_email', 'reviewee_employee_id', 'period', 'criteria_group', 'status'],
        ...assignments
      ];
      
      // Convert to CSV
      const assignmentsCSV = this.convertToCSV(assignmentsWithHeader);
      
      // Write file
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      fs.writeFileSync(path.join(outputDir, 'real_assignments.csv'), assignmentsCSV, 'utf8');
      
      console.log(`\n🎯 Kết quả:`);
      console.log(`   📊 Tổng assignments: ${assignments.length}`);
      console.log(`   📁 File: output/real_assignments.csv`);
      console.log(`\n🔥 Assignments này chính xác theo quy tắc công ty!`);
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      process.exit(1);
    }
  }
}

// Run generator
if (require.main === module) {
  const generator = new RealAssignmentsGenerator();
  generator.generate();
}

module.exports = RealAssignmentsGenerator;