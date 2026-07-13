// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INVESTMENT = 'INVESTMENT',
  RETURN = 'RETURN',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─────────────────────────────────────────────
// Shared DTOs (Data Transfer Objects)
// ─────────────────────────────────────────────

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  phone: string | null;
  location: string | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  balance: number;
  totalInvested: number;
  totalCurrentValuation: number;
  totalProfit: number;
  totalExpectedReturn: number;
  activeCount: number;
  maturedCount: number;
  withdrawnCount: number;
}
