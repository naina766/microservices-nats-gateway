import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[API Gateway Error]:', err.stack || err.message || err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = `Downstream User Service is unreachable at ${config.userServiceUrl}. Please ensure User Service is running and configured correctly.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
