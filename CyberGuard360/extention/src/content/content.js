// Content script for analyzing web pages
import { analyzeScripts } from './scripts.js';
import { analyzeForms } from './forms.js';
import { analyzeLinks } from './links.js';
import { sendAnalysisResults } from './communication.js';

class PageAnalyzer {
  constructor() {
    this.scripts = [];
    this.forms = [];
    this.links = [];
    this.userBehavior = {
      formSubmissions: 0,
      linkClicks: 0,
      redirects: 0
    };
  }

  async analyzePage() {
    try {
      this.scripts = analyzeScripts();
      this.forms = analyzeForms();
      this.links = analyzeLinks();
      
      this.setupBehaviorTracking();
      
      const results = {
        url: window.location.href,
        scripts: this.scripts,
        forms: this.forms,
        links: this.links,
        initialBehavior: this.userBehavior
      };
      
      await sendAnalysisResults(results);
    } catch (error) {
      console.error('Page analysis failed:', error);
    }
  }

  setupBehaviorTracking() {
    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.userBehavior.formSubmissions++;
    });

    // Track link clicks
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        this.userBehavior.linkClicks++;
      }
    });

    // Track redirects (requires background script coordination)
    window.addEventListener('beforeunload', () => {
      this.userBehavior.redirects++;
    });
  }
}

// Initialize analyzer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PageAnalyzer().analyzePage());
} else {
  new PageAnalyzer().analyzePage();
}