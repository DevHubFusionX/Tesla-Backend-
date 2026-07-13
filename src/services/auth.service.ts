import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors';
import { signToken } from '../utils/jwt';
import { SafeUser } from '../types';

// ─────────────────────────────────────────────
// Selector — fields returned on every auth response
// ─────────────────────────────────────────────

const safeUserSelect = {
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
} as const;

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export class AuthService {
  static async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: passwordHash, balance: 1000.0 },
        select: safeUserSelect,
      });

      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: 'DEPOSIT',
          amount: 1000.0,
          description: 'Welcome Bonus — Account Pre-fund',
          status: 'SUCCESS',
        },
      });

      return newUser;
    });

    return { user, token: signToken(user.id) };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password.');

    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, token: signToken(user.id) };
  }

  static async getProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) throw new Error('User not found.');
    return user;
  }

  static async updateProfile(
    userId: string,
    updates: {
      name?: string;
      email?: string;
      phone?: string | null;
      location?: string | null;
      currency?: string;
      password?: string;
      currentPassword?: string;
    }
  ): Promise<SafeUser> {
    const data: Record<string, any> = {};

    if (updates.name !== undefined) data.name = updates.name;

    if (updates.email !== undefined) {
      const existing = await prisma.user.findFirst({
        where: {
          email: updates.email,
          NOT: { id: userId }
        }
      });
      if (existing) throw new ConflictError('A user with this email already exists.');
      data.email = updates.email;
    }

    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.location !== undefined) data.location = updates.location;
    if (updates.currency !== undefined) data.currency = updates.currency;
    
    if (updates.password !== undefined) {
      if (!updates.currentPassword) {
        throw new BadRequestError('Current password is required to change password.');
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('User not found.');
      
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Incorrect current password.');
      }
      data.password = await bcrypt.hash(updates.password, 10);
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: safeUserSelect,
    });
  }
}
