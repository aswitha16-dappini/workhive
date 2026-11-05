import express from 'express';
import { getPlatformStats } from '../controllers/stats.controller.js';

const router = express.Router();

// GET /api/stats - Public endpoint for live metrics
router.get('/', getPlatformStats);

export default router;

