import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { depositLimiter, withdrawLimiter } from '../middleware/rateLimit.middleware';
import {
  depositSchema,
  withdrawCashSchema,
  transactionIdParamSchema,
} from '../validations/transaction.validation';

const router: Router = Router();

// All transaction routes require authentication
router.use(authenticate as any);

router.get('/', TransactionController.getHistory as any);
router.get('/:transactionId', validateRequest(transactionIdParamSchema), TransactionController.getById as any);
router.post('/deposit', depositLimiter, validateRequest(depositSchema), TransactionController.deposit as any);
router.post('/withdraw', withdrawLimiter, validateRequest(withdrawCashSchema), TransactionController.withdraw as any);

export default router;
