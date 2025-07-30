function ScanTab({ onScan, results, score, isLoading, error }) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Get current tab URL when component mounts
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentUrl(new URL(tabs[0].url).hostname);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Current Site: {currentUrl}</h2>
        <button
          onClick={onScan}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {score > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Security Score</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <span className="ml-2 font-bold">{score}/100</span>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Vulnerabilities Found</h3>
          <div className="space-y-3">
            {results.map((vuln, index) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <span className={`font-medium ${vuln.severity === 'high' ? 'text-red-600' : vuln.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {vuln.type}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-sm mt-1">{vuln.description}</p>
                {vuln.cveId && (
                  <a 
                    href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View CVE details
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Scan Results</h3>
          <p className="text-green-600">No vulnerabilities detected!</p>
        </div>
      )}
    </div>
  );
}