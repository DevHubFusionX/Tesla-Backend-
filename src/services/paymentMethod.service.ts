import { prisma } from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class PaymentMethodService {
  /**
   * Link a mock payment method (bank account or credit card).
   */
  static async linkPaymentMethod(
    userId: string,
    data: {
      type: 'BANK_ACCOUNT' | 'CARD';
      provider: string;
      last4: string;
      isDefault?: boolean;
    }
  ) {
    // If setting as default, make all others non-default first
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Check if user has no payment methods, force this one to be default
    const count = await prisma.paymentMethod.count({ where: { userId } });
    const isDefault = count === 0 ? true : !!data.isDefault;

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        type: data.type,
        provider: data.provider,
        last4: data.last4,
        isDefault,
      },
    });

    return paymentMethod;
  }

  /**
   * Get all linked payment methods for a user.
   */
  static async getPaymentMethods(userId: string) {
    return prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a linked payment method.
   */
  static async deletePaymentMethod(userId: string, id: string) {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found.');
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    // If we deleted the default one, set the next available one as default
    if (paymentMethod.isDefault) {
      const nextMethod = await prisma.paymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextMethod) {
        await prisma.paymentMethod.update({
          where: { id: nextMethod.id },
          data: { isDefault: true },
        });
      }
    }

    return paymentMethod;
  }

  /**
   * Set a specific payment method as the default source.
   */
  static async setDefault(userId: string, id: string) {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found.');
    }

    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
