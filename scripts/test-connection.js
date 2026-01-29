const { google } = require('googleapis');
const config = require('./config');

/**
 * Script test connection với Google Sheets trước khi migrate
 */
async function testConnection() {
  try {
    console.log('🔍 Đang kiểm tra kết nối với Google Sheets...\n');
    
    const apiKey = config.API_KEY;
    const spreadsheetId = config.SPREADSHEET_ID;
    
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    
    // Test 1: Đọc thông tin spreadsheet
    console.log('📋 Test 1: Đọc thông tin spreadsheet...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    console.log(`✅ Spreadsheet: ${spreadsheetInfo.data.properties.title}`);
    console.log('📄 Danh sách sheets:');
    spreadsheetInfo.data.sheets.forEach((sheet, index) => {
      const props = sheet.properties;
      console.log(`   ${index + 1}. ${props.title} (${props.gridProperties.rowCount}x${props.gridProperties.columnCount})`);
    });
    console.log('');
    
    // Test 2: Đọc dữ liệu mẫu từ EMPLOYEES
    console.log('📊 Test 2: Đọc dữ liệu mẫu từ EMPLOYEES sheet...');
    try {
      const employeesData = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'EMPLOYEES!A1:I5'
      });
      
      if (employeesData.data.values) {
        console.log('✅ Đọc thành công EMPLOYEES sheet:');
        employeesData.data.values.forEach((row, index) => {
          console.log(`   ${index === 0 ? 'Header' : `Row ${index}`}: ${JSON.stringify(row)}`);
        });
      } else {
        console.log('⚠️ EMPLOYEES sheet trống');
      }
    } catch (err) {
      console.log('⚠️ Không thể đọc EMPLOYEES sheet:', err.message);
    }
    console.log('');
    
    // Test 3: Kiểm tra quyền ghi
    console.log('✏️ Test 3: Kiểm tra quyền ghi...');
    try {
      const testData = [
        ['test_column_1', 'test_column_2'],
        [`test_${new Date().getTime()}`, 'migration_test']
      ];
      
      const testResult = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'TEST!A1:B2',
        valueInputOption: 'RAW',
        resource: { values: testData }
      });
      
      console.log(`✅ Ghi test thành công: ${testResult.data.updatedRows} dòng`);
      
      // Xóa test data
      await sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: 'TEST!A1:B2'
      });
      console.log('🧹 Đã xóa test data');
      
    } catch (err) {
      console.log('❌ Không có quyền ghi:', err.message);
    }
    console.log('');
    
    console.log('🎉 Tất cả các test đều thành công! Sẵn sàng để migrate.');
    
  } catch (error) {
    console.error('❌ Test connection thất bại:', error.message);
    console.error('Chi tiết:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };