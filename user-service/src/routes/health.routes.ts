import { Router, Request, Response } from 'express';
import { prisma } from '../repositories/user.repository';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'UP',
      service: 'user-service',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'DOWN',
      service: 'user-service',
      database: 'DISCONNECTED',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
