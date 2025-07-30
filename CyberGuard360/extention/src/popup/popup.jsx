// Main popup UI using React
const { useState, useEffect } = React;

function CyberGuardPopup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('scan');
  const [scanResults, setScanResults] = useState(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [communityReports, setCommunityReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication status
    chrome.storage.local.get(['authToken'], (result) => {
      setIsAuthenticated(!!result.authToken);
    });

    // Load initial scan results if available
    chrome.storage.local.get(['lastScan'], (result) => {
      if (result.lastScan) {
        setScanResults(result.lastScan.vulnerabilities);
        setSecurityScore(result.lastScan.securityScore);
      }
    });
  }, []);

  const handleScan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to analyze page
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'analyze' });
      
      // Process results
      setScanResults(response.vulnerabilities);
      setSecurityScore(response.securityScore);
      
      // Store results for persistence
      chrome.storage.local.set({ lastScan: response });
    } catch (err) {
      setError('Failed to scan page. Please refresh and try again.');
      console.error('Scan error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    // Implement login logic
    // Store token in chrome.storage.local
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['authToken']);
    setIsAuthenticated(false);
  };

  const handleReportSubmit = (url, details) => {
    // Submit community report
    // Update communityReports state
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">CyberGuard360</h1>
        {isAuthenticated ? (
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        ) : null}
      </header>

      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          <nav className="flex border-b">
            <button
              className={`px-4 py-2 ${currentTab === 'scan' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setCurrentTab('scan')}
            >
              Scan
            </button>
            <button
              className={`px-4 py-2 ${currentTab === 'community' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setCurrentTab('community')}
            >
              Community
            </button>
            <button
              className={`px-4 py-2 ${currentTab === 'history' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setCurrentTab('history')}
            >
              History
            </button>
          </nav>

          <div className="tab-content">
            {currentTab === 'scan' && (
              <ScanTab 
                onScan={handleScan} 
                results={scanResults} 
                score={securityScore} 
                isLoading={isLoading}
                error={error}
              />
            )}
            {currentTab === 'community' && (
              <CommunityTab 
                reports={communityReports} 
                onSubmitReport={handleReportSubmit} 
              />
            )}
            {currentTab === 'history' && (
              <HistoryTab />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Additional components (ScanTab, CommunityTab, HistoryTab, LoginForm) would be defined here

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CyberGuardPopup />);