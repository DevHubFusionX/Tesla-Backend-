import { z } from 'zod';

export const purchaseInvestmentSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'Plan ID is required.'),
    amount: z.number().positive('Investment amount must be greater than zero.'),
  }),
});

export const withdrawInvestmentSchema = z.object({
  params: z.object({
    investmentId: z.string().min(1, 'Investment ID is required.'),
  }),
});

export const planIdParamSchema = z.object({
  params: z.object({
    planId: z.string().min(1, 'Plan ID is required.'),
  }),
});

export const investmentIdParamSchema = z.object({
  params: z.object({
    investmentId: z.string().min(1, 'Investment ID is required.'),
  }),
});

export const createPlanSchema = z.object({
  body: z
    .object({
      name: z.string().min(3, 'Plan name must be at least 3 characters.'),
      description: z.string().min(5, 'Description must be at least 5 characters.'),
      durationDays: z.number().int().positive('Duration must be a positive number of days.'),
      interestRate: z
        .number()
        .min(0.01, 'Interest rate must be at least 0.01 (1%).')
        .max(1.0, 'Interest rate cannot exceed 1.0 (100%).'),
      minAmount: z.number().positive('Minimum amount must be greater than zero.'),
      maxAmount: z.number().positive('Maximum amount must be greater than zero.'),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
        errorMap: () => ({ message: 'Risk level must be LOW, MEDIUM, or HIGH.' }),
      }),
    })
    .refine((data) => data.maxAmount >= data.minAmount, {
      message: 'Maximum amount must be ≥ minimum amount.',
      path: ['maxAmount'],
    }),
});

export const updatePlanSchema = z.object({
  params: z.object({
    planId: z.string().min(1, 'Plan ID is required.'),
  }),
  body: z
    .object({
      name: z.string().min(3).optional(),
      description: z.string().min(5).optional(),
      durationDays: z.number().int().positive().optional(),
      interestRate: z.number().min(0.01).max(1.0).optional(),
      minAmount: z.number().positive().optional(),
      maxAmount: z.number().positive().optional(),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Provide at least one field to update.',
    }),
});
