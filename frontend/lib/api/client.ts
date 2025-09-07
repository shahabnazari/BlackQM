import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

// Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Add auth token if available
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token if available
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        // Store CSRF token if provided
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
          this.setCsrfToken(csrfToken);
        }

        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshToken();
          }

          try {
            const { accessToken } = await this.refreshPromise;
            this.setToken(accessToken);
            this.refreshPromise = null;

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.refreshPromise = null;
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', token);
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private getCsrfToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('csrf_token');
  }

  private setCsrfToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('csrf_token', token);
  }

  private async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem('access_token', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }

    return { accessToken };
  }

  private handleAuthError(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
    }
  }

  private handleApiError(error: AxiosError<ApiError>): void {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      const statusCode = error.response.status;

      switch (statusCode) {
        case 400:
          toast.error(`Bad Request: ${message}`);
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 409:
          toast.error(`Conflict: ${message}`);
          break;
        case 422:
          toast.error(`Validation Error: ${message}`);
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  }

  // HTTP Methods with retry logic
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  }

  // Batch requests
  async batch<T = any>(requests: Array<() => Promise<any>>): Promise<T[]> {
    try {
      return await Promise.all(requests.map(req => req()));
    } catch (error) {
      throw error;
    }
  }

  // Request with automatic retry
  async withRetry<T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await request();
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          throw error;
        }

        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }

    throw lastError;
  }

  // Get the axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { AxiosInstance, AxiosError, AxiosRequestConfig };
