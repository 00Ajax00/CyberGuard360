// Message handlers for communication between extension parts
export function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'performScan':
        handleScanRequest(request.data, sendResponse);
        return true; // Indicates async response
      case 'submitReport':
        handleReportSubmission(request.data, sendResponse);
        return true;
      case 'getHistory':
        handleHistoryRequest(request.data, sendResponse);
        return true;
    }
  });
}

async function handleScanRequest(data, sendResponse) {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    const response = await fetch(`${config.API_URL}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Scan failed');
    
    const result = await response.json();
    await chrome.storage.local.set({ lastScan: result });
    sendResponse({ success: true, data: result });
  } catch (error) {
    console.error('Scan request failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleReportSubmission(data, sendResponse) {
  try {
    const response = await fetch(`${config.API_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Report submission failed');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Report submission failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleHistoryRequest(data, sendResponse) {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    const response = await fetch(`${config.API_URL}/api/history`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch history');
    
    const history = await response.json();
    sendResponse({ success: true, data: history });
  } catch (error) {
    console.error('History request failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}