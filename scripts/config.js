// Configuration for scripts
module.exports = {
  // Google Sheets configuration
  SPREADSHEET_ID: '1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko',
  
  // Firebase API Key (same as frontend config)
  API_KEY: 'AIzaSyDmkaE51CRnu4AJPo6uAc9Web19sZ-CeHU',
  
  // Sheet names
  SHEETS: {
    ASSIGNMENTS: 'ASSIGNMENTS',
    CRITERIA: 'CRITERIA',
    EMPLOYEES: 'EMPLOYEES',
    EVALUATIONS: 'EVALUATIONS'
  },
  
  // Sheet ranges for data reading/writing
  RANGES: {
    EMPLOYEES: 'EMPLOYEES!A:I',
    ASSIGNMENTS: 'ASSIGNMENTS!A:Z',
    CRITERIA: 'CRITERIA!A:Z',
    EVALUATIONS: 'EVALUATIONS!A:Z',
    // For clearing data
    CLEAR_ALL: 'A:Z'
  },
  
  // Output directory
  OUTPUT_DIR: './output'
};
