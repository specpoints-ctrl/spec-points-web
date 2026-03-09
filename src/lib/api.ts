import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
  ? configuredBaseUrl.slice(0, -1)
  : configuredBaseUrl;

export const API_BASE_URL = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'architect' | 'lojista';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackendUserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  status: 'pending' | 'active' | 'blocked';
  role?: 'admin' | 'architect' | 'lojista';
  architect_id?: number;
  store_id?: number;
  user_roles?: Array<{
    role: 'admin' | 'architect' | 'lojista';
    architect_id?: number | null;
    store_id?: number | null;
  }>;
}

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<ApiResponse>('/auth/register', payload);
  return response.data;
};

export const validateLoginStatus = async (email: string) => {
  const response = await api.post<ApiResponse<{ user: BackendUserProfile }>>('/auth/login', { email });
  return response.data;
};

export const getCurrentUser = async (token: string) => {
  const response = await api.get<ApiResponse<BackendUserProfile>>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export interface DashboardStats {
  architects: number;
  stores: number;
  sales: number;
  totalPoints: number;
  recentSales: any[];
  topArchitects: any[];
}

export const getDashboardStats = async (token: string) => {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
