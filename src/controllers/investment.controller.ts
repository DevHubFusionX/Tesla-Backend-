import { Request, Response, RequestHandler } from 'express';
import { InvestmentService } from '../services/investment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import { invalidateCache } from '../middleware/cache.middleware';

export class InvestmentController {
  // ── Plans ──────────────────────────────────────────────────────

  static getPlans: RequestHandler = asyncHandler(async (_req: Request, res: Response) => {
    const plans = await InvestmentService.getAllPlans();
    sendSuccess(res, { plans });
  });

  static getPlanById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const plan = await InvestmentService.getPlanById(req.params.planId);
    sendSuccess(res, { plan });
  });

  static createPlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const plan = await InvestmentService.createPlan(req.body);
    invalidateCache('/api/v1/investments/plans');
    sendCreated(res, { plan }, 'Investment plan created.');
  });

  static updatePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const plan = await InvestmentService.updatePlan(req.params.planId, req.body);
    invalidateCache('/api/v1/investments/plans');
    sendSuccess(res, { plan }, 'Investment plan updated.');
  });

  static togglePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const plan = await InvestmentService.togglePlan(req.params.planId);
    invalidateCache('/api/v1/investments/plans');
    sendSuccess(res, { plan }, `Plan ${plan.active ? 'activated' : 'deactivated'}.`);
  });

  static deletePlan: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const plan = await InvestmentService.deletePlan(req.params.planId);
    invalidateCache('/api/v1/investments/plans');
    sendSuccess(res, { plan }, 'Investment plan deactivated (soft-deleted).');
  });

  // ── Portfolio ───────────────────────────────────────────────────

  static getPortfolioSummary: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const summary = await InvestmentService.getPortfolioSummary(req.user!.id);
    sendSuccess(res, summary);
  });

  static getPortfolio: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const portfolio = await InvestmentService.getPortfolio(req.user!.id);
    sendSuccess(res, portfolio);
  });

  static getInvestmentById: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const investment = await InvestmentService.getInvestmentById(
      req.user!.id,
      req.params.investmentId
    );
    sendSuccess(res, { investment });
  });

  // ── Purchase & Withdraw ─────────────────────────────────────────

  static purchase: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { planId, amount } = req.body;
    const result = await InvestmentService.purchaseInvestment(req.user!.id, planId, amount);
    sendCreated(res, result, 'Investment purchased successfully.');
  });

  static withdraw: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const result = await InvestmentService.withdrawInvestment(
      req.user!.id,
      req.params.investmentId
    );
    sendSuccess(res, result, 'Investment liquidated. Returns transferred to wallet.');
  });
}
