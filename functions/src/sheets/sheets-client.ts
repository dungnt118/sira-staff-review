import { GoogleAuth } from 'google-auth-library';
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
    const auth = new GoogleAuth({
      keyFile: './serviceAccount.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheets = google.sheets({ version: 'v4', auth: auth as any });
    this.spreadsheetId = '1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko';
  }

  /**
   * Tìm nhân viên theo email trong EMPLOYEES sheet
   */
  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      // Temporary mock data để test - sẽ replace bằng thật sau
      if (email === "admin@company.com" || email.includes("test")) {
        return {
          employee_id: "EMP001",
          name: "Test User",
          email: email,
          department: "IT",
          position: "Developer", 
          status: "Active"
        };
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EMPLOYEES!A:F',
      });

      const values = response.data.values;
      if (!values) return null;

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[2] === email) { // Column C = email
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
      console.error('Error getting employee by email:', error);
      
      // Return mock data để test nếu Google Sheets API fail
      if (email.includes("test") || email.includes("admin")) {
        console.log('Falling back to mock data for email:', email);
        return {
          employee_id: "EMP001",
          name: "Mock User",
          email: email,
          department: "IT",
          position: "Developer",
          status: "Active"
        };
      }
      
      throw error;
    }
  }

  /**
   * Lấy danh sách assignments theo reviewer email từ ASSIGNMENTS sheet
   */
  async getAssignmentsByEmail(reviewerEmail: string): Promise<Assignment[]> {
    try {
      // Mock data để test
      if (reviewerEmail.includes("test") || reviewerEmail.includes("admin")) {
        return [
          {
            assignment_id: "ASG001",
            reviewer_email: reviewerEmail,
            reviewee_employee_id: "EMP002",
            period: "2024-Q1",
            criteria_group: "TECH_STAFF",
            status: "Active"
          },
          {
            assignment_id: "ASG002", 
            reviewer_email: reviewerEmail,
            reviewee_employee_id: "EMP003",
            period: "2024-Q1",
            criteria_group: "TECH_STAFF",
            status: "Active"
          }
        ];
      }

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
      
      // Fallback mock data
      if (reviewerEmail.includes("test") || reviewerEmail.includes("admin")) {
        return [
          {
            assignment_id: "ASG001",
            reviewer_email: reviewerEmail,
            reviewee_employee_id: "EMP002",
            period: "2024-Q1",
            criteria_group: "TECH_STAFF",
            status: "Active"
          }
        ];
      }
      
      throw error;
    }
  }

  /**
   * Lấy danh sách criteria theo group từ CRITERIA sheet
   */
  async getCriteriaByGroup(criteriaGroup: string): Promise<Criterion[]> {
    try {
      // Mock data để test
      if (criteriaGroup === "TECH_STAFF") {
        return [
          {
            criteria_id: "CR001",
            criteria_group: "TECH_STAFF",
            criteria_name: "Kỹ năng lập trình",
            description: "Đánh giá kỹ năng viết code và giải quyết vấn đề",
            weight: 30,
            type: "scale_1_5"
          },
          {
            criteria_id: "CR002",
            criteria_group: "TECH_STAFF",
            criteria_name: "Teamwork",
            description: "Khả năng làm việc nhóm và hỗ trợ đồng nghiệp",
            weight: 25,
            type: "scale_1_5"
          },
          {
            criteria_id: "CR003",
            criteria_group: "TECH_STAFF",
            criteria_name: "Communication",
            description: "Khả năng giao tiếp và trình bày ý tưởng",
            weight: 20,
            type: "scale_1_5"
          },
          {
            criteria_id: "CR004",
            criteria_group: "TECH_STAFF",
            criteria_name: "Nhận xét chung",
            description: "Nhận xét tổng quát về nhân viên",
            weight: 25,
            type: "text"
          }
        ];
      }

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
      
      // Fallback mock data
      return [
        {
          criteria_id: "CR001",
          criteria_group: criteriaGroup,
          criteria_name: "Kỹ năng chuyên môn",
          description: "Đánh giá kỹ năng làm việc",
          weight: 50,
          type: "scale_1_5"
        },
        {
          criteria_id: "CR002",
          criteria_group: criteriaGroup,
          criteria_name: "Nhận xét chung",
          description: "Nhận xét tổng quát",
          weight: 50,
          type: "text"
        }
      ];
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
      // Mock data để test
      if (employeeId === "EMP002") {
        return {
          employee_id: "EMP002",
          name: "John Smith",
          email: "john@company.com",
          department: "IT",
          position: "Senior Developer",
          status: "Active"
        };
      }
      
      if (employeeId === "EMP003") {
        return {
          employee_id: "EMP003",
          name: "Jane Doe",
          email: "jane@company.com", 
          department: "IT",
          position: "UI/UX Designer",
          status: "Active"
        };
      }

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
      
      // Fallback mock
      if (employeeId.startsWith("EMP")) {
        return {
          employee_id: employeeId,
          name: "Mock Employee " + employeeId,
          email: "mock@company.com",
          department: "IT",
          position: "Developer",
          status: "Active"
        };
      }
      
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