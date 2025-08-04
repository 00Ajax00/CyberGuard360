const API_BASE_URL = 'http://localhost:3000/api';

// Helper to get token from storage
async function getToken() {
  const result = await chrome.storage.local.get(['jwt_token']);
  return result.jwt_token;
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAnonymousId") {
    chrome.storage.local.get(['anonymousId'], (result) => {
      if (result.anonymousId) {
        sendResponse({ anonymousId: result.anonymousId });
      } else {
        const newId = crypto.randomUUID();
        chrome.storage.local.set({ anonymousId: newId }, () => {
          sendResponse({ anonymousId: newId });
        });
      }
    });
    return true; // Keep the message channel open for sendResponse
  }

  // Handle API calls that require authentication
  (async () => {
    const token = await getToken();
    if (!token && (request.action.startsWith("api/"))) {
       sendResponse({ error: 'Not authenticated. Please log in.' });
       return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      let response;
      if (request.action === 'api/scan') {
        response = await fetch(`${API_BASE_URL}/scan`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request.data)
        });
      } else if (request.action === 'api/history') {
        response = await fetch(`${API_BASE_URL}/history`, { method: 'GET', headers });
      } else if (request.action === 'api/reports/community') {
        response = await fetch(`${API_BASE_URL}/reports/community`, { method: 'GET', headers });
      } else if (request.action === 'api/reports/submit') {
          // This one doesn't need auth
         response = await fetch(`${API_BASE_URL}/reports/submit`, {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify(request.data)
         });
      } else {
        sendResponse({ error: 'Unknown API action' });
        return;
      }
      
      const data = await response.json();
      if (!response.ok) {
          sendResponse({ error: data.message || 'API request failed' });
      } else {
          sendResponse({ success: true, data });
      }
    } catch (error) {
      sendResponse({ error: `Network or server error: ${error.message}` });
    }
  })();
  
  return true; // Indicates that the response is sent asynchronously
});