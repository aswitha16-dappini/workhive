import { getDatabaseStatus } from '../config/db.js';

/**
 * Health check controller
 * Returns backend service status and MongoDB connection state
 * NOTE: Credentials / passwords are NEVER exposed in this endpoint.
 */
export const checkHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    message: 'WorkHive Backend API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.status,
      connected: dbStatus.isConnected,
      database: dbStatus.databaseName || 'workhive',
      cluster: 'WorkHiveCluster',
      host: dbStatus.host || 'Not connected yet',
      connectionConfig: dbStatus.maskedUri, // Masked (password hidden)
    },
  });
};
