import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import freelancerProfileRoutes from './routes/freelancerProfile.routes.js';
import projectRoutes from './routes/project.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import milestoneRoutes from './routes/milestone.routes.js';
import statsRoutes from './routes/stats.routes.js';
import clientProfileRoutes from './routes/clientProfile.routes.js';

// Resolve directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env reliably
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;

// Connect to MongoDB Atlas (Mongoose handles operation buffering)
connectDB();

// CORS origin resolver supporting local dev, production frontend, and Vercel domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, mobile, or health-check requests with no origin
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WorkHive API – Freelancing & Project Collaboration Platform',
    healthCheck: '/api/health',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      projects: '/api/projects',
      health: '/api/health',
    },
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', freelancerProfileRoutes);
app.use('/api/freelancer-profile', freelancerProfileRoutes); // Alias for full clarity
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/client-profile', clientProfileRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WorkHive Server is running on http://localhost:${PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API available at: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Freelancer Profiles API: http://localhost:${PORT}/api/profiles`);
  console.log(`💼 Projects API available at: http://localhost:${PORT}/api/projects`);
});
