import express from 'express';
import {
  getProjects,
  getProjectById,
  getMyClientProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected routes (Client only)
router.get('/my/client', protect, authorize('Client'), getMyClientProjects);
router.post('/', protect, authorize('Client'), createProject);
router.put('/:id', protect, authorize('Client'), updateProject);
router.delete('/:id', protect, authorize('Client'), deleteProject);

export default router;

