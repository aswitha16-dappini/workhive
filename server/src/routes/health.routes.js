import express from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = express.Router();

// GET /api/health
router.get('/', checkHealth);

export default router;

