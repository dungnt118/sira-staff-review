const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script để preview dữ liệu trong file Excel trước khi migrate
 */
function previewExcelData() {
  try {
    const excelPath = path.join(__dirname, '../docs/DS NHÂN SỰ.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ File không tồn tại: ${excelPath}`);
      process.exit(1);
    }

    console.log('🔍 Preview dữ liệu từ file Excel...\n');
    console.log(`📂 File: ${excelPath}`);
    console.log(`📏 Size: ${(fs.statSync(excelPath).size / 1024).toFixed(2)} KB\n`);
    
    const workbook = XLSX.readFile(excelPath);
    
    console.log(`📊 Tổng số sheets: ${workbook.SheetNames.length}`);
    console.log(`📄 Danh sách sheets: ${workbook.SheetNames.join(', ')}\n`);
    
    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`📋 Sheet ${index + 1}: "${sheetName}"`);
      console.log('─'.repeat(50));
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        console.log('   (Trống)\n');
        return;
      }
      
      console.log(`   📝 Tổng số dòng: ${jsonData.length}`);
      console.log(`   📝 Header (dòng 1): ${JSON.stringify(jsonData[0])}`);
      
      // Show first few data rows
      const dataRows = jsonData.slice(1, Math.min(6, jsonData.length));
      if (dataRows.length > 0) {
        console.log('   📝 Dữ liệu mẫu:');
        dataRows.forEach((row, idx) => {
          console.log(`      Dòng ${idx + 2}: ${JSON.stringify(row)}`);
        });
        
        if (jsonData.length > 6) {
          console.log(`      ... và ${jsonData.length - 6} dòng khác`);
        }
      }
      
      // Analyze column structure
      if (jsonData[0]) {
        const headers = jsonData[0];
        console.log('   📊 Phân tích cột:');
        headers.forEach((header, colIndex) => {
          if (header) {
            const sampleValues = jsonData
              .slice(1, 6)
              .map(row => row[colIndex])
              .filter(val => val !== undefined && val !== null && val !== '');
            
            console.log(`      Cột ${colIndex + 1} (${header}): ${sampleValues.length > 0 ? `VD: ${sampleValues[0]}` : 'Trống'}`);
          }
        });
      }
      
      console.log('');
    });
    
    // Suggest which sheet might contain employee data
    console.log('🎯 Đề xuất sheet cho dữ liệu nhân viên:');
    const employeeSheetCandidates = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 1 && jsonData[0]) {
        const headers = jsonData[0].map(h => (h || '').toString().toLowerCase());
        const score = 
          (headers.some(h => h.includes('email') || h.includes('mail')) ? 3 : 0) +
          (headers.some(h => h.includes('tên') || h.includes('name')) ? 2 : 0) +
          (headers.some(h => h.includes('phòng') || h.includes('department')) ? 2 : 0) +
          (headers.some(h => h.includes('chức vụ') || h.includes('position')) ? 1 : 0) +
          (headers.some(h => h.includes('id')) ? 1 : 0);
        
        if (score > 0) {
          employeeSheetCandidates.push({
            name: sheetName,
            score: score,
            rowCount: jsonData.length - 1,
            headers: headers
          });
        }
      }
    });
    
    employeeSheetCandidates.sort((a, b) => b.score - a.score);
    
    if (employeeSheetCandidates.length > 0) {
      employeeSheetCandidates.forEach((candidate, index) => {
        const status = index === 0 ? '🏆 TỐT NHẤT' : '📋 Tùy chọn';
        console.log(`   ${status} - "${candidate.name}" (Score: ${candidate.score}, ${candidate.rowCount} nhân viên)`);
        console.log(`      Headers: ${candidate.headers.join(', ')}`);
      });
    } else {
      console.log('   ⚠️ Không tìm thấy sheet phù hợp cho dữ liệu nhân viên');
    }
    
    console.log('\n🎯 Để migrate dữ liệu, chạy lệnh: npm run migrate');
    
  } catch (error) {
    console.error('❌ Lỗi khi đọc file Excel:', error.message);
    console.error('Chi tiết:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  previewExcelData();
}

module.exports = { previewExcelData };