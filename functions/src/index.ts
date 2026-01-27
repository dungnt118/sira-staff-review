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
        position: employee.position
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
 * API lấy danh sách cần đánh giá cho reviewer
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
    const assignments = await sheetsClient.getAssignmentsByReviewer(reviewerEmail);
    
    // Lấy thông tin chi tiết của từng người được đánh giá
    const detailedAssignments = [];
    for (const assignment of assignments) {
      const reviewee = await sheetsClient.getEmployeeById(assignment.reviewee_employee_id);
      if (reviewee) {
        detailedAssignments.push({
          assignment_id: assignment.assignment_id,
          reviewee: {
            employee_id: reviewee.employee_id,
            name: reviewee.name,
            department: reviewee.department,
            position: reviewee.position,
            email: reviewee.email
          },
          target_type: assignment.target_type,
          status: assignment.status
        });
      }
    }

    res.json({
      success: true,
      assignments: detailedAssignments
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
 * API lưu kết quả đánh giá
 * POST /evaluation
 * Body: { assignment_id, criteria_scores: [{ criteria_id, score }], comments? }
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
    const { assignment_id, criteria_scores, comments } = req.body;
    
    if (!assignment_id || !criteria_scores || !Array.isArray(criteria_scores)) {
      res.status(400).json({ 
        success: false, 
        error: "assignment_id and criteria_scores array are required" 
      });
      return;
    }

    const sheetsClient = new SheetsClient();
    const evaluationId = await sheetsClient.saveEvaluation({
      assignment_id,
      criteria_scores,
      comments: comments || '',
      evaluation_date: new Date().toISOString().split('T')[0]
    });

    // Cập nhật status assignment thành COMPLETED
    await sheetsClient.updateAssignmentStatus(assignment_id, 'COMPLETED');

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