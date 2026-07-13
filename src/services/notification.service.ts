import { prisma } from '../config/db';
import { NotFoundError } from '../utils/errors';
import { PaginationQuery, PaginatedResult } from '../types';
import { getPrismaSkipTake } from '../utils/pagination';

export class NotificationService {
  /**
   * Internal helper to trigger/create an in-app notification.
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'TRANSACTION' | 'INVESTMENT' | 'SYSTEM' = 'SYSTEM'
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  }

  /**
   * Get all notifications for a user (paginated).
   */
  static async getNotifications(
    userId: string,
    pagination: PaginationQuery,
    unreadOnly?: boolean
  ): Promise<PaginatedResult<any>> {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const skipTake = getPrismaSkipTake(pagination);

    const [total, items] = await prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...skipTake,
      }),
    ]);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: items,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }

  /**
   * Mark a notification as read.
   */
  static async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for the user.
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
