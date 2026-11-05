import express from 'express';
import {
  getProjectMilestones,
  createMilestone,
  fundMilestone,
  submitMilestoneWork,
  approveMilestone,
  getMyMilestones,
  getClientMilestones,
} from '../controllers/milestone.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/project/:projectId', protect, getProjectMilestones);
router.get('/my', protect, authorize('Freelancer'), getMyMilestones);
router.get('/client', protect, authorize('Client'), getClientMilestones);

router.post('/', protect, authorize('Client'), createMilestone);
router.patch('/:id/fund', protect, authorize('Client'), fundMilestone);
router.patch('/:id/submit', protect, authorize('Freelancer'), submitMilestoneWork);
router.patch('/:id/approve', protect, authorize('Client'), approveMilestone);

export default router;

