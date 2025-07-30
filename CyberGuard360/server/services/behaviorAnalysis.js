// Analyze user behavior for potential threats
export function analyzeBehavior(forms, links) {
  const issues = [];
  
  // Check for suspicious forms
  forms.forEach(form => {
    if (form.action.includes('login') && !form.action.startsWith('https')) {
      issues.push({
        type: 'Phishing',
        description: 'Login form submitted over insecure connection',
        severity: 'high'
      });
    }
  });

  // Check for suspicious links
  const externalLinks = links.filter(link => {
    try {
      const url = new URL(link.href);
      return url.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  });

  if (externalLinks.length > 5) {
    issues.push({
      type: 'Phishing',
      description: 'High number of external links detected',
      severity: 'medium'
    });
  }

  return issues;
}

export function analyzeUserBehavior(behaviorData) {
  let deduction = 0;
  const flags = [];

  if (behaviorData.formSubmissions > 3) {
    deduction += 5;
    flags.push('Excessive form submissions');
  }

  if (behaviorData.linkClicks > 10) {
    deduction += 3;
    flags.push('Excessive link clicks');
  }

  if (behaviorData.redirects > 2) {
    deduction += 8;
    flags.push('Multiple redirects detected');
  }

  return { deduction, flags };
}