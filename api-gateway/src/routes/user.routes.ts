import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/index';
import { authenticateJwt, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { getInternalHeaders } from '../middlewares/internalSignature.middleware';

const router = Router();

// -----------------------------------------------------------------------------
// POST /api/v1/users/register (Public - Auth Rate-limited & Validated)
// -----------------------------------------------------------------------------
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await axios.post(
        `${config.userServiceUrl}/api/v1/users/register`,
        req.body,
        { headers: getInternalHeaders() }
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        next(error);
      }
    }
  }
);

// -----------------------------------------------------------------------------
// POST /api/v1/users/login (Public - Auth Rate-limited & Validated)
// -----------------------------------------------------------------------------
router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await axios.post(
        `${config.userServiceUrl}/api/v1/users/login`,
        req.body,
        { headers: getInternalHeaders() }
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        next(error);
      }
    }
  }
);

// -----------------------------------------------------------------------------
// GET /api/v1/users/profile (Protected by JWT)
// -----------------------------------------------------------------------------
router.get(
  '/profile',
  authenticateJwt,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await axios.get(`${config.userServiceUrl}/api/v1/users/profile`, {
        headers: getInternalHeaders({
          'x-user-id': req.user?.id,
          'x-user-email': req.user?.email,
          authorization: req.headers.authorization,
        }),
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        next(error);
      }
    }
  }
);

// -----------------------------------------------------------------------------
// GET /api/v1/users/:id (Protected by JWT)
// -----------------------------------------------------------------------------
router.get(
  '/:id',
  authenticateJwt,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await axios.get(`${config.userServiceUrl}/api/v1/users/${req.params.id}`, {
        headers: getInternalHeaders({
          authorization: req.headers.authorization,
        }),
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        next(error);
      }
    }
  }
);

export default router;

