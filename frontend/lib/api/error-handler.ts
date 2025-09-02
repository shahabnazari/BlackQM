export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with error
    return new ApiError(
      error.response.data?.message || 'Server error',
      error.response.status,
      error.response.data
    );
  } else if (error.request) {
    // Request made but no response
    return new ApiError('Network error - server not responding', 0);
  } else {
    // Something else happened
    return new ApiError(error.message || 'Unknown error');
  }
}

export function isNetworkError(error: any): boolean {
  return error.code === 'ECONNREFUSED' || 
         error.code === 'ENOTFOUND' ||
         error.code === 'ETIMEDOUT' ||
         error.code === 'ECONNRESET' ||
         error.message?.includes('Network') ||
         (error.isAxiosError && !error.response);
}