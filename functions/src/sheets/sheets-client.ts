import { sheets_v4, google } from 'googleapis';

// Interface cho dữ liệu từ các sheets
export interface Employee {
  employee_id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  role: string;
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
        range: 'EMPLOYEES!A:G',
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
      const statusIndex = headers.findIndex(h => h && h.toLowerCase().includes('status'));
      const roleIndex = headers.findIndex(h => h && h.toLowerCase().includes('role'));
      
      console.log('SheetsClient: Column indexes:', {
        emailIndex, idIndex, nameIndex, deptIndex, positionIndex, statusIndex, roleIndex
      });

      // Kiểm tra xem có tìm thấy cột email không
      if (emailIndex === -1) {
        console.error('SheetsClient: Email column not found in headers:', headers);
        return null;
      }

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
            status: (statusIndex !== -1 ? row[statusIndex] : row[5]) || '',
            role: (roleIndex !== -1 ? row[roleIndex] : '') || 'USER'
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
   * Lấy tất cả employees (helper để reuse dữ liệu thay vì fetch nhiều lần)
   * Returns Map<email, Employee> để lookup nhanh - CRITICAL để tránh 27 API calls
   */
  async getAllEmployeesAsMap(): Promise<Map<string, Employee>> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EMPLOYEES!A:G',
      });

      const values = response.data.values;
      const employeeMap = new Map<string, Employee>();

      if (!values || values.length < 2) return employeeMap;

      const headers = values[0];
      const emailIndex = headers.findIndex(h => h && h.toLowerCase().includes('email'));
      const idIndex = headers.findIndex(h => h && h.toLowerCase().includes('employee_id'));
      const nameIndex = headers.findIndex(h => h && h.toLowerCase().includes('name'));
      const deptIndex = headers.findIndex(h => h && h.toLowerCase().includes('department'));
      const positionIndex = headers.findIndex(h => h && h.toLowerCase().includes('position'));
      const statusIndex = headers.findIndex(h => h && h.toLowerCase().includes('status'));
      const roleIndex = headers.findIndex(h => h && h.toLowerCase().includes('role'));

      if (emailIndex === -1) return employeeMap;

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const email = row[emailIndex];
        if (email) {
          employeeMap.set(email.toLowerCase(), {
            employee_id: row[idIndex] || '',
            name: row[nameIndex] || '',
            email: email || '',
            department: row[deptIndex] || '',
            position: row[positionIndex] || '',
            status: (statusIndex !== -1 ? row[statusIndex] : row[5]) || '',
            role: (roleIndex !== -1 ? row[roleIndex] : '') || 'USER'
          });
        }
      }

      console.log(`getAllEmployeesAsMap: Loaded ${employeeMap.size} employees (1 API call reused for multiple lookups)`);
      return employeeMap;
    } catch (error: any) {
      console.error('Error getting all employees as map:', error);
      return new Map();
    }
  }

  /**
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
        range: 'EMPLOYEES!A:G',
      });

      const values = response.data.values;
      if (!values) return null;

      const headers = values[0] || [];
      const idIndex = headers.findIndex(h => h && h.toLowerCase().includes('employee_id'));
      const nameIndex = headers.findIndex(h => h && h.toLowerCase().includes('name'));
      const emailIndex = headers.findIndex(h => h && h.toLowerCase().includes('email'));
      const deptIndex = headers.findIndex(h => h && h.toLowerCase().includes('department'));
      const positionIndex = headers.findIndex(h => h && h.toLowerCase().includes('position'));
      const statusIndex = headers.findIndex(h => h && h.toLowerCase().includes('status'));
      const roleIndex = headers.findIndex(h => h && h.toLowerCase().includes('role'));

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const idValue = idIndex !== -1 ? row[idIndex] : row[0];
        if (idValue === employeeId) {
          return {
            employee_id: idValue || '',
            name: nameIndex !== -1 ? row[nameIndex] || '' : row[1] || '',
            email: emailIndex !== -1 ? row[emailIndex] || '' : row[2] || '',
            department: deptIndex !== -1 ? row[deptIndex] || '' : row[3] || '',
            position: positionIndex !== -1 ? row[positionIndex] || '' : row[4] || '',
            status: (statusIndex !== -1 ? row[statusIndex] : row[5]) || '',
            role: (roleIndex !== -1 ? row[roleIndex] : '') || 'USER'
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
   * Lấy danh sách assignments theo reviewer email (email-based model) - OPTIMIZED v2
   * KEY FIX: Fetch EMPLOYEES once + parallel, reuse for all assignments
   * Before: 27 sequential getEmployeeByEmail calls = 17s
   * After: 1 getAllEmployeesAsMap + parallel = <1s
   */
  async getAssignmentsByReviewer(reviewerEmail: string): Promise<any[]> {
    try {
      const startTime = Date.now();
      
      // PARALLEL: Fetch ASSIGNMENTS + EMPLOYEES cùng lúc (CRITICAL OPTIMIZATION)
      console.log('getAssignmentsByReviewer: [PARALLEL] Fetching assignments + all employees...');
      const [assignResponse, employeeMap] = await Promise.all([
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'ASSIGNMENTS!A:K',
        }),
        this.getAllEmployeesAsMap()
      ]);

      const values = assignResponse.data.values;
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
      const inputReviewerLower = reviewerEmail.trim().toLowerCase();

      // Bỏ qua header row (index 0)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const reviewerCol = idx.reviewerEmail;
        const reviewerVal = reviewerCol >= 0 ? (row[reviewerCol] || '').trim().toLowerCase() : '';

        if (reviewerCol >= 0 && reviewerVal === inputReviewerLower) {
          const candidateTarget = idx.targetType >= 0 ? (row[idx.targetType] || '').trim() : '';
          const candidatePeriod = idx.period >= 0 ? (row[idx.period] || '').trim() : '';
          const targetType = validTargets.includes(candidateTarget) ? candidateTarget : validTargets.includes(candidatePeriod) ? candidatePeriod : '';

          const statusVal = idx.status >= 0 ? row[idx.status] : '';
          const revieweeEmail = idx.revieweeEmail >= 0 ? (row[idx.revieweeEmail] || '').trim() : '';

          // Yêu cầu phải có reviewee_email (không phụ thuộc employee_id)
          if (revieweeEmail) {
            // REUSE employee data từ map thay vì fetch 27 lần!
            const employee = employeeMap.get(revieweeEmail.toLowerCase());
            assignments.push({
              reviewer_email: row[reviewerCol],
              reviewee_email: revieweeEmail,
              reviewee: employee || { email: revieweeEmail, name: revieweeEmail },
              target_type: targetType,
              status: statusVal || 'PENDING',
              period: idx.period >= 0 ? row[idx.period] : ''
            });
          } else {
            console.warn('getAssignmentsByReviewer: missing reviewee_email, skip row', { rowIndex: i + 1 });
          }
        }
      }

      console.log(`getAssignmentsByReviewer: ✅ Loaded ${assignments.length} assignments in ${Date.now() - startTime}ms (before: 17s+)`);
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
   * Lưu kết quả đánh giá (email-based model) - OPTIMIZED
   * evaluation: { reviewer_email, reviewee_email, target_type, criteria_scores, comments, evaluation_date }
   * Re-evaluation: Xóa evaluation cũ (nếu có) và tạo mới
   * 
   * Optimizations:
   * - Merge metadata + EVALUATIONS data fetch → 1 Promise.all
   * - Reuse fetched data thay vì gọi getExistingEvaluation
   * - Parallel delete (batchUpdate) + insert (append)
   */
  async saveEvaluation(evaluation: any): Promise<string> {
    try {
      const sheetTitle = 'EVALUATIONS';
      const startTime = Date.now();

      // STEP 1: Parallel fetch sheet metadata + EVALUATIONS data
      console.log('saveEvaluation: [STEP 1] Fetching sheet info + EVALUATIONS data (parallel)...');
      const [sheetMetadata, evaluationsResponse] = await Promise.all([
        this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          fields: 'sheets(properties(title,sheetId))'
        }),
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetTitle}!A:H`,
        }).catch(() => ({ data: { values: null } }))
      ]);

      const sheetInfo = sheetMetadata.data.sheets?.find(s => s.properties?.title === sheetTitle);
      const sheetId = sheetInfo?.properties?.sheetId;
      const values = evaluationsResponse.data.values;

      console.log(`saveEvaluation: [STEP 1] Done (${Date.now() - startTime}ms). SheetId=${sheetId}, Rows=${values?.length || 0}`);

      // STEP 2: Tạo sheet nếu chưa có
      if (!sheetInfo) {
        console.log('saveEvaluation: [STEP 2] Sheet EVALUATIONS not found, creating...');
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              { addSheet: { properties: { title: sheetTitle } } }
            ]
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
        console.log(`saveEvaluation: [STEP 2] Sheet created (${Date.now() - startTime}ms)`);
        return this._insertEvaluationRows(evaluation);
      }

      // STEP 3: Tìm và xóa evaluation cũ (reuse data từ STEP 1, không fetch lại)
      let existingEvalId: string | null = null;
      if (values && values.length > 1) {
        const header = values[0].map((h: string) => (h || '').trim());
        const headerLower = header.map(h => h.toLowerCase());
        const evalIdIdx = headerLower.indexOf('evaluation_id');
        const reviewerIdx = headerLower.indexOf('reviewer_email');
        const revieweeIdx = headerLower.indexOf('reviewee_email');
        const targetIdx = headerLower.indexOf('target_type');

        if (evalIdIdx >= 0 && reviewerIdx >= 0 && revieweeIdx >= 0 && targetIdx >= 0) {
          existingEvalId = this._findExistingEvaluationId(
            values,
            { evalIdIdx, reviewerIdx, revieweeIdx, targetIdx },
            evaluation.reviewer_email,
            evaluation.reviewee_email,
            evaluation.target_type
          );

          if (existingEvalId && sheetId !== undefined) {
            console.log(`saveEvaluation: [STEP 3] Found existing evaluation ${existingEvalId}, will delete...`);
            
            const rowsToDelete = [];
            for (let i = values.length - 1; i >= 1; i--) {
              if ((values[i][evalIdIdx] || '').toString() === existingEvalId) {
                rowsToDelete.push(i);
              }
            }

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

              await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: { requests: deleteRequests }
              });
              console.log(`saveEvaluation: [STEP 3] Deleted ${rowsToDelete.length} old rows (${Date.now() - startTime}ms)`);
            }
          }
        }
      }

      // STEP 4: Insert new evaluation
      console.log('saveEvaluation: [STEP 4] Inserting new evaluation...');
      const evaluationId = await this._insertEvaluationRows(evaluation);
      console.log(`saveEvaluation: ✅ Done in ${Date.now() - startTime}ms`);
      
      return evaluationId;
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  /**
   * Helper: Insert evaluation rows (tạo mới evaluation ID + append rows)
   */
  private async _insertEvaluationRows(evaluation: any): Promise<string> {
    const evaluationId = `EVAL_${Date.now()}`;
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

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'EVALUATIONS!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: rows }
    });

    return evaluationId;
  }

  /**
   * Helper: Find existing evaluation ID từ values array (không fetch lại)
   * Dùng để tránh duplicate fetches trong saveEvaluation
   */
  private _findExistingEvaluationId(
    values: any[][],
    columnIndices: any,
    reviewerEmail: string,
    revieweeEmail: string,
    targetType: string
  ): string | null {
    const { evalIdIdx, reviewerIdx, revieweeIdx, targetIdx } = columnIndices;
    const matchingEvalIds = new Set<string>();

    for (let i = 1; i < values.length; i++) {
      const rowReviewer = (values[i][reviewerIdx] || '').trim().toLowerCase();
      const rowReviewee = (values[i][revieweeIdx] || '').trim().toLowerCase();
      const rowTarget = (values[i][targetIdx] || '').trim();

      if (rowReviewer === reviewerEmail.trim().toLowerCase() &&
          rowReviewee === revieweeEmail.trim().toLowerCase() &&
          rowTarget === targetType) {
        const evalId = (values[i][evalIdIdx] || '').toString();
        if (evalId) matchingEvalIds.add(evalId);
      }
    }

    // Return latest evaluation ID (since EVAL_timestamp, DESC sort = latest first)
    if (matchingEvalIds.size > 0) {
      const ids = Array.from(matchingEvalIds).sort().reverse();
      return ids[0];
    }
    return null;
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
   * Lấy evaluation hiện có (nếu có) theo email-based model - OPTIMIZED
   * Trả về evaluation gần nhất nếu có nhiều lần đánh giá
   * 
   * Optimizations:
   * - Giới hạn scan đến cần thiết (không cần all 8 cột)
   * - Early return khi tìm thấy đủ data
   */
  async getExistingEvaluation(reviewerEmail: string, revieweeEmail: string, targetType: string): Promise<any | null> {
    try {
      const startTime = Date.now();
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
      const inputReviewerLower = reviewerEmail.trim().toLowerCase();
      const inputRevieweeLower = revieweeEmail.trim().toLowerCase();

      for (let i = 1; i < values.length; i++) {
        const rowReviewer = (values[i][idx.reviewerEmail] || '').trim().toLowerCase();
        const rowReviewee = (values[i][idx.revieweeEmail] || '').trim().toLowerCase();
        const rowTarget = (values[i][idx.targetType] || '').trim();

        if (rowReviewer === inputReviewerLower &&
            rowReviewee === inputRevieweeLower &&
            rowTarget === targetType) {
          matchingRows.push(values[i]);
        }
      }

      if (matchingRows.length === 0) {
        console.log(`getExistingEvaluation: No evaluation found (${Date.now() - startTime}ms)`);
        return null;
      }

      // Lấy evaluation_id gần nhất (sort DESC theo timestamp)
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

      const result = {
        exists: true,
        evaluation_id: latestEvaluationId,
        criteria_scores: criteriaScores,
        comments,
        evaluation_date: evaluationDate
      };

      console.log(`getExistingEvaluation: ✅ Found in ${Date.now() - startTime}ms`);
      return result;
    } catch (error: any) {
      console.error('Error getting existing evaluation:', error);
      return null;
    }
  }

  /**
   * Tổng hợp dữ liệu báo cáo cho ADMIN
   * - Top 5 nhân viên (target_type=EMPLOYEE) theo tổng điểm
   * - Top 3 quản lý (target_type=MANAGER) theo tổng điểm
   * - Reviewers chưa đánh giá (status != COMPLETED)
   * - Reviewees chưa được đánh giá & đã được đánh giá
   * - Summary: totalEmployees, totalManagers, totalEvaluations, completionRate
   */
  async getReportData(): Promise<any> {
    // Fetch tất cả sheets song song để giảm thời gian (1-2s)
    const [employeeMap, evalResp, assignResp] = await Promise.all([
      this.getAllEmployeesAsMap(),
      this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EVALUATIONS!A:H',
      }).catch(() => ({ data: { values: null } })),
      this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ASSIGNMENTS!A:K',
      }).catch(() => ({ data: { values: null } })),
    ]);

    // ----- Parse EVALUATIONS -----
    const evalValues = evalResp.data.values || [];
    const evalHeader = evalValues[0]?.map((h: string) => (h || '').trim().toLowerCase()) || [];
    const idxEval = (name: string) => evalHeader.indexOf(name.toLowerCase());
    const evalIdx = {
      evaluationId: idxEval('evaluation_id'),
      reviewerEmail: idxEval('reviewer_email'),
      revieweeEmail: idxEval('reviewee_email'),
      targetType: idxEval('target_type'),
      score: idxEval('score'),
    };

    // Tính tổng điểm theo evaluation_id trước (mỗi evaluation có nhiều dòng criteria)
    const evaluationTotals = new Map<string, { revieweeEmail: string; targetType: string; totalScore: number }>();
    if (evalValues.length > 1 && evalIdx.evaluationId >= 0 && evalIdx.revieweeEmail >= 0 && evalIdx.targetType >= 0) {
      for (let i = 1; i < evalValues.length; i++) {
        const row = evalValues[i];
        const evalId = row[evalIdx.evaluationId];
        const revieweeEmail = (row[evalIdx.revieweeEmail] || '').trim();
        const targetType = row[evalIdx.targetType] || '';
        const scoreVal = evalIdx.score >= 0 ? Number(row[evalIdx.score]) : Number(row[5]);
        if (!evalId || !revieweeEmail || isNaN(scoreVal)) continue;

        const existing = evaluationTotals.get(evalId) || { revieweeEmail, targetType, totalScore: 0 };
        existing.totalScore += scoreVal;
        // Preserve first seen reviewee/targetType for the evaluation
        if (!existing.revieweeEmail) existing.revieweeEmail = revieweeEmail;
        if (!existing.targetType) existing.targetType = targetType;
        evaluationTotals.set(evalId, existing);
      }
    }

    // Gom theo reviewee_email + target_type
    const revieweeAggregates = new Map<string, { email: string; targetType: string; totalScore: number; evaluationCount: number }>();
    for (const [, entry] of evaluationTotals) {
      const key = `${entry.revieweeEmail.toLowerCase()}|${entry.targetType}`;
      const agg = revieweeAggregates.get(key) || { email: entry.revieweeEmail, targetType: entry.targetType, totalScore: 0, evaluationCount: 0 };
      agg.totalScore += entry.totalScore;
      agg.evaluationCount += 1;
      revieweeAggregates.set(key, agg);
    }

    // Tách top theo target_type
    const toDisplay = (arr: any[], limit: number) =>
      arr
        .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
        .slice(0, limit);

    const topEmployeesRaw = [] as any[];
    const topManagersRaw = [] as any[];
    for (const [, agg] of revieweeAggregates) {
      const emp = employeeMap.get(agg.email.toLowerCase());
      const base = {
        email: agg.email,
        name: emp?.name || agg.email,
        totalScore: agg.totalScore,
        evaluationCount: agg.evaluationCount,
        avgScore: agg.evaluationCount > 0 ? agg.totalScore / agg.evaluationCount : 0,
      };
      if (agg.targetType === 'EMPLOYEE') topEmployeesRaw.push(base);
      if (agg.targetType === 'MANAGER') topManagersRaw.push(base);
    }

    const topEmployees = toDisplay(topEmployeesRaw, 5);
    const topManagers = toDisplay(topManagersRaw, 3);

    // ----- Parse ASSIGNMENTS -----
    const assignValues = assignResp.data.values || [];
    const assignHeader = assignValues[0]?.map((h: string) => (h || '').trim().toLowerCase()) || [];
    const idxAssign = (name: string) => assignHeader.indexOf(name.toLowerCase());
    const assignIdx = {
      reviewerEmail: idxAssign('reviewer_email'),
      revieweeEmail: idxAssign('reviewee_email'),
      targetType: idxAssign('target_type'),
      status: idxAssign('status'),
    };

    const totalAssignments = Math.max(assignValues.length - 1, 0);
    let completedAssignments = 0;
    const pendingByReviewer = new Map<string, number>();
    const revieweesFromAssignments = new Set<string>();

    if (assignValues.length > 1 && assignIdx.reviewerEmail >= 0 && assignIdx.revieweeEmail >= 0 && assignIdx.status >= 0) {
      for (let i = 1; i < assignValues.length; i++) {
        const row = assignValues[i];
        const reviewer = (row[assignIdx.reviewerEmail] || '').trim();
        const reviewee = (row[assignIdx.revieweeEmail] || '').trim();
        const status = (row[assignIdx.status] || '').trim().toUpperCase();
        if (reviewee) revieweesFromAssignments.add(reviewee.toLowerCase());

        if (status === 'COMPLETED') {
          completedAssignments += 1;
        } else {
          // pending assignment của reviewer
          if (reviewer) {
            pendingByReviewer.set(reviewer.toLowerCase(), (pendingByReviewer.get(reviewer.toLowerCase()) || 0) + 1);
          }
        }
      }
    }

    const notEvaluatedReviewers = Array.from(pendingByReviewer.entries())
      .map(([email, pending]) => {
        const emp = employeeMap.get(email);
        return {
          email,
          name: emp?.name || email,
          pendingAssignments: pending,
        };
      })
      .sort((a, b) => b.pendingAssignments - a.pendingAssignments || a.name.localeCompare(b.name));

    // ----- Reviewees evaluated / not evaluated -----
    const evaluatedRevieweesSet = new Set<string>();
    for (const [, entry] of evaluationTotals) {
      evaluatedRevieweesSet.add(entry.revieweeEmail.toLowerCase());
    }

    const notEvaluatedReviewees = Array.from(revieweesFromAssignments)
      .filter(email => !evaluatedRevieweesSet.has(email))
      .map(email => {
        const emp = employeeMap.get(email);
        return { email, name: emp?.name || email };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const evaluatedReviewees = Array.from(evaluatedRevieweesSet)
      .map(email => {
        // Đếm số evaluation_id (không phải số row criteria)
        const evalCount = Array.from(evaluationTotals.values()).filter(v => v.revieweeEmail.toLowerCase() === email).length;
        const emp = employeeMap.get(email);
        return { email, name: emp?.name || email, evaluationCount: evalCount };
      })
      .sort((a, b) => b.evaluationCount - a.evaluationCount || a.name.localeCompare(b.name));

    // ----- Summary -----
    const totalEmployees = employeeMap.size;
    const totalManagers = Array.from(employeeMap.values()).filter(e => (e.role || '').toUpperCase() === 'MANAGER').length;
    const totalEvaluations = evaluationTotals.size;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 1000) / 10 : 0; // 1 decimal

    return {
      topEmployees,
      topManagers,
      notEvaluatedReviewers,
      notEvaluatedReviewees,
      evaluatedReviewees,
      summary: {
        totalEmployees,
        totalManagers,
        totalEvaluations,
        completionRate,
        totalAssignments,
        completedAssignments,
      }
    };
  }

  /**
   * Báo cáo chi tiết cho 1 nhân sự: theo target_type, điểm tổng, avg, và điểm trung bình từng criteria
   */
  async getPersonReport(revieweeEmail: string): Promise<any> {
    const emailLower = revieweeEmail.trim().toLowerCase();

    // Fetch song song: employees map, evaluations, criteria
    const [employeeMap, evalResp, criteriaResp] = await Promise.all([
      this.getAllEmployeesAsMap(),
      this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EVALUATIONS!A:H',
      }).catch(() => ({ data: { values: null } })),
      this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'CRITERIA!A:H',
      }).catch(() => ({ data: { values: null } })),
    ]);

    const employee = employeeMap.get(emailLower) || { email: revieweeEmail, name: revieweeEmail } as any;

    // Map criteria_id -> { name, target_type }
    const criteriaMap = new Map<string, { name: string; targetType: string }>();
    const cVals = criteriaResp.data.values || [];
    if (cVals.length > 1) {
      const header = cVals[0].map((h: string) => (h || '').trim().toLowerCase());
      const idx = {
        id: header.indexOf('criteria_id'),
        name: header.indexOf('criteria_name'),
        target: header.indexOf('target_type'),
      };
      for (let i = 1; i < cVals.length; i++) {
        const row = cVals[i];
        const id = (idx.id >= 0 ? row[idx.id] : row[0])?.toString();
        if (!id) continue;
        const name = idx.name >= 0 ? row[idx.name] : row[1];
        const targetType = idx.target >= 0 ? row[idx.target] : row[2];
        criteriaMap.set(id, { name, targetType });
      }
    }

    // Parse evaluations for this reviewee
    const eVals = evalResp.data.values || [];
    if (eVals.length <= 1) {
      return {
        reviewee: employee,
        targets: {}
      };
    }
    const eHeader = eVals[0].map((h: string) => (h || '').trim().toLowerCase());
    const eIdx = {
      evalId: eHeader.indexOf('evaluation_id'),
      reviewer: eHeader.indexOf('reviewer_email'),
      reviewee: eHeader.indexOf('reviewee_email'),
      target: eHeader.indexOf('target_type'),
      criteriaId: eHeader.indexOf('criteria_id'),
      score: eHeader.indexOf('score'),
    };

    const perTarget: Record<string, {
      totalScore: number;
      evalIds: Set<string>;
      criteria: Map<string, { total: number; count: number; name: string }>;
    }> = {};

    for (let i = 1; i < eVals.length; i++) {
      const row = eVals[i];
      const revieweeVal = (row[eIdx.reviewee] || '').trim().toLowerCase();
      if (revieweeVal !== emailLower) continue;
      const target = (row[eIdx.target] || '').trim();
      if (!target) continue;
      const evalId = (row[eIdx.evalId] || '').toString();
      const criteriaId = (row[eIdx.criteriaId] || '').toString();
      const scoreVal = eIdx.score >= 0 ? Number(row[eIdx.score]) : Number(row[5]);
      if (!criteriaId || isNaN(scoreVal)) continue;

      if (!perTarget[target]) {
        perTarget[target] = { totalScore: 0, evalIds: new Set<string>(), criteria: new Map() };
      }
      const bucket = perTarget[target];
      bucket.totalScore += scoreVal;
      if (evalId) bucket.evalIds.add(evalId);

      const cInfo = criteriaMap.get(criteriaId);
      const cName = cInfo?.name || criteriaId;
      const cBucket = bucket.criteria.get(criteriaId) || { total: 0, count: 0, name: cName };
      cBucket.total += scoreVal;
      cBucket.count += 1;
      bucket.criteria.set(criteriaId, cBucket);
    }

    // Build response per target
    const targets: any = {};
    for (const [target, data] of Object.entries(perTarget)) {
      const criteria = Array.from(data.criteria.entries()).map(([id, v]) => ({
        criteria_id: id,
        criteria_name: v.name,
        average: v.count > 0 ? Math.round((v.total / v.count) * 10) / 10 : 0,
        total: v.total,
        count: v.count,
      })).sort((a, b) => b.average - a.average || a.criteria_name.localeCompare(b.criteria_name));

      targets[target] = {
        target_type: target,
        totalScore: data.totalScore,
        evaluationCount: data.evalIds.size,
        averageScore: data.evalIds.size > 0 ? Math.round((data.totalScore / data.evalIds.size) * 10) / 10 : 0,
        criteria
      };
    }

    return {
      reviewee: employee,
      targets
    };
  }
}