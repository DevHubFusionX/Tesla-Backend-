import rateLimit from 'express-rate-limit';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const makeRateLimiter = (windowMinutes: number, max: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message },
  });

// ─────────────────────────────────────────────
// Auth limiters
// ─────────────────────────────────────────────

/** 10 login attempts per minute per IP */
export const loginLimiter = makeRateLimiter(
  1,
  10,
  'Too many login attempts. Please wait a minute and try again.'
);

/** 5 registration attempts per minute per IP */
export const registerLimiter = makeRateLimiter(
  1,
  5,
  'Too many registration attempts. Please try again later.'
);

// ─────────────────────────────────────────────
// Financial action limiters
// ─────────────────────────────────────────────

/** 20 deposits per hour per user */
export const depositLimiter = makeRateLimiter(
  60,
  20,
  'Too many deposit requests. Maximum 20 per hour.'
);

/** 10 withdrawals per hour per user */
export const withdrawLimiter = makeRateLimiter(
  60,
  10,
  'Too many withdrawal requests. Maximum 10 per hour.'
);

/** 20 investment purchases per hour per user */
export const purchaseLimiter = makeRateLimiter(
  60,
  20,
  'Too many investment purchases. Maximum 20 per hour.'
);

// ─────────────────────────────────────────────
// General API limiter
// ─────────────────────────────────────────────

/** 100 general requests per minute — applied globally */
export const generalLimiter = makeRateLimiter(
  1,
  100,
  'Too many requests. Please slow down.'
);
