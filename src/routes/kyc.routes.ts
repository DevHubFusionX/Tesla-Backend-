import { Router } from 'express';
import { KycController } from '../controllers/kyc.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { submitKycSchema, reviewKycSchema } from '../validations/kyc.validation';

const router: Router = Router();

// User routes
router.use(authenticate as any);

router.post('/submit', validateRequest(submitKycSchema), KycController.submit);
router.get('/status', KycController.getStatus);

// Admin-only review route
router.patch('/review/:userId', requireRole(['ADMIN']) as any, validateRequest(reviewKycSchema), KycController.review);

export default router;
