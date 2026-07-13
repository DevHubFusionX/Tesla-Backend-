import { Router } from 'express';
import { InvestmentController } from '../controllers/investment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { purchaseLimiter } from '../middleware/rateLimit.middleware';
import { cacheResponse } from '../middleware/cache.middleware';
import {
  purchaseInvestmentSchema,
  withdrawInvestmentSchema,
  planIdParamSchema,
  investmentIdParamSchema,
  createPlanSchema,
  updatePlanSchema,
} from '../validations/investment.validation';

const router: Router = Router();

// All investment routes require authentication
router.use(authenticate as any);

// ── Plan routes (publicly available to all authenticated users) ──
router.get('/plans', cacheResponse(300), InvestmentController.getPlans);
router.get('/plans/:planId', validateRequest(planIdParamSchema), InvestmentController.getPlanById);

// ── Portfolio routes ─────────────────────────────────────────────
router.get('/portfolio/summary', InvestmentController.getPortfolioSummary as any);
router.get('/portfolio', InvestmentController.getPortfolio as any);
router.get('/:investmentId', validateRequest(investmentIdParamSchema), InvestmentController.getInvestmentById as any);

// ── Action routes ────────────────────────────────────────────────
router.post(
  '/purchase',
  purchaseLimiter,
  validateRequest(purchaseInvestmentSchema),
  InvestmentController.purchase as any
);
router.post(
  '/withdraw/:investmentId',
  validateRequest(withdrawInvestmentSchema),
  InvestmentController.withdraw as any
);

// ── Admin-only plan management ───────────────────────────────────
router.post('/plans', requireRole(['ADMIN']) as any, validateRequest(createPlanSchema), InvestmentController.createPlan as any);
router.patch('/plans/:planId', requireRole(['ADMIN']) as any, validateRequest(updatePlanSchema), InvestmentController.updatePlan as any);
router.patch('/plans/:planId/toggle', requireRole(['ADMIN']) as any, validateRequest(planIdParamSchema), InvestmentController.togglePlan as any);
router.delete('/plans/:planId', requireRole(['ADMIN']) as any, validateRequest(planIdParamSchema), InvestmentController.deletePlan as any);

export default router;
