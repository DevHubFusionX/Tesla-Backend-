import { prisma } from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { parsePagination, buildPaginatedResult, getPrismaSkipTake } from '../utils/pagination';
import { InvestmentStatus, PaginationQuery, PortfolioSummary } from '../types';
import { NotificationService } from './notification.service';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Compute the real-time linear-accrual valuation for an ACTIVE investment.
 * This is computed in-memory — never persisted until withdrawal or cron snapshot.
 */
const computeCurrentValuation = (
  amountInvested: number,
  expectedReturn: number,
  startDate: Date,
  maturityDate: Date
): number => {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(maturityDate).getTime();

  if (now >= end) return expectedReturn;

  const progress = Math.max(0, Math.min(1, (now - start) / (end - start)));
  const profit = expectedReturn - amountInvested;
  return amountInvested + profit * progress;
};

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export class InvestmentService {
  // ── Plans ───────────────────────────────────

  static async getAllPlans() {
    return prisma.investmentPlan.findMany({
      where: { active: true },
      orderBy: { minAmount: 'asc' },
    });
  }

  static async getPlanById(planId: string) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');
    return plan;
  }

  static async createPlan(data: {
    name: string;
    description: string;
    durationDays: number;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    riskLevel: string;
  }) {
    return prisma.investmentPlan.create({ data });
  }

  static async updatePlan(
    planId: string,
    updates: Partial<{
      name: string;
      description: string;
      durationDays: number;
      interestRate: number;
      minAmount: number;
      maxAmount: number;
      riskLevel: string;
    }>
  ) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');
    return prisma.investmentPlan.update({ where: { id: planId }, data: updates });
  }

  static async togglePlan(planId: string) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');
    return prisma.investmentPlan.update({
      where: { id: planId },
      data: { active: !plan.active },
    });
  }

  static async deletePlan(planId: string) {
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Investment plan not found.');

    // Soft-delete: deactivate so historical investments remain intact
    return prisma.investmentPlan.update({
      where: { id: planId },
      data: { active: false },
    });
  }

  // ── User Portfolio ───────────────────────────

  static async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const [user, investments] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
      prisma.userInvestment.findMany({
        where: { userId },
        select: {
          amountInvested: true,
          expectedReturn: true,
          startDate: true,
          maturityDate: true,
          status: true,
          currentValuation: true,
        },
      }),
    ]);

    if (!user) throw new NotFoundError('User not found.');

    let totalInvested = 0;
    let totalCurrentValuation = 0;
    let totalExpectedReturn = 0;
    let activeCount = 0;
    let maturedCount = 0;
    let withdrawnCount = 0;

    for (const inv of investments) {
      if (inv.status === InvestmentStatus.ACTIVE) {
        const valuation = computeCurrentValuation(
          inv.amountInvested,
          inv.expectedReturn,
          inv.startDate,
          inv.maturityDate
        );
        totalInvested += inv.amountInvested;
        totalCurrentValuation += valuation;
        totalExpectedReturn += inv.expectedReturn;
        activeCount++;
      } else if (inv.status === InvestmentStatus.MATURED) {
        maturedCount++;
      } else {
        withdrawnCount++;
      }
    }

    return {
      balance: Number(user.balance.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrentValuation: Number(totalCurrentValuation.toFixed(2)),
      totalProfit: Number((totalCurrentValuation - totalInvested).toFixed(2)),
      totalExpectedReturn: Number(totalExpectedReturn.toFixed(2)),
      activeCount,
      maturedCount,
      withdrawnCount,
    };
  }

  static async getPortfolio(userId: string) {
    const [summary, rawInvestments] = await Promise.all([
      InvestmentService.getPortfolioSummary(userId),
      prisma.userInvestment.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const investments = rawInvestments.map((inv) => ({
      ...inv,
      currentValuation:
        inv.status === InvestmentStatus.ACTIVE
          ? Number(
              computeCurrentValuation(
                inv.amountInvested,
                inv.expectedReturn,
                inv.startDate,
                inv.maturityDate
              ).toFixed(4)
            )
          : inv.currentValuation,
    }));

    return { ...summary, investments };
  }

  static async getInvestmentById(userId: string, investmentId: string) {
    const investment = await prisma.userInvestment.findUnique({
      where: { id: investmentId },
      include: { plan: true },
    });

    if (!investment || investment.userId !== userId) {
      throw new NotFoundError('Investment record not found.');
    }

    const currentValuation =
      investment.status === InvestmentStatus.ACTIVE
        ? computeCurrentValuation(
            investment.amountInvested,
            investment.expectedReturn,
            investment.startDate,
            investment.maturityDate
          )
        : investment.currentValuation;

    return { ...investment, currentValuation: Number(currentValuation.toFixed(4)) };
  }

  // ── Purchase & Withdraw ─────────────────────

  static async purchaseInvestment(userId: string, planId: string, amount: number) {
    let planName = '';
    const result = await prisma.$transaction(async (tx) => {
      const [user, plan] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.investmentPlan.findUnique({ where: { id: planId } }),
      ]);

      if (!user) throw new NotFoundError('User not found.');
      if (!plan || !plan.active) throw new NotFoundError('Investment plan not found or inactive.');
      if (user.balance < amount) throw new BadRequestError('Insufficient wallet balance.');
      if (amount < plan.minAmount) throw new BadRequestError(`Minimum investment is $${plan.minAmount}.`);
      if (amount > plan.maxAmount) throw new BadRequestError(`Maximum investment is $${plan.maxAmount}.`);

      planName = plan.name;

      const expectedProfit = amount * plan.interestRate * (plan.durationDays / 365);
      const expectedReturn = amount + expectedProfit;
      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setDate(maturityDate.getDate() + plan.durationDays);

      const investment = await tx.userInvestment.create({
        data: {
          userId, planId, amountInvested: amount, currentValuation: amount,
          expectedReturn, startDate, maturityDate, status: InvestmentStatus.ACTIVE,
        },
        include: { plan: true },
      });

      await tx.transaction.create({
        data: {
          userId, type: 'INVESTMENT', amount: -amount,
          description: `Invested in ${plan.name}`, status: 'SUCCESS',
        },
      });

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      if (!updatedUser) throw new NotFoundError('User not found.');

      return { investment, newBalance: Number(updatedUser.balance.toFixed(2)) };
    });

    return result;
  }

  static async withdrawInvestment(userId: string, investmentId: string) {
    let planName = '';
    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.userInvestment.findUnique({
        where: { id: investmentId },
        include: { plan: true },
      });

      if (!investment || investment.userId !== userId) {
        throw new NotFoundError('Investment record not found.');
      }
      if (investment.status !== InvestmentStatus.ACTIVE) {
        throw new BadRequestError(`Investment is already ${investment.status.toLowerCase()}.`);
      }

      planName = investment.plan.name;

      const liquidationValue = computeCurrentValuation(
        investment.amountInvested,
        investment.expectedReturn,
        investment.startDate,
        investment.maturityDate
      );

      const updatedInvestment = await tx.userInvestment.update({
        where: { id: investmentId },
        data: { status: InvestmentStatus.WITHDRAWN, currentValuation: liquidationValue },
      });

      await tx.transaction.create({
        data: {
          userId, type: 'RETURN', amount: liquidationValue,
          description: `Withdrew from ${investment.plan.name}`, status: 'SUCCESS',
        },
      });

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      if (!updatedUser) throw new NotFoundError('User not found.');

      return {
        investment: updatedInvestment,
        newBalance: Number(updatedUser.balance.toFixed(2)),
        payoutAmount: Number(liquidationValue.toFixed(2)),
      };
    });

    return result;
  }
}
