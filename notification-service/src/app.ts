import express, { Application } from 'express';
import morgan from 'morgan';
import { config } from './config/index';
import { configureSecurityHeaders, configureCors } from './middlewares/security.middleware';
import { natsClient } from './events/nats.client';
import { userCreatedConsumer } from './events/userCreated.consumer';
import healthRoutes from './routes/health.routes';

const app: Application = express();

app.disable('x-powered-by');

// Security & Core Middlewares
app.use(configureSecurityHeaders());
app.use(configureCors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));

// Health Check Routes
app.use('/', healthRoutes);


const startServer = async () => {
  try {
    // 1. Connect to NATS JetStream
    await natsClient.connect();

    // 2. Start Durable JetStream Consumer
    await userCreatedConsumer.start();

    // 3. Start HTTP Server for Health Checking
    const server = app.listen(config.port, () => {
      console.log(`[Notification Service] Server running on port ${config.port} (${config.nodeEnv})`);
    });

    // Graceful Shutdown Hook
    const gracefulShutdown = async (signal: string) => {
      console.log(`[Notification Service] Received ${signal}. Starting graceful shutdown...`);

      userCreatedConsumer.stop();

      server.close(() => {
        console.log('[Notification Service] HTTP server closed.');
      });

      try {
        await natsClient.disconnect();
        console.log('[Notification Service] Graceful shutdown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('[Notification Service] Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Notification Service] Startup failure:', error);
    process.exit(1);
  }
};

startServer();

export default app;
