import { PaginatedResult, PaginationQuery } from '../types';

// ─────────────────────────────────────────────
// Parse & clamp page/limit from query params
// ─────────────────────────────────────────────

export const parsePagination = (query: Record<string, any>): PaginationQuery => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit };
};

// ─────────────────────────────────────────────
// Build a PaginatedResult from raw data + total
// ─────────────────────────────────────────────

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  { page, limit }: PaginationQuery
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ─────────────────────────────────────────────
// Compute skip/take for Prisma queries
// ─────────────────────────────────────────────

export const getPrismaSkipTake = ({ page, limit }: PaginationQuery) => ({
  skip: (page - 1) * limit,
  take: limit,
});
