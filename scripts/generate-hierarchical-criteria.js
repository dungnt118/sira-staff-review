const fs = require('fs');
const path = require('path');

/**
 * Script tạo criteria với cấu trúc phân cấp đúng theo mẫu đánh giá SIRA
 */
class HierarchicalCriteriaGenerator {
  generateHierarchicalCriteria() {
    console.log('🔄 Tạo criteria với cấu trúc phân cấp...');
    
    const criteria = [
      // Header
      ['criteria_id', 'criteria_name', 'target_type', 'category', 'description', 'parent_id', 'level'],
      
      // === EMPLOYEE CRITERIA - Có cấu trúc phân cấp ===
      
      // LEVEL 1: Categories (Nhóm chính)
      [1, 'Chấp hành nội quy', 'EMPLOYEE', 'Chấp hành nội quy', 'Nhóm đánh giá về tuân thủ nội quy lao động', null, 1],
      [2, 'Tác phong', 'EMPLOYEE', 'Tác phong', 'Nhóm đánh giá về thái độ và tác phong làm việc', null, 1],
      [3, 'Quan hệ', 'EMPLOYEE', 'Quan hệ', 'Nhóm đánh giá về mối quan hệ và phục vụ khách hàng', null, 1],
      [4, 'Công việc', 'EMPLOYEE', 'Công việc', 'Nhóm đánh giá về năng lực và hiệu quả công việc', null, 1],
      [5, 'Kỹ năng', 'EMPLOYEE', 'Kỹ năng', 'Nhóm đánh giá về các kỹ năng cần thiết', null, 1],
      [6, 'Sử dụng trang thiết bị', 'EMPLOYEE', 'Sử dụng trang thiết bị', 'Nhóm đánh giá về sử dụng tài sản công ty', null, 1],
      
      // LEVEL 2: Sub-criteria (Tiêu chí con)
      
      // 1. CHẤP HÀNH NỘI QUY (parent_id = 1)
      [7, 'Tuân thủ giờ làm việc và nội quy lao động', 'EMPLOYEE', 'Chấp hành nội quy', 'Đúng giờ, tuân thủ quy định lao động', 1, 2],
      [8, 'Tuân thủ nội quy, quy chế làm việc của Công ty', 'EMPLOYEE', 'Chấp hành nội quy', 'Chấp hành nghiêm túc các quy định nội bộ', 1, 2],
      
      // 2. TÁC PHONG (parent_id = 2)
      [9, 'Ăn mặc gọn gàng, sạch sẽ', 'EMPLOYEE', 'Tác phong', 'Trang phục chỉn chu, phù hợp môi trường làm việc', 2, 2],
      [10, 'Giữ gìn vệ sinh chung và vệ sinh nơi làm việc', 'EMPLOYEE', 'Tác phong', 'Duy trì môi trường làm việc sạch sẽ, gọn gàng', 2, 2],
      [11, 'Nhanh nhẹn, linh hoạt', 'EMPLOYEE', 'Tác phong', 'Xử lý công việc một cách nhanh chóng và linh động', 2, 2],
      
      // 3. QUAN HỆ (parent_id = 3)
      [12, 'Quan hệ với cấp trên, đồng nghiệp và khách hàng', 'EMPLOYEE', 'Quan hệ', 'Duy trì mối quan hệ tích cực, chuyên nghiệp', 3, 2],
      [13, 'Giải quyết yêu cầu của khách hàng nhanh chóng, kịp thời', 'EMPLOYEE', 'Quan hệ', 'Phản hồi và xử lý yêu cầu khách hàng hiệu quả', 3, 2],
      [14, 'Thái độ chăm sóc khách hàng cẩn thận, chu đáo', 'EMPLOYEE', 'Quan hệ', 'Phục vụ khách hàng tận tâm, thỏa mãn nhu cầu', 3, 2],
      
      // 4. CÔNG VIỆC (parent_id = 4)
      [15, 'Tinh thần hợp tác trong công việc', 'EMPLOYEE', 'Công việc', 'Làm việc nhóm hiệu quả, hỗ trợ đồng nghiệp', 4, 2],
      [16, 'Thao tác thực hiện công việc', 'EMPLOYEE', 'Công việc', 'Kỹ năng và phương pháp thực hiện nhiệm vụ', 4, 2],
      [17, 'Chất lượng, số lượng công việc hoàn thành (%/tháng)', 'EMPLOYEE', 'Công việc', 'Đạt và vượt chỉ tiêu được giao', 4, 2],
      [18, 'Mức độ hiểu biết về công việc được giao', 'EMPLOYEE', 'Công việc', 'Nắm vững yêu cầu và bản chất công việc', 4, 2],
      [19, 'Khả năng tiếp thu công việc', 'EMPLOYEE', 'Công việc', 'Học hỏi và làm chủ công việc mới nhanh chóng', 4, 2],
      [20, 'Hiểu rõ các nghiệp vụ của công việc', 'EMPLOYEE', 'Công việc', 'Nắm vững quy trình và nghiệp vụ chuyên môn', 4, 2],
      [21, 'Kiến thức chuyên môn phù hợp với công việc', 'EMPLOYEE', 'Công việc', 'Có đủ kiến thức và kỹ năng cần thiết', 4, 2],
      [22, 'Mức độ tin cậy', 'EMPLOYEE', 'Công việc', 'Đáng tin cậy trong thực hiện nhiệm vụ', 4, 2],
      [23, 'Đóng góp nổi bật trong năm', 'EMPLOYEE', 'Công việc', 'Có những thành tích, cải tiến đáng kể', 4, 2],
      [24, 'Khả năng làm việc độc lập và sự chủ động', 'EMPLOYEE', 'Công việc', 'Tự giác, chủ động trong công việc', 4, 2],
      [25, 'Sự sáng tạo trong công việc', 'EMPLOYEE', 'Công việc', 'Đưa ra ý tưởng mới, cải tiến quy trình', 4, 2],
      [26, 'Hiểu biết về sản phẩm dịch vụ của Công ty', 'EMPLOYEE', 'Công việc', 'Nắm vững portfolio và giá trị công ty', 4, 2],
      [27, 'Tinh thần học hỏi và cầu tiến', 'EMPLOYEE', 'Công việc', 'Không ngừng học hỏi và phát triển bản thân', 4, 2],
      [28, 'Chấp hành mệnh lệnh của người quản lý', 'EMPLOYEE', 'Công việc', 'Tuân thủ và thực hiện chỉ đạo của cấp trên', 4, 2],
      
      // 5. KỸ NĂNG (parent_id = 5)
      [29, 'Kỹ năng giao tiếp', 'EMPLOYEE', 'Kỹ năng', 'Truyền đạt thông tin rõ ràng, hiệu quả', 5, 2],
      [30, 'Kỹ năng làm việc nhóm', 'EMPLOYEE', 'Kỹ năng', 'Phối hợp và hợp tác tốt trong team', 5, 2],
      [31, 'Kỹ năng mềm: giao tiếp, đàm phán, thuyết phục', 'EMPLOYEE', 'Kỹ năng', 'Vận dụng linh hoạt các kỹ năng mềm', 5, 2],
      [32, 'Kỹ năng giải quyết vấn đề', 'EMPLOYEE', 'Kỹ năng', 'Phân tích và tìm giải pháp hiệu quả', 5, 2],
      [33, 'Kỹ năng hoạch định công việc và quản lý', 'EMPLOYEE', 'Kỹ năng', 'Lập kế hoạch và quản lý thời gian tốt', 5, 2],
      [34, 'Kỹ năng thích ứng với công việc/áp lực', 'EMPLOYEE', 'Kỹ năng', 'Làm việc hiệu quả dưới áp lực', 5, 2],
      
      // 6. SỬ DỤNG TRANG THIẾT BỊ (parent_id = 6)
      [35, 'Sử dụng thành thạo các máy móc thiết bị', 'EMPLOYEE', 'Sử dụng trang thiết bị', 'Vận hành thiết bị một cách chuyên nghiệp', 6, 2],
      [36, 'Tinh thần sử dụng tiết kiệm tài sản Công ty', 'EMPLOYEE', 'Sử dụng trang thiết bị', 'Bảo vệ và sử dụng hiệu quả tài sản công ty', 6, 2],
      
      // === MANAGER CRITERIA - Chỉ có 1 cấp (level 1) ===
      [37, 'Năng lực chuyên môn & hiểu biết công việc', 'MANAGER', 'Năng lực chuyên môn', 'Có kiến thức sâu rộng về lĩnh vực quản lý', null, 1],
      [38, 'Khả năng định hướng, dẫn dắt đội nhóm', 'MANAGER', 'Lãnh đạo', 'Định hướng rõ ràng và dẫn dắt team hiệu quả', null, 1],
      [39, 'Tính công bằng, minh bạch trong quản lý', 'MANAGER', 'Quản lý', 'Đối xử công bằng, quyết định minh bạch', null, 1],
      [40, 'Khả năng lắng nghe & tiếp thu ý kiến CBNV', 'MANAGER', 'Giao tiếp', 'Lắng nghe và tiếp thu góp ý từ nhân viên', null, 1],
      [41, 'Kỹ năng giao tiếp & truyền đạt thông tin', 'MANAGER', 'Giao tiếp', 'Truyền đạt thông tin rõ ràng, hiệu quả', null, 1],
      [42, 'Khả năng ra quyết định & giải quyết vấn đề', 'MANAGER', 'Ra quyết định', 'Quyết định đúng đắn và giải quyết vấn đề kịp thời', null, 1],
      [43, 'Khả năng tạo động lực, truyền cảm hứng', 'MANAGER', 'Lãnh đạo', 'Tạo động lực và truyền cảm hứng cho nhân viên', null, 1],
      [44, 'Tinh thần trách nhiệm & cam kết với công việc', 'MANAGER', 'Tinh thần trách nhiệm', 'Có trách nhiệm cao và cam kết mạnh mẽ', null, 1],
      [45, 'Sự gương mẫu trong tuân thủ nội quy, quy định', 'MANAGER', 'Gương mẫu', 'Là tấm gương về tuân thủ quy định', null, 1],
      [46, 'Hiệu quả quản lý công việc & kết quả chung', 'MANAGER', 'Hiệu quả quản lý', 'Quản lý hiệu quả và đạt kết quả tốt', null, 1]
    ];

    return criteria;
  }

