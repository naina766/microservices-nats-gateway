import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-production-change-me',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  internalApiSecret: process.env.INTERNAL_API_SECRET || 'super-secret-internal-gateway-token',
  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  authRateLimitMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
};

