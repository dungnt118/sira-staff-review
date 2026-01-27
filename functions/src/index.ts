import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { SheetsClient } from "./sheets/sheets-client";

setGlobalOptions({ maxInstances: 10 });

/**
 * Test function để debug authentication
 */
export const testAuth = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    console.log('testAuth: Testing service account authentication...');
    const sheetsClient = new SheetsClient();
    
    console.log('testAuth: SheetsClient created successfully');
    
    // Test thử getEmployeeByEmail để xem danh sách employees
    console.log('testAuth: Testing getEmployeeByEmail to show employee list...');
    const result = await sheetsClient.getEmployeeByEmail('dungnt118@gmail.com');
    console.log('testAuth: Found employee result:', result);
    
    res.json({
      success: true,
      message: "Service account authentication working",
      spreadsheetId: "1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko"
    });
    
  } catch (error: any) {
    console.error('testAuth: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    });
  }
});

/**
 * API đăng nhập - kiểm tra email có tồn tại không
 * GET /login?email=xxx
 */
export const login = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const employee = await sheetsClient.getEmployeeByEmail(email);
    
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    res.json({
      success: true,
      employee: {
        email: employee.email,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        role: employee.role
      }
    });
    
  } catch (error: any) {
    console.error('login: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API lấy danh sách cần đánh giá cho reviewer (email-based model)
 * GET /my-assignments?reviewer_email=xxx
 */
export const getMyAssignments = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const reviewerEmail = req.query.reviewer_email as string;
    if (!reviewerEmail) {
      res.status(400).json({ success: false, error: "Reviewer email is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    // getAssignmentsByReviewer đã optimized: trả về assignments với reviewee object embedded
    const assignments = await sheetsClient.getAssignmentsByReviewer(reviewerEmail);

    res.json({
      success: true,
      assignments: assignments
    });
    
  } catch (error: any) {
    console.error('getMyAssignments: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API lấy tiêu chí đánh giá
 * GET /criteria?target_type=EMPLOYEE|MANAGER
 */
export const getCriteriaAPI = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const targetType = req.query.target_type as string;
    if (!targetType || !['EMPLOYEE', 'MANAGER'].includes(targetType)) {
      res.status(400).json({ success: false, error: "Valid target_type is required (EMPLOYEE|MANAGER)" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const criteria = await sheetsClient.getCriteriaByTargetType(targetType);
    
    // Tổ chức criteria theo cấu trúc phân cấp (chỉ cho EMPLOYEE)
    if (targetType === 'EMPLOYEE') {
      const categories = criteria.filter((c: any) => c.level === 1);
      const hierarchicalCriteria = categories.map((category: any) => ({
        ...category,
        sub_criteria: criteria.filter((c: any) => c.parent_id === category.criteria_id && c.level === 2)
      }));
      
      res.json({
        success: true,
        criteria: hierarchicalCriteria,
        total_categories: categories.length,
        total_sub_criteria: criteria.filter((c: any) => c.level === 2).length
      });
    } else {
      // Manager criteria không có phân cấp
      res.json({
        success: true,
        criteria: criteria,
        total_criteria: criteria.length
      });
    }
    
  } catch (error: any) {
    console.error('getCriteriaAPI: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API lưu kết quả đánh giá (email-based model)
 * POST /evaluation
 * Body: { reviewer_email, reviewee_email, target_type, criteria_scores: [{ criteria_id, score }], comments? }
 */
export const saveEvaluation = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { reviewer_email, reviewee_email, target_type, criteria_scores, comments } = req.body;
    
    if (!reviewer_email || !reviewee_email || !target_type || !criteria_scores || !Array.isArray(criteria_scores)) {
      res.status(400).json({ 
        success: false, 
        error: "reviewer_email, reviewee_email, target_type, and criteria_scores array are required" 
      });
      return;
    }

    const sheetsClient = new SheetsClient();
    const evaluationData = {
      reviewer_email,
      reviewee_email,
      target_type,
      criteria_scores,
      comments: comments || '',
      evaluation_date: new Date().toISOString().split('T')[0]
    };

    // OPTIMIZATION: Parallel execution - cả 2 operations không phụ thuộc nhau
    const [evaluationId] = await Promise.all([
      sheetsClient.saveEvaluation(evaluationData),
      sheetsClient.updateAssignmentStatus(reviewer_email, reviewee_email, target_type, 'COMPLETED')
    ]);

    res.json({
      success: true,
      evaluation_id: evaluationId,
      message: "Evaluation saved successfully"
    });
    
  } catch (error: any) {
    console.error('saveEvaluation: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API lấy evaluation hiện có (nếu đã đánh giá trước đó)
 * GET /get-evaluation?reviewer_email=xxx&reviewee_email=yyy&target_type=zzz
 */
export const getEvaluation = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const reviewerEmail = req.query.reviewer_email as string;
    const revieweeEmail = req.query.reviewee_email as string;
    const targetType = req.query.target_type as string;

    if (!reviewerEmail || !revieweeEmail || !targetType) {
      res.status(400).json({ 
        success: false, 
        error: "reviewer_email, reviewee_email, and target_type are required" 
      });
      return;
    }

    const sheetsClient = new SheetsClient();
    const evaluation = await sheetsClient.getExistingEvaluation(reviewerEmail, revieweeEmail, targetType);

    if (!evaluation) {
      res.json({
        success: true,
        exists: false
      });
      return;
    }

    res.json({
      success: true,
      ...evaluation
    });
    
  } catch (error: any) {
    console.error('getEvaluation: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API báo cáo (ADMIN only)
 * GET /getReportData?admin_email=xxx
 */
export const getReportData = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const adminEmail = req.query.admin_email as string;
    if (!adminEmail) {
      res.status(400).json({ success: false, error: "admin_email is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const admin = await sheetsClient.getEmployeeByEmail(adminEmail);
    const role = admin?.role?.toUpperCase() || 'USER';
    if (role !== 'ADMIN') {
      res.status(403).json({ success: false, error: "Permission denied: ADMIN only" });
      return;
    }

    const data = await sheetsClient.getReportData();

    res.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('getReportData: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * API để tìm nhân viên theo email
 * POST /employee-lookup
 * Body: { email: string }
 */
export const employeeLookup = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }

    console.log(`employeeLookup: Looking up employee with email: ${email}`);
    
    const sheetsClient = new SheetsClient();
    const employee = await sheetsClient.getEmployeeByEmail(email);
    
    if (employee) {
      res.json({
        success: true,
        employee: employee,
        message: "Employee found successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }
    
  } catch (error: any) {
    console.error('employeeLookup: Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    });
  }
});