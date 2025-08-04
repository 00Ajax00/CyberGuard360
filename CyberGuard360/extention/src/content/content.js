let redirectCount = 0;
let lastUrl = location.href;

// --- Phishing Behavior Detection ---

// 1. Monitor for rapid redirects
const navigationObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.type === 'navigate') {
      redirectCount++;
      setTimeout(() => redirectCount = 0, 5000); // Reset count after 5 seconds
    }
  });
});
navigationObserver.observe({ type: "navigation", buffered: true });


// 2. Monitor form submissions for suspicious inputs
document.addEventListener('submit', (event) => {
  const form = event.target;
  const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
  let hasSuspiciousInput = false;

  inputs.forEach(input => {
    // Heuristic: check if input value looks like a URL
    try {
      new URL(input.value);
      hasSuspiciousInput = true;
    } catch (_) {
      // Not a valid URL, ignore
    }
  });

  if (hasSuspiciousInput) {
    chrome.storage.local.set({ 'behavior_suspiciousFormInput': true });
  }
}, true);


// --- Data Extraction for Scanning ---

// Send page data to the popup when it requests it
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageDataForScan') {
    // Extract all script sources
    const scripts = Array.from(document.scripts).map(s => s.src).filter(Boolean);
    
    // Get behavior data from local storage
    chrome.storage.local.get(['behavior_suspiciousFormInput'], (result) => {
      const behavior = {
        redirects: redirectCount,
        suspiciousFormInput: result.behavior_suspiciousFormInput || false
      };
      
      // Clear behavior flag after reading
      chrome.storage.local.remove('behavior_suspiciousFormInput');

      sendResponse({
        url: location.href,
        scripts: scripts,
        behavior: behavior
      });
    });
    
    return true; // Keep message channel open for async response
  }
});