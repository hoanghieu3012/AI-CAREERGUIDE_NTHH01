/**
 * API Service Client for AI CareerGuide Backend Core
 * Handles JWT token injection, unified error management, and fallback demonstration.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('careerguide_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errData = {};
      try {
        errData = await response.json();
      } catch {
        errData = { detail: response.statusText };
      }
      const detail = (errData as any)?.detail || `Request failed with status ${response.status}`;
      throw new ApiError(response.status, detail, errData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or backend offline
    console.warn(`[API Client] Network failure at ${endpoint}:`, error);
    throw new ApiError(503, 'Không thể kết nối đến máy chủ Backend AI CareerGuide. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.', error);
  }
}
