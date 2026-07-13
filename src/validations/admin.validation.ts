import { z } from 'zod';

export const adminUserIdParamSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required.'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required.'),
  }),
  body: z
    .object({
      role: z.enum(['USER', 'ADMIN']).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => data.role !== undefined || data.isActive !== undefined, {
      message: 'Provide at least one field to update: role or isActive.',
    }),
});

export const reviewTransactionSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required.'),
  }),
  body: z.object({
    status: z.enum(['SUCCESS', 'FAILED']),
    rejectionReason: z.string().optional(),
  }),
});

export const adjustBalanceSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required.'),
  }),
  body: z.object({
    amount: z.number({ required_error: 'Amount is required.' }),
    description: z.string().min(3, 'Adjustment description must be at least 3 characters.').max(200),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED']).optional(),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'RETURN', 'SYSTEM']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getKycQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const createInvestmentPlanSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters.').max(100),
    description: z.string().min(5, 'Description must be at least 5 characters.').max(500),
    durationDays: z.number().int().min(1, 'Duration must be at least 1 day.'),
    roiPercent: z.number().min(0, 'ROI cannot be negative.').max(500, 'Max ROI is 500%.'),
    minAmount: z.number().min(1, 'Min amount must be at least 1.'),
    maxAmount: z.number().min(1).nullable().optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    active: z.boolean().optional(),
  }).refine(data => !data.maxAmount || data.maxAmount >= data.minAmount, {
    message: 'Max amount must be greater than or equal to min amount.',
    path: ['maxAmount'],
  }),
});

export const updateInvestmentPlanSchema = z.object({
  params: z.object({
    planId: z.string().min(1, 'Plan ID is required.'),
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().min(5).max(500).optional(),
    durationDays: z.number().int().min(1).optional(),
    roiPercent: z.number().min(0).max(500).optional(),
    minAmount: z.number().min(1).optional(),
    maxAmount: z.number().min(1).nullable().optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    active: z.boolean().optional(),
  }).refine(data => {
    if (data.minAmount !== undefined && data.maxAmount != null) {
      return data.maxAmount >= data.minAmount;
    }
    return true;
  }, {
    message: 'Max amount must be greater than or equal to min amount.',
    path: ['maxAmount'],
  }),
});

export const adminPlanIdParamSchema = z.object({
  params: z.object({
    planId: z.string().min(1, 'Plan ID is required.'),
  }),
});
