// Script analysis using Retire.js
export function analyzeScripts() {
  const vulnerabilities = [];
  const scripts = Array.from(document.scripts);

  // Check for outdated libraries
  scripts.forEach(script => {
    if (script.src) {
      // Example: Check for jQuery vulnerabilities
      if (script.src.includes('jquery')) {
        const version = script.src.match(/jquery-(\d+\.\d+\.\d+)\.js/)?.[1];
        if (version && isVulnerableJQuery(version)) {
          vulnerabilities.push({
            type: 'OutdatedLibrary',
            description: `Vulnerable jQuery version detected (${version})`,
            severity: 'high',
            source: 'Retire.js'
          });
        }
      }
    }

    // Check for inline scripts with dangerous patterns
    if (!script.src && script.textContent) {
      if (containsDangerousPatterns(script.textContent)) {
        vulnerabilities.push({
          type: 'XSS',
          description: 'Potential XSS vulnerability in inline script',
          severity: 'high',
          source: 'Heuristic'
        });
      }
    }
  });

  return vulnerabilities;
}

function isVulnerableJQuery(version) {
  // Simplified check - in real implementation use Retire.js database
  const vulnerableVersions = ['1.4.0', '1.4.1', '1.4.2', '2.2.0', '3.0.0'];
  return vulnerableVersions.includes(version);
}

function containsDangerousPatterns(code) {
  const dangerousPatterns = [
    /\.innerHTML\s*=/,
    /\.outerHTML\s*=/,
    /document\.write\s*\(/,
    /eval\s*\(/,
    /new Function\s*\(/
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(code));
}