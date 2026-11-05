import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected routes (requires valid JWT token)
router.get('/me', protect, getMe);

// Role-protected test routes (demonstrating role-based authorization)
router.get('/client-only', protect, authorize('Client'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Hello Client ${req.user.name}, you have accessed a Client-restricted endpoint.`,
    user: req.user,
  });
});

router.get('/freelancer-only', protect, authorize('Freelancer'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Hello Freelancer ${req.user.name}, you have accessed a Freelancer-restricted endpoint.`,
    user: req.user,
  });
});

export default router;

