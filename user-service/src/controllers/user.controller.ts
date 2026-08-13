import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from '../services/user.service';

export class UserController {
  constructor(private service: UserService = userService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.loginUser(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User context missing' });
        return;
      }

      const user = await this.service.getUserById(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.service.getUserById(id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
