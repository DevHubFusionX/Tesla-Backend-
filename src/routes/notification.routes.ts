import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
} from '../validations/notification.validation';

const router: Router = Router();

router.use(authenticate as any);

router.get('/', validateRequest(getNotificationsQuerySchema), NotificationController.getNotifications);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', validateRequest(notificationIdParamSchema), NotificationController.markAsRead);

export default router;
