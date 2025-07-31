import axios from 'axios';

export const getCVEInfo = async (cveId) => {
  try {
    const response = await axios.get(`https://services.nvd.nist.gov/rest/json/cve/1.0/${cveId}`);
    return response.data.result;
  } catch (error) {
    console.error(`Failed to fetch CVE ${cveId}:`, error);
    return null;
  }
};