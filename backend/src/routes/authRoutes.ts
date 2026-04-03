import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getMe.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));
router.put('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;
