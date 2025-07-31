import { analyzeScripts } from './scriptAnalysis.js';
import { analyzeBehavior } from './behaviorAnalysis.js';
import { checkDomainReputation } from './reputationService.js';
import { getSecurityRecommendations } from './recommendationService.js';
import ScanResult from '../models/ScanResult.js';

export const performScan = async (userId, scanData) => {
  try {
    const { url, scripts, forms, links, userBehavior } = scanData;

    // 1. Script analysis
    const scriptVulnerabilities = await analyzeScripts(scripts);

    // 2. Behavior analysis
    const behaviorAnalysis = analyzeBehavior(forms, links);

    // 3. Domain reputation
    const domainReputation = await checkDomainReputation(url);

    // Combine all vulnerabilities
    const allVulnerabilities = [
      ...scriptVulnerabilities,
      ...behaviorAnalysis,
      ...domainReputation.issues
    ];

    // Calculate security score
    const score = calculateSecurityScore(allVulnerabilities, userBehavior);

    // Get recommendations
    const recommendations = getSecurityRecommendations(allVulnerabilities);

    // Save results
    const scanResult = new ScanResult({
      userId,
      url,
      vulnerabilities: allVulnerabilities,
      userBehavior,
      securityScore: score
    });

    await scanResult.save();

    return {
      vulnerabilities: allVulnerabilities,
      securityScore: score,
      recommendations
    };
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
};

function calculateSecurityScore(vulnerabilities, behavior) {
  let score = 100;
  
  // Deduct for vulnerabilities
  vulnerabilities.forEach(vuln => {
    if (vuln.severity === 'high') score -= 10;
    else if (vuln.severity === 'medium') score -= 5;
    else score -= 2;
  });

  // Deduct for suspicious behavior
  if (behavior.formSubmissions > 3) score -= 5;
  if (behavior.linkClicks > 10) score -= 3;
  if (behavior.redirects > 2) score -= 8;

  return Math.max(0, score);
}