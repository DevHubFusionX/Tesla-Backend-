import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@tesla.com' },
    update: { role: 'ADMIN', password: hash, isActive: true },
    create: {
      name: 'Admin',
      email: 'admin@tesla.com',
      password: hash,
      role: 'ADMIN',
      isActive: true,
      balance: 0,
    },
  });
  console.log('✅ Admin account ready:', user.email, '| role:', user.role);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
