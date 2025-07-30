import ScanResult from '../models/ScanResult.js';
import { analyzeScripts } from './scriptAnalysis.js';
import { analyzeBehavior } from './behaviorAnalysis.js';
import { checkDomainReputation } from './reputationService.js';
import { getSecurityRecommendations } from './recommendationService.js';

export const performScan = async (userId, scanData) => {
  try {
    // 1. Analyze scripts for vulnerabilities
    const scriptAnalysis = await analyzeScripts(scanData.scripts);
    
    // 2. Analyze forms and links for potential threats
    const behaviorAnalysis = analyzeBehavior(scanData.forms, scanData.links);
    
    // 3. Check domain reputation (external API)
    const domainReputation = await checkDomainReputation(scanData.url);
    
    // 4. Combine all vulnerabilities
    const allVulnerabilities = [
      ...scriptAnalysis,
      ...behaviorAnalysis,
      ...domainReputation.issues
    ];
    
    // 5. Calculate security score (100 is perfect)
    const baseScore = 100;
    let scoreDeduction = 0;
    
    allVulnerabilities.forEach(vuln => {
      if (vuln.severity === 'high') scoreDeduction += 10;
      else if (vuln.severity === 'medium') scoreDeduction += 5;
      else scoreDeduction += 2;
    });
    
    // Deduct for suspicious behavior
    const behaviorScore = analyzeBehavior(scanData.userBehavior);
    scoreDeduction += behaviorScore.deduction;
    
    const finalScore = Math.max(0, baseScore - scoreDeduction);
    
    // 6. Get recommendations
    const recommendations = getSecurityRecommendations(allVulnerabilities, behaviorScore);
    
    // 7. Save scan results
    const scanResult = new ScanResult({
      userId,
      url: scanData.url,
      vulnerabilities: allVulnerabilities,
      userBehavior: scanData.userBehavior,
      securityScore: finalScore
    });
    
    await scanResult.save();
    
    return {
      vulnerabilities: allVulnerabilities,
      securityScore: finalScore,
      recommendations
    };
  } catch (error) {
    console.error('Scan failed:', error);
    throw new Error('Failed to complete scan');
  }
};