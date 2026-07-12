// backend/src/shared/middleware/authenticate.js
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from './error.handler.js';
import { prisma } from '../database/prisma.js';

export const authenticate = async (req, res, next) => {
  // Skip authentication for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401, 'AUTH_005');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Verify user still exists and is active in the database
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id, deletedAt: null } 
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User account is inactive or no longer exists.', 401, 'AUTH_006');
    }

    // Attach user data to request object for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired.', 401, 'AUTH_007'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token.', 401, 'AUTH_008'));
    }
    next(error);
  }
};
