import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { config } from '../config/index';

export const configureSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: true,
    hsts: true,
    frameguard: { action: 'deny' },
    noSniff: true,
  });
};

export const configureCors = () => {
  const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || config.corsOrigin === '*' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };

  return cors(corsOptions);
};
