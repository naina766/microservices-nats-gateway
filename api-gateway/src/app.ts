import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index';
import { configureCors } from './middlewares/cors.middleware';
import { sanitizeInput } from './middlewares/sanitizer.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';

const app: Application = express();

// Disable Express signature header
app.disable('x-powered-by');

// Advanced Security & Core Middlewares (Configured for Swagger UI compatibility)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  })
);
app.use(configureCors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Input Sanitization
app.use(sanitizeInput);

// Global Rate Limiter
app.use(globalRateLimiter);

// Raw OpenAPI / Swagger JSON Specification
app.get('/docs/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerSpec);
});

// Interactive OpenAPI / Swagger Documentation UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route Bindings
app.use('/', healthRoutes);
app.use('/api/v1/users', userRoutes);

// Centralized Error Handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[API Gateway] Server running on port ${config.port} (${config.nodeEnv})`);
});

// Graceful Shutdown Hook
const gracefulShutdown = (signal: string) => {
  console.log(`[API Gateway] Received ${signal}. Draining HTTP server connection...`);
  server.close(() => {
    console.log('[API Gateway] HTTP server closed gracefully. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[API Gateway] Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
