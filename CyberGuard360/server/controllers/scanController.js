import { performScan } from '../services/scanService.js';
import ScanResult from '../models/ScanResult.js';

export const scanWebsite = async (req, res) => {
  try {
    const { url, scripts, forms, links, userBehavior } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Perform the scan
    const scanData = { url, scripts, forms, links, userBehavior };
    const result = await performScan(userId, scanData);

    res.json(result);
  } catch (error) {
    console.error('Scan controller error:', error);
    res.status(500).json({ error: 'Failed to perform scan' });
  }
};

export const getScanHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await ScanResult.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-__v -_id -userId');

    res.json(history);
  } catch (error) {
    console.error('History controller error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};