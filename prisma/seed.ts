import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with investment plans...');

  // Clean existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.kycProfile.deleteMany();
  await prisma.userInvestment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.investmentPlan.deleteMany();

  // Create default plans
  const plans = await Promise.all([
    prisma.investmentPlan.create({
      data: {
        name: 'Conservative Treasury Plan',
        description: 'Low-risk plan investing in government treasury bills and secure AAA bonds. Recommended for conservative capital preservation.',
        durationDays: 30,
        interestRate: 0.06, // 6% annual rate
        minAmount: 50.0,
        maxAmount: 10000.0,
        riskLevel: 'LOW',
      },
    }),
    prisma.investmentPlan.create({
      data: {
        name: 'Balanced Real Estate Yield',
        description: 'Medium-risk plan focused on dividend-paying commercial properties and real estate trusts (REITs). Balanced growth.',
        durationDays: 90,
        interestRate: 0.12, // 12% annual rate
        minAmount: 200.0,
        maxAmount: 50000.0,
        riskLevel: 'MEDIUM',
      },
    }),
    prisma.investmentPlan.create({
      data: {
        name: 'Aggressive Venture Index',
        description: 'High-risk, high-yield plan targeting early-stage high-growth tech start-ups and digital currencies. Maximum growth potential.',
        durationDays: 180,
        interestRate: 0.24, // 24% annual rate
        minAmount: 1000.0,
        maxAmount: 250000.0,
        riskLevel: 'HIGH',
      },
    }),
  ]);

  console.log(`✅ Seeded ${plans.length} investment plans successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
