import { Router } from 'express';
import authRoutes from './auth.routes';
import investmentRoutes from './investment.routes';
import transactionRoutes from './transaction.routes';
import adminRoutes from './admin.routes';
import syncRoutes from './sync.routes';
import kycRoutes from './kyc.routes';
import paymentMethodRoutes from './paymentMethod.routes';
import notificationRoutes from './notification.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/investments', investmentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);
router.use('/sync', syncRoutes);
router.use('/kyc', kycRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/notifications', notificationRoutes);

export default router;
