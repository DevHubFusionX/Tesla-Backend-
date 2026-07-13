import { Response, RequestHandler } from 'express';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';

export class AdminController {
  // ── User Management ─────────────────────────────────────────────

  static getUsers: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const search = req.query.search as string | undefined;
    const result = await AdminService.getUsers(pagination, search);
    sendPaginated(res, result, 'Users retrieved.');
  });

  static getUserById: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const user = await AdminService.getUserById(req.params.userId);
    sendSuccess(res, { user });
  });

  static updateUser: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const user = await AdminService.updateUser(req.params.userId, req.body);
    sendSuccess(res, { user }, 'User updated.');
  });

  static getUserInvestments: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const result = await AdminService.getUserInvestments(req.params.userId, pagination);
    sendPaginated(res, result);
  });

  static getUserTransactions: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const result = await AdminService.getUserTransactions(req.params.userId, pagination);
    sendPaginated(res, result);
  });

  // ── Analytics ───────────────────────────────────────────────────

  static getOverview: RequestHandler = asyncHandler(async (_req: any, res: Response) => {
    const overview = await AdminService.getOverview();
    sendSuccess(res, overview);
  });

  static getInvestmentAnalytics: RequestHandler = asyncHandler(async (_req: any, res: Response) => {
    const analytics = await AdminService.getInvestmentAnalytics();
    sendSuccess(res, analytics);
  });

  static getTransactionAnalytics: RequestHandler = asyncHandler(async (_req: any, res: Response) => {
    const analytics = await AdminService.getTransactionAnalytics();
    sendSuccess(res, analytics);
  });

  static reviewTransaction: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { transactionId } = req.params;
    const { status, rejectionReason } = req.body;
    const result = await AdminService.reviewTransaction(transactionId, status, rejectionReason);
    sendSuccess(res, { transaction: result }, `Transaction marked as ${status}.`);
  });

  static getTransactions: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const { status, type } = req.query;
    const result = await AdminService.getTransactions(pagination, status as string, type as string);
    sendPaginated(res, result, 'Transactions retrieved.');
  });

  static getKycProfiles: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const { status } = req.query;
    const result = await AdminService.getKycProfiles(pagination, status as string);
    sendPaginated(res, result, 'KYC profiles retrieved.');
  });

  static adjustUserBalance: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.params;
    const { amount, description } = req.body;
    const result = await AdminService.adjustUserBalance(userId, amount, description);
    sendSuccess(res, { transaction: result }, 'User balance adjusted successfully.');
  });

  static getInvestmentPlans: RequestHandler = asyncHandler(async (_req: any, res: Response) => {
    const result = await AdminService.getInvestmentPlans();
    sendSuccess(res, { plans: result }, 'Investment plans retrieved.');
  });

  static createInvestmentPlan: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const result = await AdminService.createInvestmentPlan(req.body);
    sendSuccess(res, { plan: result }, 'Investment plan created successfully.');
  });

  static updateInvestmentPlan: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { planId } = req.params;
    const result = await AdminService.updateInvestmentPlan(planId, req.body);
    sendSuccess(res, { plan: result }, 'Investment plan updated successfully.');
  });

  static deleteInvestmentPlan: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { planId } = req.params;
    const result = await AdminService.deleteInvestmentPlan(planId);
    sendSuccess(res, { plan: result }, 'Investment plan processed successfully.');
  });
}

