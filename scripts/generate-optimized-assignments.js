const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script tạo assignments tối ưu - loại bỏ period, giữ lại status
 */
class OptimizedAssignmentsGenerator {
  constructor() {
    this.excelPath = path.join(__dirname, '../docs/DS NHÂN SỰ.xlsx');
  }

  readExcelFile() {
    console.log('📖 Đang đọc file Excel...');
    const workbook = XLSX.readFile(this.excelPath);
    
    const evaluationRulesSheet = workbook.Sheets['PHÒNG BAN PHỐI HỢP ĐÁNH GIÁ'];
    const evaluationRules = XLSX.utils.sheet_to_json(evaluationRulesSheet, { header: 1 });
    
    const employeeSheet = workbook.Sheets['EMPLOYEES'];
    const employeeData = XLSX.utils.sheet_to_json(employeeSheet, { header: 1 });
    
    return { evaluationRules, employeeData };
  }

  parseEvaluationRules(evaluationRules) {
    console.log('🔍 Phân tích quy tắc đánh giá...');
    
    const rules = [];
    let currentDepartmentHeader = null;
    
    evaluationRules.forEach((row, index) => {
      if (index === 0) return;
      if (!row || row.length === 0) return;
      
      if (typeof row[0] === 'string' && row[0].includes('LÃNH ĐẠO')) {
        currentDepartmentHeader = row[0];
        return;
      }
      
      const [stt, name, email, position, note] = row;
      
      if (!email || !note) return;
      
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
      evaluateEmployees: [],
      evaluateManagers: []   
    };
    
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
      if (index === 0) return;
      
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

  generateOptimizedAssignments(evaluationRules, departmentMap) {
    console.log('🔄 Tạo assignments tối ưu...');
    
    const assignments = [];
    const assignmentSet = new Set(); // Tránh duplicate
    let assignmentId = 1;
    
    evaluationRules.forEach(evaluator => {
      console.log(`\n👤 ${evaluator.name}:`);
      
      // Handle CBNV evaluations
      if (evaluator.rules.evaluateEmployees.length > 0) {
        evaluator.rules.evaluateEmployees.forEach(targetDept => {
          const normalizedDept = this.normalizeDepartmentName(targetDept);
          const employees = this.findEmployeesByDepartment(normalizedDept, departmentMap);
          
          employees.filter(emp => !emp.isManager && emp.email !== evaluator.email).forEach(employee => {
            const assignmentKey = `${evaluator.email}-${employee.employeeId}`;
            if (!assignmentSet.has(assignmentKey)) {
              assignmentSet.add(assignmentKey);
              assignments.push([
                assignmentId++,
                evaluator.email,
                employee.employeeId,
                'EMPLOYEE', // target_type thay vì criteria_group
                'PENDING'   // status để track tiến độ
              ]);
              console.log(`   📋 CBNV: ${employee.name} (${employee.department})`);
            }
          });
        });
      }
      
      // Handle Manager evaluations  
      if (evaluator.rules.evaluateManagers.length > 0) {
        evaluator.rules.evaluateManagers.forEach(targetDept => {
          const normalizedDept = this.normalizeDepartmentName(targetDept);
          const managers = this.findEmployeesByDepartment(normalizedDept, departmentMap);
          
          managers.filter(emp => emp.isManager && emp.email !== evaluator.email).forEach(manager => {
            const assignmentKey = `${evaluator.email}-${manager.employeeId}`;
            if (!assignmentSet.has(assignmentKey)) {
              assignmentSet.add(assignmentKey);
              assignments.push([
                assignmentId++,
                evaluator.email,
                manager.employeeId,
                'MANAGER',
                'PENDING'
              ]);
              console.log(`   👔 MANAGER: ${manager.name} (${manager.department})`);
            }
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
    if (departmentMap[targetDept]) {
      return departmentMap[targetDept];
    }
    
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
      console.log('🚀 Tạo assignments tối ưu...\n');
      
      const { evaluationRules, employeeData } = this.readExcelFile();
      const parsedRules = this.parseEvaluationRules(evaluationRules);
      const departmentMap = this.mapEmployeesByDepartment(employeeData);
      const assignments = this.generateOptimizedAssignments(parsedRules, departmentMap);
      
      // Header tối ưu - bỏ period, giữ status có ý nghĩa
      const assignmentsWithHeader = [
        ['assignment_id', 'reviewer_email', 'reviewee_employee_id', 'target_type', 'status'],
        ...assignments
      ];
      
      const assignmentsCSV = this.convertToCSV(assignmentsWithHeader);
      
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      fs.writeFileSync(path.join(outputDir, 'optimized_assignments.csv'), assignmentsCSV, 'utf8');
      
      console.log(`\n🎯 Kết quả tối ưu:`);
      console.log(`   📊 Tổng assignments: ${assignments.length} (loại bỏ duplicate)`);
      console.log(`   📁 File: output/optimized_assignments.csv`);
      console.log(`   ✅ Đã loại bỏ: period (không cần thiết)`);
      console.log(`   ✅ Đã giữ lại: status (để track tiến độ)`);
      console.log(`   📋 Cấu trúc: assignment_id | reviewer_email | reviewee_employee_id | target_type | status`);
      
      console.log(`\n📝 Ý nghĩa các trường:`);
      console.log(`   • assignment_id: ID duy nhất của phân công`);
      console.log(`   • reviewer_email: Email người đánh giá`);
      console.log(`   • reviewee_employee_id: ID nhân viên được đánh giá`);
      console.log(`   • target_type: EMPLOYEE/MANAGER (loại đánh giá)`);
      console.log(`   • status: PENDING/IN_PROGRESS/COMPLETED (trạng thái)`);
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new OptimizedAssignmentsGenerator();
  generator.generate();
}

module.exports = OptimizedAssignmentsGenerator;