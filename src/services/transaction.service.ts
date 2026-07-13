import { prisma } from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { PaginationQuery, PaginatedResult } from '../types';
import { buildPaginatedResult, getPrismaSkipTake } from '../utils/pagination';
import { NotificationService } from './notification.service';

export class TransactionService {
  static async getTransactions(
    userId: string,
    pagination: PaginationQuery,
    type?: string
  ): Promise<PaginatedResult<any>> {
    const where: any = { userId };
    if (type) where.type = type;

    const skipTake = getPrismaSkipTake(pagination);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
      prisma.transaction.count({ where }),
    ]);

    return buildPaginatedResult(transactions, total, pagination);
  }

  static async getTransactionById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundError('Transaction not found.');
    }
    return transaction;
  }

  static async deposit(userId: string, amount: number, gateway: string, txHash: string) {
    // Check if txHash already exists to prevent duplication
    const existing = await prisma.transaction.findUnique({ where: { txHash } });
    if (existing) {
      throw new BadRequestError('This transaction hash (TxHash) has already been submitted.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('User not found.');

      const description = `Deposit via ${gateway}`;

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          description,
          status: 'PENDING',
          txHash,
        },
      });

      // Balance is NOT updated for PENDING deposits, return current balance
      return { transaction, newBalance: Number(user.balance.toFixed(2)) };
    });

    return result;
  }

  static async withdraw(userId: string, amount: number, gateway: string, address: string) {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('User not found.');
      if (user.balance < amount) throw new BadRequestError('Insufficient wallet balance.');

      const description = `Withdrawal via ${gateway} to ${address}`;

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: -amount,
          description,
          status: 'PENDING',
          destinationAddress: address,
        },
      });

      // Retrieve user after trigger updates (deducts) their balance
      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      if (!updatedUser) throw new NotFoundError('User not found.');

      return { transaction, newBalance: Number(updatedUser.balance.toFixed(2)) };
    });

    return result;
  }
}
