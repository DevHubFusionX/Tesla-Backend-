import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethod.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  linkPaymentMethodSchema,
  paymentMethodIdParamSchema,
} from '../validations/paymentMethod.validation';

const router: Router = Router();

router.use(authenticate as any);

router.post('/', validateRequest(linkPaymentMethodSchema), PaymentMethodController.link);
router.get('/', PaymentMethodController.list);
router.delete('/:id', validateRequest(paymentMethodIdParamSchema), PaymentMethodController.delete);
router.patch('/:id/default', validateRequest(paymentMethodIdParamSchema), PaymentMethodController.setDefault);

export default router;
