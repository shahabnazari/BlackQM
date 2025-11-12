import axios from 'axios';

// API base URL - can be configured via environment variable
const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor to add auth token
// Check if apiClient exists (for test environment compatibility)
if (apiClient && apiClient.interceptors) {
  apiClient.interceptors.request.use(
    config => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}

export default apiClient;
