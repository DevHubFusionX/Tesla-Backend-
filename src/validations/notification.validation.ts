import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Notification ID is required.'),
  }),
});

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    unreadOnly: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});
