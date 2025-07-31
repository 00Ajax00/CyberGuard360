import Retire from 'retire';
import { getCVEInfo } from './cveService.js';

export const analyzeScripts = async (scripts) => {
  const vulnerabilities = [];
  const retire = new Retire();

  // Analyze using Retire.js
  scripts.forEach(script => {
    const results = retire.analyze(script);
    if (results.vulnerabilities) {
      vulnerabilities.push(...results.vulnerabilities);
    }
  });

  // Enhance with CVE data
  for (const vuln of vulnerabilities) {
    if (vuln.identifiers && vuln.identifiers.CVE) {
      vuln.cveInfo = await getCVEInfo(vuln.identifiers.CVE);
    }
  }

  return vulnerabilities;
};

export const containsDangerousPatterns = (code) => {
  const dangerousPatterns = [
    /\.innerHTML\s*=/,
    /\.outerHTML\s*=/,
    /document\.write\s*\(/,
    /eval\s*\(/,
    /new Function\s*\(/
  ];
  return dangerousPatterns.some(pattern => pattern.test(code));
};