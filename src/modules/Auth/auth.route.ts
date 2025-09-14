import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// public
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/request-reset', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// profile
router.get('/me', authMiddleware, AuthController.me);

// logout - revoke refresh token
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
