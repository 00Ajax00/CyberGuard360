import express from 'express';
import { performScan } from '../services/scanService.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Perform a new scan
router.post('/', authenticate, async (req, res) => {
  try {
    const { url, scripts, forms, links, userBehavior } = req.body;
    const userId = req.user.id;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await performScan(userId, { url, scripts, forms, links, userBehavior });
    res.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to perform scan' });
  }
});

export default router;