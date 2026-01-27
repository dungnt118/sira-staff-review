const fs = require('fs');
const path = require('path');

/**
 * Script tạo criteria đầy đủ và thực tế hơn cho hệ thống đánh giá
 */
class ComprehensiveCriteriaGenerator {
  generateComprehensiveCriteria() {
    console.log('🔄 Tạo criteria đầy đủ và thực tế...');
    
    const criteria = [
      // Header
      ['criteria_id', 'criteria_name', 'target_type', 'description', 'weight'],
      
      // === EMPLOYEE CRITERIA (Tiêu chí CBNV) ===
      [1, 'Chất lượng công việc', 'EMPLOYEE', 'Độ chính xác, hoàn thiện và chất lượng sản phẩm công việc', 25],
      [2, 'Tiến độ hoàn thành công việc', 'EMPLOYEE', 'Khả năng hoàn thành công việc đúng thời hạn', 20],
      [3, 'Khả năng làm việc nhóm', 'EMPLOYEE', 'Phối hợp, hỗ trợ đồng nghiệp và làm việc hiệu quả trong nhóm', 15],
      [4, 'Thái độ làm việc', 'EMPLOYEE', 'Tích cực, nhiệt tình, trách nhiệm với công việc', 15],
      [5, 'Khả năng học hỏi và phát triển', 'EMPLOYEE', 'Tiếp thu kiến thức mới, cải thiện kỹ năng liên tục', 10],
      [6, 'Tuân thủ quy định', 'EMPLOYEE', 'Chấp hành nội quy, quy trình làm việc của công ty', 10],
      [7, 'Sáng tạo và đổi mới', 'EMPLOYEE', 'Đưa ra ý tưởng mới, cải tiến quy trình làm việc', 5],
      
      // === MANAGER CRITERIA (Tiêu chí Quản lý) ===
      [8, 'Khả năng lãnh đạo', 'MANAGER', 'Dẫn dắt, truyền cảm hứng và định hướng nhóm', 25],
      [9, 'Khả năng quản lý nhóm', 'MANAGER', 'Tổ chức, phân công và điều phối công việc hiệu quả', 20],
      [10, 'Khả năng ra quyết định', 'MANAGER', 'Đưa ra quyết định đúng đắn, kịp thời', 15],
      [11, 'Tầm nhìn chiến lược', 'MANAGER', 'Định hướng phát triển dài hạn cho phòng ban/công ty', 15],
      [12, 'Khả năng phát triển nhân tài', 'MANAGER', 'Đào tạo, hỗ trợ và phát triển nhân viên', 10],
      [13, 'Khả năng giao tiếp', 'MANAGER', 'Truyền đạt thông tin rõ ràng, lắng nghe và phản hồi', 10],
      [14, 'Quản lý tài nguyên', 'MANAGER', 'Sử dụng hiệu quả nguồn lực, ngân sách, thời gian', 5],
      
      // === CROSS-FUNCTIONAL CRITERIA (Tiêu chí chung) ===
      [15, 'Khả năng giao tiếp', 'EMPLOYEE', 'Truyền đạt ý tưởng rõ ràng, lắng nghe hiệu quả', 10],
      [16, 'Kỹ năng giải quyết vấn đề', 'EMPLOYEE', 'Phân tích và tìm giải pháp cho các vấn đề phát sinh', 15],
      [17, 'Khách hàng trung tâm', 'EMPLOYEE', 'Tập trung vào nhu cầu và sự hài lòng của khách hàng', 10],
      [18, 'Tính chủ động', 'EMPLOYEE', 'Tự giác, chủ động trong công việc không cần giám sát', 15],
      
      // === DEPARTMENT-SPECIFIC CRITERIA ===
      [19, 'Hiệu quả bán hàng', 'EMPLOYEE', 'Đạt được mục tiêu doanh số và phát triển khách hàng', 30],
      [20, 'Kỹ năng đàm phán', 'EMPLOYEE', 'Đàm phán hiệu quả với khách hàng và đối tác', 20],
      [21, 'Độ chính xác báo cáo tài chính', 'EMPLOYEE', 'Lập báo cáo tài chính chính xác, kịp thời', 35],
      [22, 'Tuân thủ quy định kế toán', 'EMPLOYEE', 'Thực hiện đúng chuẩn mực kế toán Việt Nam', 25],
      [23, 'Hiệu quả marketing', 'EMPLOYEE', 'Tạo ra campaigns hiệu quả, tăng brand awareness', 30],
      [24, 'Sáng tạo nội dung', 'EMPLOYEE', 'Tạo nội dung hấp dẫn, phù hợp với target audience', 25],
      [25, 'Quản lý kho hiệu quả', 'EMPLOYEE', 'Kiểm soát hàng tồn kho, giảm thất thoát', 30],
      [26, 'An toàn lao động', 'EMPLOYEE', 'Tuân thủ quy định an toàn trong quá trình làm việc', 20]
    ];

    return criteria;
  }

