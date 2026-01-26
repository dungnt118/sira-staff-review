const { google } = require('googleapis');
const path = require('path');

async function testAuthentication() {
  try {
    console.log('Testing Google Sheets API authentication...');
    
    // Set service account path
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../serviceAccount.json');
    console.log('Service account path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    // Create auth
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // Get auth client
    const authClient = await auth.getClient();
    console.log('Auth client created successfully');
    
    // Create sheets API
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('Sheets API client created');
    
    // Test simple API call
    const spreadsheetId = '1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko';
    console.log('Testing spreadsheet access for:', spreadsheetId);
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    
    console.log('SUCCESS! Spreadsheet metadata retrieved:');
    console.log('- Title:', response.data.properties.title);
    console.log('- Sheets count:', response.data.sheets.length);
    
    // Test reading data
    console.log('Testing data read...');
    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'EMPLOYEES!A1:A5',
    });
    
    console.log('SUCCESS! Data read:', valuesResponse.data.values);
    
  } catch (error) {
    console.error('AUTHENTICATION FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuthentication();