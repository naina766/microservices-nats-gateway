import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