  convertToCSV(data) {
    return data.map(row => {
      return row.map(cell => {
        if (cell === null) return '';
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',');
    }).join('\n');
  }

  generate() {
    try {
      console.log('🚀 Tạo criteria với cấu trúc phân cấp theo mẫu SIRA...\n');
      
      const hierarchicalCriteria = this.generateHierarchicalCriteria();
      
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      const csvContent = this.convertToCSV(hierarchicalCriteria);
      fs.writeFileSync(path.join(outputDir, 'sira_criteria_hierarchical.csv'), csvContent, 'utf8');
      
      console.log('📁 File created: sira_criteria_hierarchical.csv');
      console.log('\n📊 Cấu trúc phân cấp:');
      console.log('\n🏢 EMPLOYEE (có phân cấp):');
      console.log('   📂 Level 1 (Categories): 6 nhóm chính');
      console.log('   📄 Level 2 (Sub-criteria): 30 tiêu chí con');
      console.log('   └─ 1. Chấp hành nội quy (2 tiêu chí)');
      console.log('   └─ 2. Tác phong (3 tiêu chí)');
      console.log('   └─ 3. Quan hệ (3 tiêu chí)');
      console.log('   └─ 4. Công việc (14 tiêu chí)');
      console.log('   └─ 5. Kỹ năng (6 tiêu chí)');
      console.log('   └─ 6. Sử dụng trang thiết bị (2 tiêu chí)');
      
      console.log('\n👔 MANAGER (không phân cấp):');
      console.log('   📄 Level 1: 10 tiêu chí độc lập');
      
      console.log('\n🔧 Cách sử dụng:');
      console.log('   • level = 1: Category hoặc tiêu chí độc lập');
      console.log('   • level = 2: Sub-criteria (thuộc category)');
      console.log('   • parent_id = null: Không có cha');
      console.log('   • parent_id = số: ID của category cha');
      
      console.log('\n✅ Ứng dụng có thể dùng parent_id để nhóm và hiển thị đúng cấu trúc!');
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new HierarchicalCriteriaGenerator();
  generator.generate();
}

module.exports = HierarchicalCriteriaGenerator;