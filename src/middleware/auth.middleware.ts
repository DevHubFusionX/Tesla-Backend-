import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/db';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Define a local custom Request type that has the user context attached
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware that verifies JWT and fetches user information.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError('User belonging to this session does not exist.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware that locks endpoints to specific roles.
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to perform this action.');
    }
    next();
  };
};

/**
 * Authorization middleware to check if the user's KYC profile is APPROVED.
 */
export const requireKyc = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    const kyc = await prisma.kycProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!kyc || kyc.status !== 'APPROVED') {
      throw new ForbiddenError('KYC approval is required to perform this action.');
    }

    next();
  } catch (error) {
    next(error);
  }
};
