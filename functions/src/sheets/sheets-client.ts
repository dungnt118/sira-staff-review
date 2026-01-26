import { sheets_v4, google } from 'googleapis';

// Interface cho dữ liệu từ các sheets
export interface Employee {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
}

export interface Assignment {
  assignment_id: string;
  reviewer_email: string;
  reviewee_employee_id: string;
  period: string;
  criteria_group: string;
  status: string;
}

export interface Criterion {
  criteria_id: string;
  criteria_group: string;
  criteria_name: string;
  description: string;
  weight: number;
  type: string;
}

export interface ResponseData {
  response_id?: string;
  assignment_id: string;
  criteria_id: string;
  score?: number;
  comment?: string;
  created_at: string;
}

/**
 * Client để tương tác với Google Sheets
 * Quản lý 5 sheets: EMPLOYEES, ASSIGNMENTS, CRITERIA, RESPONSES, REPORT
 */
export class SheetsClient {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor() {
    try {
      // FINAL APPROACH: Make sheets public and use simple API key
      const apiKey = 'AIzaSyDmkaE51CRnu4AJPo6uAc9Web19sZ-CeHU';
      
      // Use API Key approach
      this.sheets = google.sheets({ 
        version: 'v4', 
        auth: apiKey 
      });
      console.log('SheetsClient: Using API Key authentication:', apiKey.substring(0, 12) + '...');
      
      // Important: Google Sheets document MUST be public (Anyone with the link can view)
      // Otherwise API key won't work
      this.spreadsheetId = '1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko';
      
    } catch (error) {
      console.error('SheetsClient: Error initializing:', error);
      throw error;
    }
  }

  /**
   * Tìm nhân viên theo email trong EMPLOYEES sheet
   */
  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      console.log('SheetsClient: Attempting to get employee by email:', email);
      console.log('SheetsClient: Using spreadsheetId:', this.spreadsheetId);
      
      // Test authentication first
      console.log('SheetsClient: Testing authentication...');
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      console.log('SheetsClient: Authentication successful');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EMPLOYEES!A:F',
      });

      console.log('SheetsClient: API Response received, values count:', response.data.values?.length);
      
      const values = response.data.values;
      if (!values) return null;

      // Log danh sách tất cả employees để debug
      console.log('SheetsClient: === DANH SÁCH TẤT CẢ EMPLOYEES ===');
      console.log('SheetsClient: Header row:', values[0]);
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 3) {
          console.log(`SheetsClient: Row ${i}: ID="${row[0]}" | Name="${row[1]}" | Email="${row[2]}" | Dept="${row[3] || 'N/A'}" | Position="${row[4] || 'N/A'}"`);
        } else if (row.length > 0) {
          console.log(`SheetsClient: Row ${i}: Incomplete data:`, row);
        }
      }
      console.log('SheetsClient: === END EMPLOYEE LIST ===');

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        // CHÍNH XÁC: Email ở column E (index 4), không phải column C (index 2)
        if (row[4] === email) { // Column E = email (dựa trên logs thực tế)
          console.log('SheetsClient: Found employee:', { employee_id: row[0], name: row[1], email: row[4] });
          return {
            employee_id: row[0] || '',
            name: row[1] || '',
            email: row[4] || '',        // Column E = email
            department: row[2] || '',   // Column C = department  
            position: row[3] || '',     // Column D = position
            status: row[5] || ''        // Column F = status (nếu có)
          };
        }
      }

      console.log('SheetsClient: No employee found with email:', email);
      return null;
    } catch (error: any) {
      console.error('SheetsClient: Error getting employee by email:', error);
      console.error('SheetsClient: Error type:', error.constructor?.name);
      if (error.response) {
        console.error('SheetsClient: Error response status:', error.response.status);
        console.error('SheetsClient: Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách assignments theo reviewer email từ ASSIGNMENTS sheet
   */
  async getAssignmentsByEmail(reviewerEmail: string): Promise<Assignment[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:F',
      });

      const values = response.data.values;
      if (!values) return [];

      const assignments: Assignment[] = [];

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[1] === reviewerEmail) { // Column B = reviewer_email
          assignments.push({
            assignment_id: row[0] || '',
            reviewer_email: row[1] || '',
            reviewee_employee_id: row[2] || '',
            period: row[3] || '',
            criteria_group: row[4] || '',
            status: row[5] || ''
          });
        }
      }

      return assignments;
    } catch (error) {
      console.error('Error getting assignments by email:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách criteria theo group từ CRITERIA sheet
   */
  async getCriteriaByGroup(criteriaGroup: string): Promise<Criterion[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'CRITERIA!A:F',
      });

      const values = response.data.values;
      if (!values) return [];

      const criteria: Criterion[] = [];

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[1] === criteriaGroup) { // Column B = criteria_group
          criteria.push({
            criteria_id: row[0] || '',
            criteria_group: row[1] || '',
            criteria_name: row[2] || '',
            description: row[3] || '',
            weight: parseInt(row[4]) || 0,
            type: row[5] || ''
          });
        }
      }

      return criteria;
    } catch (error) {
      console.error('Error getting criteria by group:', error);
      throw error;
    }
  }

  /**
   * Lưu response vào RESPONSES sheet
   */
  async saveResponse(responseData: ResponseData): Promise<boolean> {
    try {
      // Tạo response_id tự động
      const responseId = `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const row = [
        responseId,
        responseData.assignment_id,
        responseData.criteria_id,
        responseData.score?.toString() || '',
        responseData.comment || '',
        responseData.created_at
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'RESPONSES!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: [row]
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin nhân viên theo employee_id (để hiển thị trong assignments)
   */
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EMPLOYEES!A:F',
      });

      const values = response.data.values;
      if (!values) return null;

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[0] === employeeId) { // Column A = employee_id
          return {
            employee_id: row[0] || '',
            name: row[1] || '',
            email: row[2] || '',
            department: row[3] || '',
            position: row[4] || '',
            status: row[5] || ''
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem user đã hoàn thành đánh giá assignment chưa
   */
  async checkCompletedAssignment(assignmentId: string): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'RESPONSES!A:F',
      });

      const values = response.data.values;
      if (!values) return false;

      // Kiểm tra xem có response nào cho assignment này không
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[1] === assignmentId) { // Column B = assignment_id
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking completed assignment:', error);
      return false;
    }
  }
}