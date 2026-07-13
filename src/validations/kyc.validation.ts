import { z } from 'zod';

export const submitKycSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    address: z.string().min(5, 'Address must be at least 5 characters.'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format.'),
    idNumber: z.string().min(4, 'ID / SSN number must be at least 4 characters.'),
    idDocumentUrl: z.string().url('ID document URL must be a valid URL.'),
  }),
});

export const reviewKycSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required.'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status must be either APPROVED or REJECTED.' }),
    }),
    rejectionReason: z.string().optional(),
  }).refine((data) => data.status !== 'REJECTED' || !!data.rejectionReason, {
    message: 'Rejection reason is required when status is REJECTED.',
    path: ['rejectionReason'],
  }),
});
