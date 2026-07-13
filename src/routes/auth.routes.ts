import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthExtensionController } from '../controllers/authExtension.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.middleware';
import { registerSchema, loginSchema, updateMeSchema } from '../validations/auth.validation';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/authExtension.validation';

const router: Router = Router();

// Core authentication routes
router.post('/register', registerLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);

// Recovery and Verification routes
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthExtensionController.requestReset);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthExtensionController.resetPassword);
router.get('/verify-email', validateRequest(verifyEmailSchema), AuthExtensionController.verifyEmail);
router.post('/verify-email/request', authenticate as any, AuthExtensionController.sendVerification);

// Protected profile routes
router.get('/me', authenticate as any, AuthController.getMe as any);
router.patch('/me', authenticate as any, validateRequest(updateMeSchema), AuthController.updateMe as any);
router.post('/logout', authenticate as any, AuthController.logout as any);

export default router;
