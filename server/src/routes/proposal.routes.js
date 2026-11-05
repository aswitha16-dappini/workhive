import express from 'express';
import {
  submitProposal,
  getProjectProposals,
  getMyProposals,
  getClientProposals,
  acceptProposal,
  rejectProposal,
} from '../controllers/proposal.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes
router.post('/', protect, authorize('Freelancer'), submitProposal);
router.get('/my', protect, authorize('Freelancer'), getMyProposals);
router.get('/client', protect, authorize('Client'), getClientProposals);
router.get('/project/:projectId', protect, getProjectProposals);

// Client review actions
router.patch('/:id/accept', protect, authorize('Client'), acceptProposal);
router.patch('/:id/reject', protect, authorize('Client'), rejectProposal);

export default router;

