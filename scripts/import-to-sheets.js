const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Google Sheets configuration (from config.js)
const SPREADSHEET_ID = config.SPREADSHEET_ID;
const API_KEY = config.API_KEY;

/**
 * Import CSV data vào Google Sheets
 */
async function importCSVData() {
  console.log('🚀 Bắt đầu import dữ liệu CSV vào Google Sheets...\n');

  try {
    // Initialize Google Sheets API with API Key
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: API_KEY 
    });

    const outputDir = path.join(__dirname, 'output');
    
    // 1. Import ASSIGNMENTS
    console.log('📊 1. Import ASSIGNMENTS...');
    const assignmentsCSV = path.join(outputDir, 'optimized_assignments.csv');
    if (fs.existsSync(assignmentsCSV)) {
      const assignmentsData = parseCSV(fs.readFileSync(assignmentsCSV, 'utf8'));
      await clearAndWriteSheet(sheets, 'ASSIGNMENTS', assignmentsData);
      console.log(`✅ Imported ${assignmentsData.length - 1} assignments`);
    } else {
      console.log('❌ File optimized_assignments.csv not found');
    }

    // 2. Import CRITERIA  
    console.log('📊 2. Import CRITERIA...');
    const criteriaCSV = path.join(outputDir, 'sira_criteria_hierarchical.csv');
    if (fs.existsSync(criteriaCSV)) {
      const criteriaData = parseCSV(fs.readFileSync(criteriaCSV, 'utf8'));
      await clearAndWriteSheet(sheets, 'CRITERIA', criteriaData);
      console.log(`✅ Imported ${criteriaData.length - 1} criteria`);
    } else {
      console.log('❌ File sira_criteria_hierarchical.csv not found');
    }

    // 3. Check EMPLOYEES sheet (should already have data)
    console.log('📊 3. Check EMPLOYEES sheet...');
    try {
      const employeesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'EMPLOYEES!A:F'
      });
      
      const employeesCount = employeesResponse.data.values ? employeesResponse.data.values.length - 1 : 0;
      console.log(`✅ EMPLOYEES sheet has ${employeesCount} employees`);
    } catch (error) {
      console.log('❌ Could not read EMPLOYEES sheet:', error.message);
    }

    console.log('\n🎉 Import hoàn tất!');
    console.log('\n📋 Kiểm tra kết quả tại:');
    console.log(`   https://docs.google.com/spreadsheets/d/${config.SPREADSHEET_ID}`);

  } catch (error) {
    console.error('❌ Error during import:', error.message);
    process.exit(1);
  }
}

/**
 * Parse CSV content thành array 2D
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  });
}

/**
 * Xóa và ghi mới dữ liệu vào sheet
 */
async function clearAndWriteSheet(sheets, sheetName, data) {
  try {
    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    });

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: data
      }
    });

    console.log(`   ✅ Updated ${sheetName} with ${data.length} rows`);
  } catch (error) {
    console.log(`   ❌ Error updating ${sheetName}:`, error.message);
  }
}

if (require.main === module) {
  importCSVData();
}

module.exports = { importCSVData };