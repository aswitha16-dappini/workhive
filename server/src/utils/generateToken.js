import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token containing user id and role
 * @param {string} id - User ObjectId
 * @param {string} role - User role (Client or Freelancer)
 * @returns {string} - Signed JWT token
 */
export const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'workhive_default_jwt_secret_development_key';
  return jwt.sign({ id, role }, secret, {
    expiresIn: '7d', // 7 days expiration
  });
};

