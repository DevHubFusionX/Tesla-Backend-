import { prisma } from '../config/db';
import { InvestmentStatus } from '../types';
import { NotificationService } from './notification.service';

export class SyncService {
  /**
   * Scans the database for ACTIVE investments that have passed their maturity date,
   * marks them as MATURED, credits the user's wallet balance with the expected return,
   * and logs a RETURN transaction.
   * Runs atomically inside a transaction for each matured investment.
   */
  static async matureInvestments() {
    const now = new Date();

    // Find all active investments that have matured
    const maturedInvestments = await prisma.userInvestment.findMany({
      where: {
        status: InvestmentStatus.ACTIVE,
        maturityDate: {
          lte: now,
        },
      },
      include: {
        plan: true,
      },
    });

    const results = [];

    for (const investment of maturedInvestments) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Update investment status to MATURED
          const updatedInvestment = await tx.userInvestment.update({
            where: { id: investment.id },
            data: {
              status: InvestmentStatus.MATURED,
              currentValuation: investment.expectedReturn,
            },
          });

          // 2. Log a SUCCESS return transaction (the DB trigger will update user balance)
          const transaction = await tx.transaction.create({
            data: {
              userId: investment.userId,
              type: 'RETURN',
              amount: investment.expectedReturn,
              description: `Maturity Payout for ${investment.plan.name}`,
              status: 'SUCCESS',
            },
          });

          // Retrieve updated user balance
          const updatedUser = await tx.user.findUnique({
            where: { id: investment.userId },
          });
          if (!updatedUser) throw new Error('User not found');

          return {
            investmentId: investment.id,
            payout: investment.expectedReturn,
            userId: investment.userId,
            newBalance: updatedUser.balance,
          };
        });

        results.push({ status: 'success', ...result });
      } catch (err: any) {
        console.error(`Failed to process maturity for investment ${investment.id}:`, err);
        results.push({ status: 'error', investmentId: investment.id, message: err.message });
      }
    }

    return {
      processedCount: maturedInvestments.length,
      details: results,
    };
  }

  /**
   * Snapshots current real-time valuations of active investments in the database.
   * Useful for historical tracking and portfolio valuation reports.
   */
  static async snapshotValuations() {
    const now = new Date();
    const activeInvestments = await prisma.userInvestment.findMany({
      where: {
        status: InvestmentStatus.ACTIVE,
      },
    });

    let updatedCount = 0;

    for (const inv of activeInvestments) {
      const start = new Date(inv.startDate).getTime();
      const end = new Date(inv.maturityDate).getTime();
      const current = now.getTime();

      let valuation = inv.amountInvested;
      if (current >= end) {
        valuation = inv.expectedReturn;
      } else {
        const progress = Math.max(0, Math.min(1, (current - start) / (end - start)));
        const profit = inv.expectedReturn - inv.amountInvested;
        valuation = inv.amountInvested + profit * progress;
      }

      await prisma.userInvestment.update({
        where: { id: inv.id },
        data: {
          currentValuation: Number(valuation.toFixed(4)),
        },
      });

      updatedCount++;
    }

    return {
      updatedCount,
    };
  }
}
