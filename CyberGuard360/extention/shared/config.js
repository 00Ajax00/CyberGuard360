// Configuration for the extension
export default {
  API_URL: process.env.API_URL || 'https://cyberguard360-backend.onrender.com',
  LOCAL_SCAN_TIMEOUT: 5000, // 5 seconds
  MAX_CACHED_REPORTS: 50,
  VERSION: '1.0.0'
};