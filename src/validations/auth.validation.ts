import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Provide a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    name: z.string().min(2, 'Name must be at least 2 characters.'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Provide a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
      email: z.string().email('Provide a valid email address.').optional(),
      phone: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).optional(),
      password: z.string().min(6, 'New password must be at least 6 characters.').optional(),
      currentPassword: z.string().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.email !== undefined ||
        data.phone !== undefined ||
        data.location !== undefined ||
        data.currency !== undefined ||
        data.password !== undefined,
      {
        message: 'Provide at least one field to update.',
      }
    )
    .refine(
      (data) => {
        if (data.password !== undefined && !data.currentPassword) {
          return false;
        }
        return true;
      },
      {
        message: 'Current password is required to change password.',
        path: ['currentPassword'],
      }
    ),
});
