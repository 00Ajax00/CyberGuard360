// Form analysis for security vulnerabilities
export function analyzeForms() {
  const vulnerabilities = [];
  const forms = Array.from(document.forms);

  forms.forEach(form => {
    const formIssues = [];
    
    // Check for missing CSRF protection
    if (!hasCSRFToken(form)) {
      formIssues.push({
        type: 'CSRF',
        description: 'Form missing CSRF protection',
        severity: 'high'
      });
    }

    // Check for password fields without proper attributes
    const passwordFields = form.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
      if (!field.autocomplete || field.autocomplete === 'off') {
        formIssues.push({
          type: 'InsecureForm',
          description: 'Password field without autocomplete protection',
          severity: 'medium'
        });
      }
    });

    // Check for HTTP action
    if (form.action && form.action.startsWith('http://')) {
      formIssues.push({
        type: 'InsecureForm',
        description: 'Form submits over insecure HTTP',
        severity: 'high'
      });
    }

    if (formIssues.length > 0) {
      vulnerabilities.push({
        formId: form.id || 'anonymous-form',
        formAction: form.action || 'current-url',
        issues: formIssues
      });
    }
  });

  return vulnerabilities;
}

function hasCSRFToken(form) {
  // Check for hidden CSRF token field
  const tokenFields = form.querySelectorAll('input[type="hidden"][name*="token"], input[type="hidden"][name*="csrf"]');
  if (tokenFields.length > 0) return true;

  // Check for meta tag
  const metaTags = document.head.querySelectorAll('meta[name="csrf-token"], meta[name="csrf"]');
  if (metaTags.length > 0) return true;

  return false;
}
