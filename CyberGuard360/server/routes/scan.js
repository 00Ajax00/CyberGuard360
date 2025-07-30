import express from 'express';
import { scanWebsite, getScanHistory } from '../controllers/scanController.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Protected routes
router.post('/', authenticate, scanWebsite);
router.get('/history', authenticate, getScanHistory);

export default router;