  generateDefaultCriteria() {
    console.log('🔄 Tạo criteria mặc định đơn giản...');
    
    const criteria = [
      // Header
      ['criteria_id', 'criteria_name', 'target_type'],
      
      // Employee criteria
      [1, 'Chất lượng công việc', 'EMPLOYEE'],
      [2, 'Tiến độ hoàn thành công việc', 'EMPLOYEE'],
      [3, 'Khả năng làm việc nhóm', 'EMPLOYEE'],
      [4, 'Thái độ làm việc', 'EMPLOYEE'],
      [5, 'Khả năng học hỏi và phát triển', 'EMPLOYEE'],
      [6, 'Khả năng giao tiếp', 'EMPLOYEE'],
      [7, 'Tính chủ động', 'EMPLOYEE'],
      [8, 'Kỹ năng giải quyết vấn đề', 'EMPLOYEE'],
      
      // Manager criteria  
      [9, 'Khả năng lãnh đạo', 'MANAGER'],
      [10, 'Khả năng quản lý nhóm', 'MANAGER'],
      [11, 'Khả năng ra quyết định', 'MANAGER'],
      [12, 'Tầm nhìn chiến lược', 'MANAGER'],
      [13, 'Khả năng phát triển nhân tài', 'MANAGER'],
      [14, 'Quản lý tài nguyên', 'MANAGER'],
      [15, 'Khả năng giao tiếp cấp cao', 'MANAGER']
    ];

    return criteria;
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
      console.log('🚀 Tạo criteria cải tiến...\n');
      
      // Generate comprehensive criteria
      const comprehensiveCriteria = this.generateComprehensiveCriteria();
      const defaultCriteria = this.generateDefaultCriteria();
      
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      // Write comprehensive version
      const comprehensiveCSV = this.convertToCSV(comprehensiveCriteria);
      fs.writeFileSync(path.join(outputDir, 'comprehensive_criteria.csv'), comprehensiveCSV, 'utf8');
      
      // Write improved default version  
      const defaultCSV = this.convertToCSV(defaultCriteria);
      fs.writeFileSync(path.join(outputDir, 'improved_criteria.csv'), defaultCSV, 'utf8');
      
      console.log('📁 Files created:');
      console.log('   📊 comprehensive_criteria.csv: 26 tiêu chí chi tiết (có mô tả + trọng số)');
      console.log('   📋 improved_criteria.csv: 15 tiêu chí cải tiến (đơn giản hơn)');
      
      console.log('\n🎯 So sánh với criteria.csv hiện tại:');
      console.log('   ❌ criteria.csv cũ: 10 tiêu chí generic');
      console.log('   ✅ improved_criteria.csv: 15 tiêu chí đầy đủ hơn');
      console.log('   🏆 comprehensive_criteria.csv: 26 tiêu chí professional với mô tả');
      
      console.log('\n💡 Khuyến nghị:');
      console.log('   • Dùng improved_criteria.csv: Đơn giản, đủ dùng');
      console.log('   • Dùng comprehensive_criteria.csv: Professional, chi tiết');
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new ComprehensiveCriteriaGenerator();
  generator.generate();
}

module.exports = ComprehensiveCriteriaGenerator;