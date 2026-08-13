import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/userdb?schema=public',
  natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-production-change-me',
  internalApiSecret: process.env.INTERNAL_API_SECRET || 'super-secret-internal-gateway-token',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

