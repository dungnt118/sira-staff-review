// Configuration cho Staff Reviewer App
window.SIRA_CONFIG = {
  // API Base URL - change này để switch giữa local và production
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:5001/tmas-5f48e/us-central1'  // Local emulator
    : '',  // Production - sẽ dùng same origin

  // API Endpoints
  ENDPOINTS: {
    EMPLOYEE_LOOKUP: '/employeeLookup',
    GET_ASSIGNMENTS: '/getAssignments',
    GET_CRITERIA: '/getCriteria', 
    SAVE_RESPONSE: '/saveResponse'
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

  // Employee lookup
  lookupEmployee: async function(email) {
    const response = await fetch(this.getUrl(window.SIRA_CONFIG.ENDPOINTS.EMPLOYEE_LOOKUP), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Get assignments
  getAssignments: async function(email) {
    const response = await fetch(this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_ASSIGNMENTS) + `?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Get criteria
  getCriteria: async function(group) {
    const response = await fetch(this.getUrl(window.SIRA_CONFIG.ENDPOINTS.GET_CRITERIA) + `?group=${encodeURIComponent(group)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Save response
  saveResponse: async function(assignmentId, responses) {
    const response = await fetch(this.getUrl(window.SIRA_CONFIG.ENDPOINTS.SAVE_RESPONSE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment_id: assignmentId,
        responses: responses
      })
    });

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