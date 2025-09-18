export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
// Enterprise error handling utilities
export class ErrorHandler {
  static handle(error: any): void {
    console.error('Error:', error);
  }
  
  static isRetryable(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || error?.status >= 500;
  }
}

export function isRetryableError(error: any): boolean {
  return ErrorHandler.isRetryable(error);
}
