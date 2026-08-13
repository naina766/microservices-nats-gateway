import cors, { CorsOptions } from 'cors';
import { config } from '../config/index';

export const configureCors = () => {
  const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim());

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching allowed list
      if (!origin || config.corsOrigin === '*' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-internal-secret'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  };

  return cors(corsOptions);
};
