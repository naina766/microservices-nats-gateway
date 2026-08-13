import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index';

export const internalGuard = (req: Request, res: Response, next: NextFunction): void => {
  // Allow health check endpoint to bypass internal guard for docker healthchecks
  if (req.path === '/health' || req.path === '/') {
    next();
    return;
  }

  const internalSecret = req.headers['x-internal-secret'];

  if (!internalSecret || internalSecret !== config.internalApiSecret) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Direct internal service invocation unauthorized. Requests must be routed through API Gateway.',
    });
    return;
  }

  next();
};
