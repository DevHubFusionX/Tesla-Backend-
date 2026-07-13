import { prisma } from '../config/db';

async function main() {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        isActive: true,
        phone: true,
        location: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    console.log('SUCCESS: Select query succeeded. User:', user);
  } catch (err) {
    console.error('ERROR: Select query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
