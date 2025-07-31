export const analyzeBehavior = (forms, links) => {
  const issues = [];
  
  forms.forEach(form => {
    if (form.action && form.action.startsWith('http://')) {
      issues.push({
        type: 'InsecureForm',
        description: 'Form submits over HTTP',
        severity: 'high'
      });
    }
  });

  const externalLinks = links.filter(link => 
    !link.href.startsWith(window.location.origin)
  );

  if (externalLinks.length > 5) {
    issues.push({
      type: 'PhishingRisk',
      description: 'High number of external links',
      severity: 'medium'
    });
  }

  return issues;
};