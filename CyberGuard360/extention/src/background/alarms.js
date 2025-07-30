// Background alarm scheduler for periodic tasks
export function initializeAlarms() {
  // Setup alarm for cleaning old data
  chrome.alarms.create('cleanOldData', { periodInMinutes: 60 });

  // Setup alarm for fetching community reports
  chrome.alarms.create('fetchCommunityReports', { periodInMinutes: 30 });

  // Alarm listeners
  chrome.alarms.onAlarm.addListener((alarm) => {
    switch (alarm.name) {
      case 'cleanOldData':
        cleanOldData();
        break;
      case 'fetchCommunityReports':
        fetchCommunityReports();
        break;
    }
  });
}

async function cleanOldData() {
  // Clean old scan results from storage
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const items = await chrome.storage.local.get();
  
  for (const key in items) {
    if (key.startsWith('scan_') && items[key].timestamp < oneWeekAgo) {
      await chrome.storage.local.remove(key);
    }
  }
}

async function fetchCommunityReports() {
  try {
    const response = await fetch(`${config.API_URL}/api/community`);
    const reports = await response.json();
    await chrome.storage.local.set({ communityReports: reports });
  } catch (error) {
    console.error('Failed to fetch community reports:', error);
  }
}