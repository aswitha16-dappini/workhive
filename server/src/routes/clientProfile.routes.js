import express from 'express';
import {
  getMyClientProfile,
  updateClientProfile,
  getPublicClientProfile,
} from '../controllers/clientProfile.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Private client routes
router.get('/me', protect, authorize('Client'), getMyClientProfile);
router.put('/me', protect, authorize('Client'), updateClientProfile);

// Public client profile
router.get('/:id', getPublicClientProfile);

export default router;

