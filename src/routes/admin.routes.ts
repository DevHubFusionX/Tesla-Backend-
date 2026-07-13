import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { cacheResponse } from '../middleware/cache.middleware';
import {
  adminUserIdParamSchema,
  updateUserSchema,
  reviewTransactionSchema,
  adjustBalanceSchema,
  getTransactionsQuerySchema,
  getKycQuerySchema,
  createInvestmentPlanSchema,
  updateInvestmentPlanSchema,
  adminPlanIdParamSchema
} from '../validations/admin.validation';

const router: Router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate as any);
router.use(requireRole(['ADMIN']) as any);

// ── User Management ──────────────────────────────────────────────
router.get('/users', AdminController.getUsers as any);
router.get('/users/:userId', validateRequest(adminUserIdParamSchema), AdminController.getUserById as any);
router.patch('/users/:userId', validateRequest(updateUserSchema), AdminController.updateUser as any);
router.get('/users/:userId/investments', validateRequest(adminUserIdParamSchema), AdminController.getUserInvestments as any);
router.get('/users/:userId/transactions', validateRequest(adminUserIdParamSchema), AdminController.getUserTransactions as any);
router.post('/users/:userId/adjust-balance', validateRequest(adjustBalanceSchema), AdminController.adjustUserBalance as any);

// ── Transaction Management ───────────────────────────────────────
router.get('/transactions', validateRequest(getTransactionsQuerySchema), AdminController.getTransactions as any);
router.patch('/transactions/:transactionId/review', validateRequest(reviewTransactionSchema), AdminController.reviewTransaction as any);

// ── KYC Auditing ─────────────────────────────────────────────────
router.get('/kyc', validateRequest(getKycQuerySchema), AdminController.getKycProfiles as any);

// ── Investment Plan CRUD ─────────────────────────────────────────
router.get('/plans', AdminController.getInvestmentPlans as any);
router.post('/plans', validateRequest(createInvestmentPlanSchema), AdminController.createInvestmentPlan as any);
router.put('/plans/:planId', validateRequest(updateInvestmentPlanSchema), AdminController.updateInvestmentPlan as any);
router.delete('/plans/:planId', validateRequest(adminPlanIdParamSchema), AdminController.deleteInvestmentPlan as any);

// ── Analytics ────────────────────────────────────────────────────
router.get('/analytics/overview', cacheResponse(120), AdminController.getOverview as any);
router.get('/analytics/investments', cacheResponse(120), AdminController.getInvestmentAnalytics as any);
router.get('/analytics/transactions', cacheResponse(120), AdminController.getTransactionAnalytics as any);

export default router;
