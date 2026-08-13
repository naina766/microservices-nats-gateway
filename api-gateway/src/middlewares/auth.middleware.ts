import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export const authenticateJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Strip untrusted incoming user identity headers to prevent header spoofing attacks
  delete req.headers['x-user-id'];
  delete req.headers['x-user-email'];

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token missing or invalid format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as {
      id: string;
      email: string;
    };
    req.user = decoded;

    // Attach verified user info to headers when proxying downstream
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-email'] = decoded.email;

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or expired access token',
    });
    return;
  }
};

