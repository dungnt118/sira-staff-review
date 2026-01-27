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
      // Use Service Account for both read and write operations
      const serviceAccountPath = require('path').join(__dirname, '../../serviceAccount.json');
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      
      this.sheets = google.sheets({ 
        version: 'v4', 
        auth 
      });
      console.log('SheetsClient: Using Service Account authentication from:', serviceAccountPath);
      
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
        range: 'ASSIGNMENTS!A:K', // quét rộng 10 cột để không bị thiếu header
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
   * Lấy danh sách assignments theo reviewer email (email-based model)
   */
  async getAssignmentsByReviewer(reviewerEmail: string): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:K',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return [];

      // Xác định cột theo header row (case-insensitive, trim)
      const header = values[0].map((h: string) => (h || '').trim());
      const headerLower = header.map(h => h.toLowerCase());
      const col = (...names: string[]) => {
        for (const n of names) {
          const idx = headerLower.indexOf(n.toLowerCase());
          if (idx >= 0) return idx;
        }
        return -1;
      };
      const idx = {
        reviewerEmail: col('reviewer_email'),
        revieweeEmail: col('reviewee_email'),
        targetType: col('target_type'),
        status: col('status'),
        period: col('period')
      };

      const validTargets = ['EMPLOYEE', 'MANAGER'];
      const assignments = [];
      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const reviewerCol = idx.reviewerEmail;
        const reviewerVal = reviewerCol >= 0 ? (row[reviewerCol] || '').trim().toLowerCase() : '';
        const inputReviewer = reviewerEmail.trim().toLowerCase();

        if (reviewerCol >= 0 && reviewerVal === inputReviewer) {
          const candidateTarget = idx.targetType >= 0 ? (row[idx.targetType] || '').trim() : '';
          const candidatePeriod = idx.period >= 0 ? (row[idx.period] || '').trim() : '';
          const targetType = validTargets.includes(candidateTarget) ? candidateTarget : validTargets.includes(candidatePeriod) ? candidatePeriod : '';

          const statusVal = idx.status >= 0 ? row[idx.status] : '';
          const revieweeEmail = idx.revieweeEmail >= 0 ? (row[idx.revieweeEmail] || '').trim() : '';

          // Yêu cầu phải có reviewee_email (không phụ thuộc employee_id)
          if (revieweeEmail) {
            assignments.push({
              reviewer_email: row[reviewerCol],
              reviewee_email: revieweeEmail,
              target_type: targetType,
              status: statusVal || 'PENDING',
              period: idx.period >= 0 ? row[idx.period] : ''
            });
          } else {
            console.warn('getAssignmentsByReviewer: missing reviewee_email, skip row', { rowIndex: i + 1 });
          }
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
        range: 'CRITERIA!A:H', // thêm max_value
      });

      const values = response.data.values;
      if (!values || values.length < 2) return [];

      // Dò cột theo header
      const header = values[0];
      const col = (name: string) => header.indexOf(name);
      const idx = {
        id: col('criteria_id'),
        name: col('criteria_name'),
        target: col('target_type'),
        category: col('category'),
        description: col('description'),
        parent: col('parent_id'),
        level: col('level'),
        max: col('max_value')
      };

      const criteria = [];
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const targetVal = idx.target >= 0 ? row[idx.target] : row[2];
        if (targetVal === targetType) {
          const maxValRaw = idx.max >= 0 ? row[idx.max] : undefined;
          const parsedMax = Number(maxValRaw);
          const maxValue = parsedMax && parsedMax > 0 ? parsedMax : 5;

          criteria.push({
            criteria_id: idx.id >= 0 ? parseInt(row[idx.id]) : parseInt(row[0]),
            criteria_name: idx.name >= 0 ? row[idx.name] : row[1],
            target_type: targetVal,
            category: idx.category >= 0 ? row[idx.category] : row[3],
            description: idx.description >= 0 ? row[idx.description] : row[4],
            parent_id: idx.parent >= 0 && row[idx.parent] ? parseInt(row[idx.parent]) : null,
            level: idx.level >= 0 ? parseInt(row[idx.level]) : parseInt(row[6]),
            max_value: maxValue
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
   * Lưu kết quả đánh giá (email-based model)
   * evaluation: { reviewer_email, reviewee_email, target_type, criteria_scores, comments, evaluation_date }
   * Re-evaluation: Xóa evaluation cũ (nếu có) và tạo mới
   */
  async saveEvaluation(evaluation: any): Promise<string> {
    try {
      const sheetTitle = 'EVALUATIONS';

      // Đảm bảo sheet EVALUATIONS tồn tại, nếu chưa có thì tạo kèm header
      const sheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'sheets.properties.title'
      });
      const hasSheet = sheetInfo.data.sheets?.some(s => s.properties?.title === sheetTitle);

      if (!hasSheet) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetTitle } } }]
          }
        });

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetTitle}!A1:H1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['evaluation_id', 'reviewer_email', 'reviewee_email', 'target_type', 'criteria_id', 'score', 'comments', 'evaluation_date']]
          }
        });
      }

      // Check existing evaluation và xóa nếu có (overwrite strategy)
      const existing = await this.getExistingEvaluation(
        evaluation.reviewer_email,
        evaluation.reviewee_email,
        evaluation.target_type
      );

      if (existing && existing.evaluation_id) {
        console.log('saveEvaluation: Found existing evaluation, will delete old rows:', existing.evaluation_id);
        
        // Get fresh sheet metadata with sheetId
        const sheetMetadata = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          fields: 'sheets(properties(title,sheetId))'
        });
        const sheetId = sheetMetadata.data.sheets?.find(s => s.properties?.title === sheetTitle)?.properties?.sheetId;
        console.log('saveEvaluation: Sheet ID for EVALUATIONS:', sheetId);

        if (sheetId === undefined) {
          console.error('saveEvaluation: Cannot find sheetId for EVALUATIONS sheet');
        } else {
          // Get all rows to find and delete matching ones
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetTitle}!A:H`,
          });

          const values = response.data.values;
          console.log('saveEvaluation: Total rows in EVALUATIONS:', values?.length || 0);
          
          if (values && values.length > 1) {
            const header = values[0].map((h: string) => (h || '').trim());
            const headerLower = header.map(h => h.toLowerCase());
            const evalIdIdx = headerLower.indexOf('evaluation_id');
            console.log('saveEvaluation: evaluation_id column index:', evalIdIdx);

            if (evalIdIdx >= 0) {
              // Collect row indices to delete (bottom-up to avoid index shifting)
              const rowsToDelete = [];
              for (let i = values.length - 1; i >= 1; i--) {
                const rowEvalId = (values[i][evalIdIdx] || '').toString();
                if (rowEvalId === existing.evaluation_id) {
                  console.log(`saveEvaluation: Will delete row ${i + 1} (0-indexed: ${i})`);
                  rowsToDelete.push(i);
                }
              }

              console.log(`saveEvaluation: Found ${rowsToDelete.length} rows to delete`);

              // Delete rows using batchUpdate
              if (rowsToDelete.length > 0) {
                const deleteRequests = rowsToDelete.map(rowIdx => ({
                  deleteDimension: {
                    range: {
                      sheetId: sheetId,
                      dimension: 'ROWS',
                      startIndex: rowIdx,
                      endIndex: rowIdx + 1
                    }
                  }
                }));

                console.log('saveEvaluation: Sending delete requests:', JSON.stringify(deleteRequests, null, 2));
                await this.sheets.spreadsheets.batchUpdate({
                  spreadsheetId: this.spreadsheetId,
                  requestBody: { requests: deleteRequests }
                });
                console.log(`saveEvaluation: Successfully deleted ${rowsToDelete.length} old rows`);
              }
            } else {
              console.error('saveEvaluation: Cannot find evaluation_id column in header');
            }
          }
        }
      } else {
        console.log('saveEvaluation: No existing evaluation found, creating new one');
      }

      // Tạo evaluation ID mới
      const evaluationId = `EVAL_${Date.now()}`;
      
      // Chuẩn bị dữ liệu mới
      const rows = [];
      for (const score of evaluation.criteria_scores) {
        rows.push([
          evaluationId,
          evaluation.reviewer_email,
          evaluation.reviewee_email,
          evaluation.target_type,
          score.criteria_id,
          score.score,
          evaluation.comments,
          evaluation.evaluation_date
        ]);
      }

      // Append dữ liệu mới
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetTitle}!A:H`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      console.log('saveEvaluation: Saved new evaluation', evaluationId);
      return evaluationId;
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  /**
   * Cập nhật status của assignment (email-based model)
   * Tìm theo (reviewer_email, reviewee_email, target_type)
   */
  async updateAssignmentStatus(reviewerEmail: string, revieweeEmail: string, targetType: string, status: string): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:K',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return;

      // Dò header (case-insensitive, trim)
      const header = values[0].map((h: string) => (h || '').trim());
      const headerLower = header.map(h => h.toLowerCase());
      const col = (...names: string[]) => {
        for (const n of names) {
          const idx = headerLower.indexOf(n.toLowerCase());
          if (idx >= 0) return idx;
        }
        return -1;
      };
      const idx = {
        reviewerEmail: col('reviewer_email'),
        revieweeEmail: col('reviewee_email'),
        targetType: col('target_type'),
        status: col('status')
      };

      if (idx.reviewerEmail < 0 || idx.revieweeEmail < 0 || idx.targetType < 0 || idx.status < 0) {
        console.error('updateAssignmentStatus: Cannot find required columns', { idx });
        return;
      }

      console.log('updateAssignmentStatus: Looking for', { reviewerEmail, revieweeEmail, targetType, status });

      // Tìm dòng theo (reviewer_email, reviewee_email, target_type) và cập nhật status (trim + lower compare)
      for (let i = 1; i < values.length; i++) {
        const rowReviewer = (values[i][idx.reviewerEmail] || '').trim().toLowerCase();
        const rowReviewee = (values[i][idx.revieweeEmail] || '').trim().toLowerCase();
        const rowTarget = (values[i][idx.targetType] || '').trim();

        if (rowReviewer === reviewerEmail.trim().toLowerCase() &&
            rowReviewee === revieweeEmail.trim().toLowerCase() &&
            rowTarget === targetType) {
          // Convert column index to letter
          const colLetter = String.fromCharCode(65 + idx.status);
          console.log('updateAssignmentStatus: Updating row', i + 1, 'column', colLetter, 'to', status);
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `ASSIGNMENTS!${colLetter}${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[status]]
            }
          });
          console.log('updateAssignmentStatus: Success');
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

  /**
   * Lấy evaluation hiện có (nếu có) theo email-based model
   * Trả về evaluation gần nhất nếu có nhiều lần đánh giá
   */
  async getExistingEvaluation(reviewerEmail: string, revieweeEmail: string, targetType: string): Promise<any | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EVALUATIONS!A:H',
      });

      const values = response.data.values;
      if (!values || values.length < 2) return null;

      // Dò header (case-insensitive, trim)
      const header = values[0].map((h: string) => (h || '').trim());
      const headerLower = header.map(h => h.toLowerCase());
      const col = (...names: string[]) => {
        for (const n of names) {
          const idx = headerLower.indexOf(n.toLowerCase());
          if (idx >= 0) return idx;
        }
        return -1;
      };
      const idx = {
        evaluationId: col('evaluation_id'),
        reviewerEmail: col('reviewer_email'),
        revieweeEmail: col('reviewee_email'),
        targetType: col('target_type'),
        criteriaId: col('criteria_id'),
        score: col('score'),
        comments: col('comments'),
        evaluationDate: col('evaluation_date')
      };

      if (idx.evaluationId < 0 || idx.reviewerEmail < 0 || idx.revieweeEmail < 0 || idx.targetType < 0) {
        console.log('getExistingEvaluation: Missing required columns');
        return null;
      }

      // Tìm tất cả rows matching (reviewer_email, reviewee_email, target_type)
      const matchingRows = [];
      for (let i = 1; i < values.length; i++) {
        const rowReviewer = (values[i][idx.reviewerEmail] || '').trim().toLowerCase();
        const rowReviewee = (values[i][idx.revieweeEmail] || '').trim().toLowerCase();
        const rowTarget = (values[i][idx.targetType] || '').trim();

        if (rowReviewer === reviewerEmail.trim().toLowerCase() &&
            rowReviewee === revieweeEmail.trim().toLowerCase() &&
            rowTarget === targetType) {
          matchingRows.push(values[i]);
        }
      }

      if (matchingRows.length === 0) return null;

      // Lấy evaluation_id gần nhất (sort theo evaluation_date nếu có, hoặc evaluation_id)
      matchingRows.sort((a, b) => {
        const aId = a[idx.evaluationId] || '';
        const bId = b[idx.evaluationId] || '';
        return bId.localeCompare(aId); // DESC
      });

      const latestEvaluationId = matchingRows[0][idx.evaluationId];

      // Aggregate criteria_scores từ các rows cùng evaluation_id
      const criteriaScores: any[] = [];
      let comments = '';
      let evaluationDate = '';

      for (const row of matchingRows) {
        if (row[idx.evaluationId] === latestEvaluationId) {
          const criteriaId = row[idx.criteriaId];
          const score = row[idx.score] ? parseInt(row[idx.score]) : null;
          if (criteriaId && score !== null) {
            criteriaScores.push({ criteria_id: criteriaId, score });
          }
          if (idx.comments >= 0 && row[idx.comments]) {
            comments = row[idx.comments];
          }
          if (idx.evaluationDate >= 0 && row[idx.evaluationDate]) {
            evaluationDate = row[idx.evaluationDate];
          }
        }
      }

      return {
        exists: true,
        evaluation_id: latestEvaluationId,
        criteria_scores: criteriaScores,
        comments,
        evaluation_date: evaluationDate
      };
    } catch (error: any) {
      console.error('Error getting existing evaluation:', error);
      return null;
    }
  }
}