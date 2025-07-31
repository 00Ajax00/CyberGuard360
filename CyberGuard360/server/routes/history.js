import express from 'express';
import ScanResult from '../models/ScanResult.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Get user's scan history
router.get('/', authenticate, async (req, res) => {
  try {
    const history = await ScanResult.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-__v -userId');

    res.json(history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

// Get specific scan result
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await ScanResult.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('-__v -userId');

    if (!result) {
      return res.status(404).json({ error: 'Scan result not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch scan result:', error);
    res.status(500).json({ error: 'Failed to fetch scan result' });
  }
});

export default router;