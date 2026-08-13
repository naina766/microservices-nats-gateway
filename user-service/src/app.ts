import express, { Application } from 'express';
import morgan from 'morgan';
import { config } from './config/index';
import { natsPublisher } from './events/nats.publisher';
import { prisma } from './repositories/user.repository';
import { configureSecurityHeaders, configureCors } from './middlewares/security.middleware';
import { sanitizeInput } from './middlewares/sanitizer.middleware';
import { internalGuard } from './middlewares/internalGuard.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';

const app: Application = express();

app.disable('x-powered-by');

// Security & Core Middlewares
app.use(configureSecurityHeaders());
app.use(configureCors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Input Sanitization
app.use(sanitizeInput);

// Unprotected Health Check Routes
app.use('/', healthRoutes);

// Internal Access Security Guard for API Routes
app.use(internalGuard);

// Protected Internal Microservice Routes
app.use('/api/v1/users', userRoutes);


// Centralized Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // Initialize NATS Publisher Connection & Ensure Stream
    await natsPublisher.connect();

    const server = app.listen(config.port, () => {
      console.log(`[User Service] Server running on port ${config.port} (${config.nodeEnv})`);
    });

    // Graceful Shutdown Hook
    const gracefulShutdown = async (signal: string) => {
      console.log(`[User Service] Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        console.log('[User Service] HTTP server closed.');
      });

      try {
        await natsPublisher.disconnect();
        await prisma.$disconnect();
        console.log('[User Service] Prisma database connection closed.');
        console.log('[User Service] Shutdown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('[User Service] Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[User Service] Startup failure:', error);
    process.exit(1);
  }
};

startServer();

export default app;
