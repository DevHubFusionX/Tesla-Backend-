import { z } from 'zod';

export const linkPaymentMethodSchema = z.object({
  body: z.object({
    type: z.enum(['BANK_ACCOUNT', 'CARD'], {
      errorMap: () => ({ message: 'Type must be BANK_ACCOUNT or CARD.' }),
    }),
    provider: z.string().min(2, 'Provider name must be at least 2 characters.'),
    last4: z.string().length(4, 'Last 4 digits must be exactly 4 characters.'),
    isDefault: z.boolean().optional(),
  }),
});

export const paymentMethodIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment Method ID is required.'),
  }),
});
