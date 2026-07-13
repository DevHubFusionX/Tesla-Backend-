import { Response } from 'express';
import { PaginatedResult } from '../types';

// ─────────────────────────────────────────────
// Success Responses
// ─────────────────────────────────────────────

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): void => {
  sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  result: PaginatedResult<T>,
  message = 'Success'
): void => {
  res.status(200).json({
    status: 'success',
    message,
    ...result,
  });
};

// ─────────────────────────────────────────────
// No-Content Response
// ─────────────────────────────────────────────

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
