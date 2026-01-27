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
      if (!values || values.length < 2) return null;

      // Đọc header row để xác định index của từng cột
      const headers = values[0];
      console.log('SheetsClient: Header row:', headers);
      
      // Tìm index của từng field dựa trên tên cột
      const emailIndex = headers.findIndex(h => h && h.toLowerCase().includes('email'));
      const idIndex = headers.findIndex(h => h && h.toLowerCase().includes('employee_id'));
      const nameIndex = headers.findIndex(h => h && h.toLowerCase().includes('name'));
      const deptIndex = headers.findIndex(h => h && h.toLowerCase().includes('department'));
      const positionIndex = headers.findIndex(h => h && h.toLowerCase().includes('position'));
      
      console.log('SheetsClient: Column indexes:', {
        emailIndex, idIndex, nameIndex, deptIndex, positionIndex
      });

      // Kiểm tra xem có tìm thấy cột email không
      if (emailIndex === -1) {
        console.error('SheetsClient: Email column not found in headers:', headers);
        return null;
      }

      // Log danh sách tất cả employees để debug
      console.log('SheetsClient: === DANH SÁCH TẤT CẢ EMPLOYEES ===');
      console.log('SheetsClient: Header row:', headers);
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length > emailIndex && row[emailIndex]) {
          console.log(`SheetsClient: Row ${i}: ID="${row[idIndex] || 'N/A'}" | Name="${row[nameIndex] || 'N/A'}" | Email="${row[emailIndex]}" | Dept="${row[deptIndex] || 'N/A'}" | Position="${row[positionIndex] || 'N/A'}"`);
        } else if (row.length > 0) {
          console.log(`SheetsClient: Row ${i}: Incomplete data:`, row);
        }
      }
      console.log('SheetsClient: === END EMPLOYEE LIST ===');

      // Bỏ qua header row (index 0) và tìm kiếm employee
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        // Sử dụng emailIndex dynamic thay vì hard-coded index
        if (row[emailIndex] === email) {
          console.log('SheetsClient: Found employee:', { 
            employee_id: row[idIndex], 
            name: row[nameIndex], 
            email: row[emailIndex] 
          });
          return {
            employee_id: row[idIndex] || '',
            name: row[nameIndex] || '',
            email: row[emailIndex] || '',
            department: row[deptIndex] || '',
            position: row[positionIndex] || '',
            status: row[5] || '' // Status có thể ở cột cuối
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
      if (!values || values.length < 2) return [];

      // Đọc header row để xác định index của từng cột
      const headers = values[0];
      console.log('SheetsClient: ASSIGNMENTS Header row:', headers);
      
      // Tìm index của từng field
      const reviewerEmailIndex = headers.findIndex(h => h && h.toLowerCase().includes('reviewer_email'));
      const assignmentIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('assignment_id'));
      const revieweeIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('reviewee_employee_id'));
      const periodIndex = headers.findIndex(h => h && h.toLowerCase().includes('period'));
      const criteriaGroupIndex = headers.findIndex(h => h && h.toLowerCase().includes('criteria_group'));
      const statusIndex = headers.findIndex(h => h && h.toLowerCase().includes('status'));
      
      console.log('SheetsClient: ASSIGNMENTS Column indexes:', {
        reviewerEmailIndex, assignmentIdIndex, revieweeIdIndex, periodIndex, criteriaGroupIndex, statusIndex
      });

      const assignments: Assignment[] = [];

      // Bỏ qua header row (index 0) và tìm assignments
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        
        // Kiểm tra reviewer_email nếu tìm thấy cột đó
        if (reviewerEmailIndex !== -1 && row[reviewerEmailIndex] === reviewerEmail) {
          assignments.push({
            assignment_id: row[assignmentIdIndex] || '',
            reviewer_email: row[reviewerEmailIndex] || '',
            reviewee_employee_id: row[revieweeIdIndex] || '',
            period: row[periodIndex] || '',
            criteria_group: row[criteriaGroupIndex] || '',
            status: row[statusIndex] || ''
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
      if (!values || values.length < 2) return [];

      // Đọc header row để xác định index của từng cột
      const headers = values[0];
      console.log('SheetsClient: CRITERIA Header row:', headers);
      
      // Tìm index của từng field
      const criteriaIdIndex = headers.findIndex(h => h && h.toLowerCase().includes('criteria_id'));
      const criteriaGroupIndex = headers.findIndex(h => h && h.toLowerCase().includes('criteria_group'));
      const criteriaNameIndex = headers.findIndex(h => h && h.toLowerCase().includes('criteria_name'));
      const descriptionIndex = headers.findIndex(h => h && h.toLowerCase().includes('description'));
      const weightIndex = headers.findIndex(h => h && h.toLowerCase().includes('weight'));
      const typeIndex = headers.findIndex(h => h && h.toLowerCase().includes('type'));
      
      console.log('SheetsClient: CRITERIA Column indexes:', {
        criteriaIdIndex, criteriaGroupIndex, criteriaNameIndex, descriptionIndex, weightIndex, typeIndex
      });

      const criteria: Criterion[] = [];

      // Bỏ qua header row (index 0) và tìm criteria
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        
        // Kiểm tra criteria_group nếu tìm thấy cột đó
        if (criteriaGroupIndex !== -1 && row[criteriaGroupIndex] === criteriaGroup) {
          criteria.push({
            criteria_id: row[criteriaIdIndex] || '',
            criteria_group: row[criteriaGroupIndex] || '',
            criteria_name: row[criteriaNameIndex] || '',
            description: row[descriptionIndex] || '',
            weight: parseInt(row[weightIndex]) || 0,
            type: row[typeIndex] || ''
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
   * Lấy danh sách assignments theo reviewer email
   */
  async getAssignmentsByReviewer(reviewerEmail: string): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:F',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return [];

      const assignments = [];
      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[1] === reviewerEmail) { // Column B = reviewer_email
          assignments.push({
            assignment_id: row[0],
            reviewer_email: row[1],
            reviewee_employee_id: row[2],
            target_type: row[3],
            status: row[4] || 'PENDING'
          });
        }
      }

      return assignments;
    } catch (error: any) {
      console.error('Error getting assignments by reviewer:', error);
      throw error;
    }
  }

  /**
   * Lấy criteria theo target type
   */
  async getCriteriaByTargetType(targetType: string): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'CRITERIA!A:G',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return [];

      const criteria = [];
      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[2] === targetType) { // Column C = target_type
          criteria.push({
            criteria_id: parseInt(row[0]),
            criteria_name: row[1],
            target_type: row[2],
            category: row[3],
            description: row[4],
            parent_id: row[5] ? parseInt(row[5]) : null,
            level: parseInt(row[6])
          });
        }
      }

      return criteria;
    } catch (error: any) {
      console.error('Error getting criteria by target type:', error);
      throw error;
    }
  }

  /**
   * Lưu kết quả đánh giá
   */
  async saveEvaluation(evaluation: any): Promise<string> {
    try {
      // Tạo evaluation ID
      const evaluationId = `EVAL_${Date.now()}`;
      
      // Chuẩn bị dữ liệu cho EVALUATIONS sheet
      const rows = [];
      for (const score of evaluation.criteria_scores) {
        rows.push([
          evaluationId,
          evaluation.assignment_id,
          score.criteria_id,
          score.score,
          evaluation.comments,
          evaluation.evaluation_date
        ]);
      }

      // Kiểm tra EVALUATIONS sheet có tồn tại không, nếu không thì tạo
      try {
        await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'EVALUATIONS!A1:F1',
        });
      } catch {
        // Tạo sheet EVALUATIONS với header
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'EVALUATIONS!A1:F1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['evaluation_id', 'assignment_id', 'criteria_id', 'score', 'comments', 'evaluation_date']]
          }
        });
      }

      // Append dữ liệu
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'EVALUATIONS!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      return evaluationId;
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  /**
   * Cập nhật status của assignment
   */
  async updateAssignmentStatus(assignmentId: string, status: string): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:F',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return;

      // Tìm assignment và cập nhật status
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === assignmentId) { // Column A = assignment_id
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `ASSIGNMENTS!E${i + 1}`, // Column E = status
            valueInputOption: 'RAW',
            requestBody: {
              values: [[status]]
            }
          });
          break;
        }
      }
    } catch (error: any) {
      console.error('Error updating assignment status:', error);
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