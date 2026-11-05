import express from 'express';
import {
  createProfile,
  getMyProfile,
  updateProfile,
  getPublicProfile,
  getAllProfiles,
} from '../controllers/freelancerProfile.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Specific routes MUST be declared before parameterized /:id route
router.get('/me', protect, getMyProfile);
router.post('/', protect, authorize('Freelancer'), createProfile);
router.put('/me', protect, authorize('Freelancer'), updateProfile);

// Public directory & parameterized routes
router.get('/', getAllProfiles);
router.get('/:id', getPublicProfile);

export default router;
