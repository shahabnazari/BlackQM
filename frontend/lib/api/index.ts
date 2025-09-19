/**
 * API Service - Phase 7 Day 1 Audit Fix
 * 
 * Simple API wrapper for making HTTP requests to the backend
 * This fixes the missing import in study-hub.store.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class APIService {
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response;
  }

  async get(endpoint: string) {
    const response = await this.request(endpoint, { method: 'GET' });
    return { data: await response.json() };
  }

  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: await response.json() };
  }

  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { data: await response.json() };
  }

  async delete(endpoint: string) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return { data: await response.json() };
  }
}

export const api = new APIService();