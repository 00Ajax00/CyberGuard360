import express from 'express';
import CommunityReport from '../models/CommunityReport.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Submit a community report
router.post('/', async (req, res) => {
  try {
    const { url, reportDetails } = req.body;

    // Validate input
    if (!url || !reportDetails) {
      return res.status(400).json({ error: 'URL and report details are required' });
    }

    // Create anonymous ID (hash of IP + timestamp)
    const anonymousId = require('crypto')
      .createHash('sha256')
      .update((req.ip || '') + Date.now())
      .digest('hex');

    const newReport = new CommunityReport({
      url,
      reportDetails,
      anonymousId
    });

    await newReport.save();

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get recent community reports
router.get('/', async (req, res) => {
  try {
    const reports = await CommunityReport.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-__v -_id');

    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;