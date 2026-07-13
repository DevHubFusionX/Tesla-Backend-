import { Response, RequestHandler } from 'express';
import { TransactionService } from '../services/transaction.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';

export class TransactionController {
  static getHistory: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const type = req.query.type as string | undefined;
    const result = await TransactionService.getTransactions(req.user!.id, pagination, type);
    sendPaginated(res, result);
  });

  static getById: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const transaction = await TransactionService.getTransactionById(
      req.user!.id,
      req.params.transactionId
    );
    sendSuccess(res, { transaction });
  });

  static deposit: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { amount, gateway, txHash } = req.body;
    const result = await TransactionService.deposit(req.user!.id, amount, gateway, txHash);
    sendSuccess(res, result, 'Deposit request submitted. Awaiting verification.');
  });

  static withdraw: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { amount, gateway, address } = req.body;
    const result = await TransactionService.withdraw(req.user!.id, amount, gateway, address);
    sendSuccess(res, result, 'Withdrawal request submitted. Awaiting approval.');
  });
}
