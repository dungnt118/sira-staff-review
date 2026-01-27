const fs = require('fs');
const path = require('path');

/**
 * Script tạo criteria đầy đủ theo mẫu đánh giá thực tế của công ty SIRA Việt Nam
 */
class RealCriteriaGenerator {
  generateRealCriteria() {
    console.log('🔄 Tạo criteria theo mẫu đánh giá thực tế của SIRA...');
    
    const criteria = [
      // Header
      ['criteria_id', 'criteria_name', 'target_type', 'category', 'description'],
      
      // === EMPLOYEE CRITERIA - Mẫu đánh giá nhân viên xuất sắc ===
      
      // 1. CHẤP HÀNH NỘI QUY
      [1, 'Tuân thủ giờ làm việc và nội quy lao động', 'EMPLOYEE', 'Chấp hành nội quy', 'Đúng giờ, tuân thủ quy định lao động'],
      [2, 'Tuân thủ nội quy, quy chế làm việc của Công ty', 'EMPLOYEE', 'Chấp hành nội quy', 'Chấp hành nghiêm túc các quy định nội bộ'],
      
      // 2. TÁC PHONG
      [3, 'Ăn mặc gọn gàng, sạch sẽ', 'EMPLOYEE', 'Tác phong', 'Trang phục chỉn chu, phù hợp môi trường làm việc'],
      [4, 'Giữ gìn vệ sinh chung và vệ sinh nơi làm việc', 'EMPLOYEE', 'Tác phong', 'Duy trì môi trường làm việc sạch sẽ, gọn gàng'],
      [5, 'Nhanh nhẹn, linh hoạt', 'EMPLOYEE', 'Tác phong', 'Xử lý công việc một cách nhanh chóng và linh động'],
      
      // 3. QUAN HỆ
      [6, 'Quan hệ với cấp trên, đồng nghiệp và khách hàng', 'EMPLOYEE', 'Quan hệ', 'Duy trì mối quan hệ tích cực, chuyên nghiệp'],
      [7, 'Giải quyết yêu cầu của khách hàng nhanh chóng, kịp thời', 'EMPLOYEE', 'Quan hệ', 'Phản hồi và xử lý yêu cầu khách hàng hiệu quả'],
      [8, 'Thái độ chăm sóc khách hàng cẩn thận, chu đáo', 'EMPLOYEE', 'Quan hệ', 'Phục vụ khách hàng tận tâm, thỏa mãn nhu cầu'],
      
      // 4. CÔNG VIỆC
      [9, 'Tinh thần hợp tác trong công việc', 'EMPLOYEE', 'Công việc', 'Làm việc nhóm hiệu quả, hỗ trợ đồng nghiệp'],
      [10, 'Thao tác thực hiện công việc', 'EMPLOYEE', 'Công việc', 'Kỹ năng và phương pháp thực hiện nhiệm vụ'],
      [11, 'Chất lượng, số lượng công việc hoàn thành (%/tháng)', 'EMPLOYEE', 'Công việc', 'Đạt và vượt chỉ tiêu được giao'],
      [12, 'Mức độ hiểu biết về công việc được giao', 'EMPLOYEE', 'Công việc', 'Nắm vững yêu cầu và bản chất công việc'],
      [13, 'Khả năng tiếp thu công việc', 'EMPLOYEE', 'Công việc', 'Học hỏi và làm chủ công việc mới nhanh chóng'],
      [14, 'Hiểu rõ các nghiệp vụ của công việc', 'EMPLOYEE', 'Công việc', 'Nắm vững quy trình và nghiệp vụ chuyên môn'],
      [15, 'Kiến thức chuyên môn phù hợp với công việc', 'EMPLOYEE', 'Công việc', 'Có đủ kiến thức và kỹ năng cần thiết'],
      [16, 'Mức độ tin cậy', 'EMPLOYEE', 'Công việc', 'Đáng tin cậy trong thực hiện nhiệm vụ'],
      [17, 'Đóng góp nổi bật trong năm', 'EMPLOYEE', 'Công việc', 'Có những thành tích, cải tiến đáng kể'],
      [18, 'Khả năng làm việc độc lập và sự chủ động', 'EMPLOYEE', 'Công việc', 'Tự giác, chủ động trong công việc'],
      [19, 'Sự sáng tạo trong công việc', 'EMPLOYEE', 'Công việc', 'Đưa ra ý tưởng mới, cải tiến quy trình'],
      [20, 'Hiểu biết về sản phẩm dịch vụ của Công ty', 'EMPLOYEE', 'Công việc', 'Nắm vững portfolio và giá trị công ty'],
      [21, 'Tinh thần học hỏi và cầu tiến', 'EMPLOYEE', 'Công việc', 'Không ngừng học hỏi và phát triển bản thân'],
      [22, 'Chấp hành mệnh lệnh của người quản lý', 'EMPLOYEE', 'Công việc', 'Tuân thủ và thực hiện chỉ đạo của cấp trên'],
      
      // 5. KỸ NĂNG
      [23, 'Kỹ năng giao tiếp', 'EMPLOYEE', 'Kỹ năng', 'Truyền đạt thông tin rõ ràng, hiệu quả'],
      [24, 'Kỹ năng làm việc nhóm', 'EMPLOYEE', 'Kỹ năng', 'Phối hợp và hợp tác tốt trong team'],
      [25, 'Kỹ năng mềm: giao tiếp, đàm phán, thuyết phục', 'EMPLOYEE', 'Kỹ năng', 'Vận dụng linh hoạt các kỹ năng mềm'],
      [26, 'Kỹ năng giải quyết vấn đề', 'EMPLOYEE', 'Kỹ năng', 'Phân tích và tìm giải pháp hiệu quả'],
      [27, 'Kỹ năng hoạch định công việc và quản lý', 'EMPLOYEE', 'Kỹ năng', 'Lập kế hoạch và quản lý thời gian tốt'],
      [28, 'Kỹ năng thích ứng với công việc/áp lực', 'EMPLOYEE', 'Kỹ năng', 'Làm việc hiệu quả dưới áp lực'],
      
      // 6. SỬ DỤNG TRANG THIẾT BỊ
      [29, 'Sử dụng thành thạo các máy móc thiết bị', 'EMPLOYEE', 'Sử dụng trang thiết bị', 'Vận hành thiết bị một cách chuyên nghiệp'],
      [30, 'Tinh thần sử dụng tiết kiệm tài sản Công ty', 'EMPLOYEE', 'Sử dụng trang thiết bị', 'Bảo vệ và sử dụng hiệu quả tài sản công ty'],
      
      // === MANAGER CRITERIA - Mẫu đánh giá chéo cấp Quản lý ===
      [31, 'Năng lực chuyên môn & hiểu biết công việc', 'MANAGER', 'Năng lực chuyên môn', 'Có kiến thức sâu rộng về lĩnh vực quản lý'],
      [32, 'Khả năng định hướng, dẫn dắt đội nhóm', 'MANAGER', 'Lãnh đạo', 'Định hướng rõ ràng và dẫn dắt team hiệu quả'],
      [33, 'Tính công bằng, minh bạch trong quản lý', 'MANAGER', 'Quản lý', 'Đối xử công bằng, quyết định minh bạch'],
      [34, 'Khả năng lắng nghe & tiếp thu ý kiến CBNV', 'MANAGER', 'Giao tiếp', 'Lắng nghe và tiếp thu góp ý từ nhân viên'],
      [35, 'Kỹ năng giao tiếp & truyền đạt thông tin', 'MANAGER', 'Giao tiếp', 'Truyền đạt thông tin rõ ràng, hiệu quả'],
      [36, 'Khả năng ra quyết định & giải quyết vấn đề', 'MANAGER', 'Ra quyết định', 'Quyết định đúng đắn và giải quyết vấn đề kịp thời'],
      [37, 'Khả năng tạo động lực, truyền cảm hứng', 'MANAGER', 'Lãnh đạo', 'Tạo động lực và truyền cảm hứng cho nhân viên'],
      [38, 'Tinh thần trách nhiệm & cam kết với công việc', 'MANAGER', 'Tinh thần trách nhiệm', 'Có trách nhiệm cao và cam kết mạnh mẽ'],
      [39, 'Sự gương mẫu trong tuân thủ nội quy, quy định', 'MANAGER', 'Gương mẫu', 'Là tấm gương về tuân thủ quy định'],
      [40, 'Hiệu quả quản lý công việc & kết quả chung', 'MANAGER', 'Hiệu quả quản lý', 'Quản lý hiệu quả và đạt kết quả tốt']
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
      console.log('🚀 Tạo criteria theo mẫu đánh giá thực tế của SIRA...\n');
      
      // Generate real criteria
      const realCriteria = this.generateRealCriteria();
      
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      // Write real criteria file
      const realCSV = this.convertToCSV(realCriteria);
      fs.writeFileSync(path.join(outputDir, 'sira_criteria_real.csv'), realCSV, 'utf8');
      
      console.log('📁 File created: sira_criteria_real.csv');
      console.log('\n📊 Thống kê:');
      console.log('   🏢 EMPLOYEE criteria: 30 tiêu chí');
      console.log('   👔 MANAGER criteria: 10 tiêu chí');
      console.log('   📋 Tổng cộng: 40 tiêu chí');
      
      console.log('\n🔍 Cấu trúc EMPLOYEE:');
      console.log('   1. Chấp hành nội quy: 2 tiêu chí');
      console.log('   2. Tác phong: 3 tiêu chí');
      console.log('   3. Quan hệ: 3 tiêu chí');
      console.log('   4. Công việc: 14 tiêu chí');
      console.log('   5. Kỹ năng: 6 tiêu chí');
      console.log('   6. Sử dụng trang thiết bị: 2 tiêu chí');
      
      console.log('\n🔍 Cấu trúc MANAGER:');
      console.log('   • 10 tiêu chí đánh giá chéo theo mẫu thực tế');
      
      console.log('\n✅ File này chính xác 100% theo mẫu đánh giá của SIRA!');
      
    } catch (error) {
      console.error('❌ Lỗi:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new RealCriteriaGenerator();
  generator.generate();
}

module.exports = RealCriteriaGenerator;