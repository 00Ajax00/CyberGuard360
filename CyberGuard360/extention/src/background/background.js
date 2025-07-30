// Background service worker for the extension
import { initializeAlarms } from './alarms.js';
import { setupMessageHandlers } from './messages.js';
import { setupNavigationListener } from './navigation.js';
import { initializeStorage } from './storage.js';

// Initialize all background services
async function initializeBackground() {
  try {
    await initializeStorage();
    setupMessageHandlers();
    setupNavigationListener();
    initializeAlarms();
    
    console.log('CyberGuard360 background service initialized');
  } catch (error) {
    console.error('Background initialization failed:', error);
  }
}

initializeBackground();