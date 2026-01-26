import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { SheetsClient, ResponseData } from "./sheets/sheets-client";

setGlobalOptions({ maxInstances: 10 });

/**
 * API để tìm nhân viên theo email
 * POST /employee-lookup
 * Body: { email: string }
 */
export const employeeLookup = onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const employee = await sheetsClient.getEmployeeByEmail(email);

    if (employee) {
      res.json({
        success: true,
        employee
      });
    } else {
      res.json({
        success: false,
        message: "Employee not found"
      });
    }
  } catch (error: any) {
    console.error("Error in employeeLookup:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API để lấy assignments của nhân viên
 * GET /assignments/{email}
 */
export const getAssignments = onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Lấy email từ query parameter hoặc path
    const email = req.query.email as string || req.path.split('/').pop();

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const assignments = await sheetsClient.getAssignmentsByEmail(email);

    // Lấy thông tin chi tiết về reviewee cho mỗi assignment
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const reviewee = await sheetsClient.getEmployeeById(assignment.reviewee_employee_id);
        const isCompleted = await sheetsClient.checkCompletedAssignment(assignment.assignment_id);
        
        return {
          ...assignment,
          reviewee,
          completed: isCompleted
        };
      })
    );

    res.json({
      success: true,
      assignments: assignmentsWithDetails
    });
  } catch (error: any) {
    console.error("Error in getAssignments:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API để lấy criteria theo group
 * GET /criteria/{group}
 */
export const getCriteria = onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Lấy group từ query parameter hoặc path
    const group = req.query.group as string || req.path.split('/').pop();

    if (!group) {
      res.status(400).json({ error: "Criteria group is required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const criteria = await sheetsClient.getCriteriaByGroup(group);

    res.json({
      success: true,
      criteria
    });
  } catch (error: any) {
    console.error("Error in getCriteria:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API để lưu response đánh giá
 * POST /save-response
 * Body: {
 *   assignment_id: string,
 *   responses: Array<{
 *     criteria_id: string,
 *     score?: number,
 *     comment?: string
 *   }>
 * }
 */
export const saveResponse = onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { assignment_id, responses } = req.body;

    if (!assignment_id || !responses || !Array.isArray(responses)) {
      res.status(400).json({ error: "assignment_id and responses array are required" });
      return;
    }

    const sheetsClient = new SheetsClient();
    const timestamp = new Date().toISOString();
    const savedResponses = [];

    // Lưu từng response
    for (const response of responses) {
      const responseData: ResponseData = {
        assignment_id,
        criteria_id: response.criteria_id,
        score: response.score,
        comment: response.comment,
        created_at: timestamp
      };

      const saved = await sheetsClient.saveResponse(responseData);
      if (saved) {
        savedResponses.push(responseData);
      }
    }

    res.json({
      success: true,
      message: `Saved ${savedResponses.length} responses successfully`,
      saved_count: savedResponses.length,
      total_count: responses.length
    });
  } catch (error: any) {
    console.error("Error in saveResponse:", error);
    res.status(500).json({ error: error.message });
  }
});

// Deprecated endpoints (giữ lại để tương thích)
export const getAppData = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  res.json({
    ok: true,
    message: "Staff Reviewer API hoạt động!",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /employee-lookup - Tìm nhân viên theo email",
      "GET /assignments?email={email} - Lấy assignments",
      "GET /criteria?group={group} - Lấy criteria theo group",
      "POST /save-response - Lưu kết quả đánh giá"
    ]
  });
});

export const submitReview = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  res.json({
    ok: true,
    message: "Please use /save-response endpoint instead",
    redirect: "/save-response"
  });
});