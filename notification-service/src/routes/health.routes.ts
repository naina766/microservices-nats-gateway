import { Router, Request, Response } from 'express';
import { natsClient } from '../events/nats.client';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const isNatsConnected = natsClient.nc ? !natsClient.nc.isClosed() : false;

  if (isNatsConnected) {
    res.status(200).json({
      status: 'UP',
      service: 'notification-service',
      nats: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(500).json({
      status: 'DOWN',
      service: 'notification-service',
      nats: 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
