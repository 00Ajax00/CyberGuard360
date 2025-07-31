// Security recommendations mapping
const RECOMMENDATIONS = {
  // Outdated library recommendations
  'OutdatedLibrary': {
    high: 'Immediately update this library to the latest secure version',
    medium: 'Update this library at your earliest convenience',
    low: 'Consider updating this library during next maintenance'
  },

  // XSS recommendations
  'XSS': {
    high: 'Sanitize all user inputs and implement Content Security Policy (CSP)',
    medium: 'Escape dynamic content and validate inputs',
    low: 'Review potential XSS vectors'
  },

  // CSRF recommendations
  'CSRF': {
    high: 'Implement CSRF tokens and same-site cookies',
    medium: 'Add CSRF protection to sensitive forms',
    low: 'Review form submission security'
  },

  // Phishing recommendations
  'PhishingRisk': {
    high: 'Avoid entering credentials on this page',
    medium: 'Verify the site authenticity before proceeding',
    low: 'Be cautious with links on this page'
  },

  // General fallback
  'default': {
    high: 'This poses significant security risk - proceed with caution',
    medium: 'This requires security attention',
    low: 'Consider security improvements'
  }
};

export function getSecurityRecommendations(vulnerabilities) {
  const recommendations = new Set();
  const seenTypes = new Set();

  vulnerabilities.forEach(vuln => {
    const type = vuln.type || 'default';
    const severity = vuln.severity || 'medium';
    
    if (!seenTypes.has(type)) {
      const recommendation = RECOMMENDATIONS[type]?.[severity] || 
                           RECOMMENDATIONS.default[severity];
      
      if (recommendation) {
        recommendations.add(recommendation);
        seenTypes.add(type);
      }
    }
  });

  // Add general recommendations based on vulnerability count
  if (vulnerabilities.length > 5) {
    recommendations.add('This site has multiple security issues - consider using enhanced protection');
  }

  return Array.from(recommendations).slice(0, 3); // Return top 3 recommendations
}