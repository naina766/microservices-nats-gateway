import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { registerUserSchema, loginUserSchema } from '../validators/user.validator';

const router = Router();

router.post('/register', validateRequest(registerUserSchema), userController.register);
router.post('/login', validateRequest(loginUserSchema), userController.login);
router.get('/profile', userController.getProfile);
router.get('/:id', userController.getUserById);

export default router;
