import { prisma } from '../config/db';
import { NotFoundError } from '../utils/errors';
import { PaginationQuery } from '../types';
import { buildPaginatedResult, getPrismaSkipTake } from '../utils/pagination';

// ─────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────

export class AdminService {
  static async getUsers(pagination: PaginationQuery, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const skipTake = getPrismaSkipTake(pagination);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          balance: true, isActive: true, createdAt: true, updatedAt: true,
          _count: { select: { investments: true, transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, pagination);
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, balance: true,
        isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { investments: true, transactions: true } },
      },
    });
    if (!user) throw new NotFoundError('User not found.');
    return user;
  }

  static async updateUser(userId: string, updates: { role?: string; isActive?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');
    return prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true, name: true, email: true, role: true,
        balance: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
  }

  static async getUserInvestments(userId: string, pagination: PaginationQuery) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const skipTake = getPrismaSkipTake(pagination);
    const [investments, total] = await Promise.all([
      prisma.userInvestment.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { startDate: 'desc' },
        ...skipTake,
      }),
      prisma.userInvestment.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(investments, total, pagination);
  }

  static async getUserTransactions(userId: string, pagination: PaginationQuery) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const skipTake = getPrismaSkipTake(pagination);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(transactions, total, pagination);
  }

  // ─────────────────────────────────────────────
  // Analytics
  // ─────────────────────────────────────────────

  static async getOverview() {
    const [
      totalUsers,
      activeInvestments,
      maturedInvestments,
      totalDeposits,
      totalWithdrawals,
      totalInvestmentCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userInvestment.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amountInvested: true },
        _count: true,
      }),
      prisma.userInvestment.aggregate({
        where: { status: 'MATURED' },
        _sum: { currentValuation: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.userInvestment.count(),
    ]);

    return {
      totalUsers,
      totalInvestments: totalInvestmentCount,
      aum: Number((activeInvestments._sum.amountInvested ?? 0).toFixed(2)),
      activeInvestmentCount: activeInvestments._count,
      maturedInvestmentCount: maturedInvestments._count,
      totalDeposited: Number((totalDeposits._sum.amount ?? 0).toFixed(2)),
      totalWithdrawn: Number(Math.abs(totalWithdrawals._sum.amount ?? 0).toFixed(2)),
      totalDepositCount: totalDeposits._count,
      totalWithdrawalCount: totalWithdrawals._count,
    };
  }

  static async getInvestmentAnalytics() {
    const [byStatus, byRisk] = await Promise.all([
      prisma.userInvestment.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amountInvested: true, expectedReturn: true },
      }),
      prisma.userInvestment.groupBy({
        by: ['planId'],
        _count: true,
        _sum: { amountInvested: true },
      }),
    ]);

    const planBreakdown = await Promise.all(
      byRisk.map(async (group) => {
        const plan = await prisma.investmentPlan.findUnique({
          where: { id: group.planId },
          select: { name: true, riskLevel: true },
        });
        return {
          planId: group.planId,
          planName: plan?.name ?? 'Unknown',
          riskLevel: plan?.riskLevel ?? 'N/A',
          count: group._count,
          totalInvested: Number((group._sum.amountInvested ?? 0).toFixed(2)),
        };
      })
    );

    return { byStatus, planBreakdown };
  }

  static async getTransactionAnalytics() {
    const byType = await prisma.transaction.groupBy({
      by: ['type'],
      _count: true,
      _sum: { amount: true },
    });

    return { byType };
  }

  static async reviewTransaction(transactionId: string, status: 'SUCCESS' | 'FAILED', rejectionReason?: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundError('Transaction not found.');
    if (transaction.status !== 'PENDING') {
      throw new Error(`Transaction is already finalized with status: ${transaction.status}`);
    }

    const descriptionSuffix = rejectionReason ? ` (Rejected: ${rejectionReason})` : '';

    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        description: transaction.description + descriptionSuffix,
      },
    });
  }

  static async getTransactions(pagination: PaginationQuery, status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const skipTake = getPrismaSkipTake(pagination);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
      prisma.transaction.count({ where }),
    ]);

    return buildPaginatedResult(transactions, total, pagination);
  }

  static async getKycProfiles(pagination: PaginationQuery, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const skipTake = getPrismaSkipTake(pagination);
    const [kycProfiles, total] = await Promise.all([
      prisma.kycProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
      prisma.kycProfile.count({ where }),
    ]);

    return buildPaginatedResult(kycProfiles, total, pagination);
  }

  static async adjustUserBalance(userId: string, amount: number, description: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    return prisma.$transaction(async (tx) => {
      // Create a SYSTEM transaction representing the adjustment.
      // The Postgres database trigger fn_update_user_balance will automatically
      // capture this insertion and update the User's balance.
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'SYSTEM',
          amount,
          description,
          status: 'SUCCESS'
        }
      });
      return transaction;
    });
  }

  static async getInvestmentPlans() {
    const plans = await prisma.investmentPlan.findMany({ orderBy: { createdAt: 'desc' } });
    return plans.map(({ interestRate, ...p }) => ({ ...p, roiPercent: interestRate }));
  }

  static async createInvestmentPlan(data: any) {
    const { roiPercent, maxAmount, ...rest } = data;
    return prisma.investmentPlan.create({
      data: { ...rest, interestRate: roiPercent, maxAmount: maxAmount ?? 0 },
    }).then(({ interestRate, ...p }) => ({ ...p, roiPercent: interestRate }));
  }

  static async updateInvestmentPlan(planId: string, data: any) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');
    const { roiPercent, ...rest } = data;
    return prisma.investmentPlan.update({
      where: { id: planId },
      data: { ...rest, ...(roiPercent !== undefined ? { interestRate: roiPercent } : {}) },
    }).then(({ interestRate, ...p }) => ({ ...p, roiPercent: interestRate }));
  }

  static async deleteInvestmentPlan(planId: string) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');

    const activeCount = await prisma.userInvestment.count({
      where: { planId, status: 'ACTIVE' }
    });

    if (activeCount > 0) {
      return prisma.investmentPlan.update({
        where: { id: planId },
        data: { active: false }
      });
    }

    return prisma.investmentPlan.delete({
      where: { id: planId }
    });
  }
}
