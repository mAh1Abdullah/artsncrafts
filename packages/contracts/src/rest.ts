/**
 * Industry-Standard REST API Envelopes & RFC 9457 Problem Details Contracts
 */

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiList<T> {
  data: T[];
  meta: ApiMeta & {
    pagination: PaginationMeta;
  };
}

export interface ValidationFieldError {
  field: string;
  message: string;
}

/**
 * RFC 9457 Problem Details for HTTP APIs (application/problem+json)
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  requestId: string;
  errors?: ValidationFieldError[];
}

export class ApiProblemError extends Error {
  public readonly problem: ProblemDetails;
  public readonly status: number;
  public readonly code: string;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiProblemError';
    this.problem = problem;
    this.status = problem.status;
    this.code = problem.code;
  }
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  category?: string;
  status?: string;
  vendorId?: string;
  vendorSlug?: string;
  inStockOnly?: boolean;
}
