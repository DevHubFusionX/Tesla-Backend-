import { z } from 'zod';

export const depositSchema = z.object({
  body: z.object({
    amount: z.number().positive('Deposit amount must be greater than zero.'),
    gateway: z.string().min(1, 'Payment gateway network is required.'),
    txHash: z.string().min(1, 'Blockchain transaction hash (TxHash) is required.'),
  }),
});

export const withdrawCashSchema = z.object({
  body: z.object({
    amount: z.number().positive('Withdrawal amount must be greater than zero.'),
    gateway: z.string().min(1, 'Payment gateway network is required.'),
    address: z.string().min(1, 'Destination wallet address is required.'),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required.'),
  }),
});
