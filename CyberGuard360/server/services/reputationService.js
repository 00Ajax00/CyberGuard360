import axios from 'axios';

export const checkDomainReputation = async (url) => {
  try {
    const domain = new URL(url).hostname;
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          'x-apikey': process.env.VIRUSTOTAL_API_KEY
        }
      }
    );

    return {
      safe: response.data.data.attributes.last_analysis_stats.malicious === 0,
      issues: response.data.data.attributes.last_analysis_results
    };
  } catch (error) {
    console.error('VirusTotal check failed:', error);
    return {
      safe: false,
      issues: []
    };
  }
};