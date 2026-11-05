import express from 'express';
import {
  getProfiles,
  getMyProfile,
  getProfileByUserId,
  upsertProfile,
} from '../controllers/profile.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProfiles);
router.get('/user/:userId', getProfileByUserId);

// Protected routes
router.get('/me', protect, getMyProfile);
router.post('/', protect, authorize('Freelancer'), upsertProfile);

export default router;

