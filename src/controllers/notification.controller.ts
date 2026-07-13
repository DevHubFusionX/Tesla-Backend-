import { Response, RequestHandler } from 'express';
import { NotificationService } from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';

export class NotificationController {
  static getNotifications: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const pagination = parsePagination(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await NotificationService.getNotifications(req.user!.id, pagination, unreadOnly);
    sendPaginated(res, result);
  });

  static markAsRead: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const notification = await NotificationService.markAsRead(req.user!.id, req.params.id);
    sendSuccess(res, { notification }, 'Notification marked as read.');
  });

  static markAllRead: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    await NotificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read.');
  });
}
