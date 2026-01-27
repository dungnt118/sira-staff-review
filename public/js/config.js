// Configuration cho Staff Reviewer App
window.SIRA_CONFIG = {
  // API Base URL - ưu tiên emulator khi đang chạy hosting emulator (port 5000) hoặc localhost/127
  // Emulator: hosting 5000, functions 5001
  API_BASE_URL: (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.port === '5000')
    ? 'http://127.0.0.1:5001/tmas-5f48e/us-central1'
    : 'https://us-central1-tmas-5f48e.cloudfunctions.net', // Prod: gọi thẳng Cloud Functions, tránh rewrite hosting

  // API Endpoints (khớp với Cloud Functions hiện tại)
  ENDPOINTS: {
    EMPLOYEE_LOOKUP: '/employeeLookup',
    LOGIN: '/login',
    GET_MY_ASSIGNMENTS: '/getMyAssignments',
    GET_CRITERIA: '/getCriteriaAPI',
    SAVE_EVALUATION: '/saveEvaluation',
    GET_EVALUATION: '/getEvaluation',
    GET_REPORT_DATA: '/getReportData',
    GET_PERSON_REPORT: '/getPersonReport'
  },

  // Firebase Config
  FIREBASE: {
    apiKey: "AIzaSyDmkaE51CRnu4AJPo6uAc9Web19sZ-CeHU",
    authDomain: "tmas-5f48e.firebaseapp.com",
    projectId: "tmas-5f48e",
    storageBucket: "tmas-5f48e.firebasestorage.app",
    messagingSenderId: "256219032535",
    appId: "1:256219032535:web:982400f879da9b43cd3992",
    measurementId: "G-MXJB7G7KYT"
  }
};

// Helper functions cho API calls
window.SIRA_API = {
  // Tạo full URL cho API endpoint
  getUrl: function(endpoint) {
    return window.SIRA_CONFIG.API_BASE_URL + endpoint;
  },

  // Đăng nhập / tra cứu nhân viên (POST /employeeLookup với body)
  lookupEmployee: async function(email) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.EMPLOYEE_LOOKUP),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Lấy danh sách phân công theo reviewer
  getMyAssignments: async function(reviewerEmail) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_MY_ASSIGNMENTS) +
        `?reviewer_email=${encodeURIComponent(reviewerEmail)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Lấy tiêu chí đánh giá
  getCriteria: async function(targetType) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_CRITERIA) +
        `?target_type=${encodeURIComponent(targetType)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Lưu kết quả đánh giá (email-based model)
  saveEvaluation: async function(reviewerEmail, revieweeEmail, targetType, criteriaScores, comments = '') {
    const response = await fetch(this.getUrl(window.SIRA_CONFIG.ENDPOINTS.SAVE_EVALUATION), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reviewer_email: reviewerEmail,
        reviewee_email: revieweeEmail,
        target_type: targetType,
        criteria_scores: criteriaScores,
        comments
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Lấy evaluation hiện có (để re-evaluation)
  getEvaluation: async function(reviewerEmail, revieweeEmail, targetType) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_EVALUATION) +
        `?reviewer_email=${encodeURIComponent(reviewerEmail)}&reviewee_email=${encodeURIComponent(revieweeEmail)}&target_type=${encodeURIComponent(targetType)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Lấy dữ liệu báo cáo (ADMIN only)
  getReportData: async function(adminEmail) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_REPORT_DATA) +
        `?admin_email=${encodeURIComponent(adminEmail)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Báo cáo chi tiết cho 1 nhân sự (ADMIN)
  getPersonReport: async function(adminEmail, revieweeEmail) {
    const response = await fetch(
      this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_PERSON_REPORT) +
        `?admin_email=${encodeURIComponent(adminEmail)}&reviewee_email=${encodeURIComponent(revieweeEmail)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
};

console.log('🎯 SIRA Config loaded:', {
  apiBaseUrl: window.SIRA_CONFIG.API_BASE_URL,
  isLocal: window.location.hostname === 'localhost'
});