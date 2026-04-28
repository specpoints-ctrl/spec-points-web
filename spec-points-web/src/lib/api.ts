import axios from 'axios';
import { getAuth } from 'firebase/auth';

const configuredBaseUrl = import.meta.env.VITE_API_URL || 'https://spec-points-api-production.up.railway.app';
const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
  ? configuredBaseUrl.slice(0, -1)
  : configuredBaseUrl;

export const API_BASE_URL = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

const STORAGE_HOST_MARKERS = ['storageapi.dev', 'storage.railway.app'];

const encodeAssetKey = (key: string) =>
  key.split('/').filter(Boolean).map(encodeURIComponent).join('/');

export const resolveAssetUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return '';

  if (rawUrl.startsWith(`${API_BASE_URL}/upload/file/`)) {
    return rawUrl;
  }

  const trimmedUrl = rawUrl.trim();
  const isAbsolute = /^https?:\/\//i.test(trimmedUrl);

  if (isAbsolute) {
    try {
      const parsed = new URL(trimmedUrl);
      const isRailwayBucket = STORAGE_HOST_MARKERS.some((marker) => parsed.host.includes(marker));

      if (isRailwayBucket) {
        const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
        return key ? `${API_BASE_URL}/upload/file/${encodeAssetKey(key)}` : trimmedUrl;
      }
    } catch {
      return trimmedUrl;
    }
  }

  if (trimmedUrl.includes('/')) {
    return `${API_BASE_URL}/upload/file/${encodeAssetKey(trimmedUrl.replace(/^\/+/, ''))}`;
  }

  return trimmedUrl;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: injeta o Firebase token automaticamente em todas as requisições
api.interceptors.request.use(async (config) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && !config.headers.Authorization) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Sem token disponível, a requisição segue sem autenticação
  }
  return config;
});

export interface RegisterPayload {
  email: string;
  password: string;
  role: 'architect' | 'lojista';
  // Architect fields
  name?: string;
  document_ci?: string;
  ruc?: string;
  company?: string;
  telefone?: string;
  office_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  birthday?: string;
  // Lojista fields
  store_name?: string;
  cnpj?: string;
  owner_name?: string;
  owner_ci?: string;
  store_ruc?: string;
  store_phone?: string;
  store_office_phone?: string;
  store_address?: string;
  store_city?: string;
  owner_birthday?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
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

export interface PendingUser {
  id: string;
  firebase_uid: string;
  email: string;
  status: string;
  created_at: string;
  role: string;
  architect_id?: number;
  architect_name?: string;
}

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post<ApiResponse>('/auth/register', payload);
  return response.data;
};

export const validateLoginStatus = async (email: string) => {
  const response = await api.post<ApiResponse<{ user: BackendUserProfile }>>('/auth/login', { email });
  return response.data;
};

export const googleLoginUpsert = async (name?: string) => {
  const response = await api.post<ApiResponse<{ status: string; role: string }>>('/auth/google', { name });
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

// User management endpoints
export const getPendingUsers = async (token: string) => {
  const response = await api.get<ApiResponse<PendingUser[]>>('/users/pending', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getUserDetails = async (token: string, userId: string) => {
  const response = await api.get<ApiResponse<PendingUser>>(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const approveUser = async (token: string, userId: string) => {
  const response = await api.post<ApiResponse>(
    `/users/${userId}/approve`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const rejectUser = async (token: string, userId: string, reason?: string) => {
  const response = await api.post<ApiResponse>(
    `/users/${userId}/reject`,
    { reason },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ── Profile ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  role: string;
  architect_id?: number;
  store_id?: number;
}

export const getProfile = async () => {
  const response = await api.get<ApiResponse<UserProfile>>('/profile');
  return response.data;
};

export const updateProfile = async (payload: { display_name?: string; avatar_url?: string }) => {
  const response = await api.put<ApiResponse<UserProfile>>('/profile', payload);
  return response.data;
};

// ── Upload ─────────────────────────────────────────────────────────────────

export type UploadFolder = 'avatars' | 'prizes' | 'stores' | 'receipts';

export const uploadImage = async (
  file: File,
  folder: UploadFolder,
  onProgress?: (pct: number) => void,
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post<ApiResponse<{ url: string }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  if (!response.data.success || !response.data.data?.url) {
    throw new Error(response.data.error ?? 'Upload falhou');
  }

  return response.data.data.url;
};

// ── Notifications ──────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'general' | 'offer' | 'campaign';
  target_role: 'architect' | 'lojista' | 'all';
  created_at: string;
  is_read: boolean;
  creator_email?: string;
}

export const getNotifications = async () => {
  const response = await api.get<ApiResponse<Notification[]>>('/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await api.patch<ApiResponse>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch<ApiResponse>('/notifications/read-all');
  return response.data;
};

export const createNotification = async (payload: {
  title: string;
  message: string;
  type: string;
  target_role: string;
}) => {
  const response = await api.post<ApiResponse<Notification>>('/notifications', payload);
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await api.delete<ApiResponse>(`/notifications/${id}`);
  return response.data;
};

export const getAdminNotifications = async () => {
  const response = await api.get<ApiResponse<Notification[]>>('/notifications/admin');
  return response.data;
};

// ── Architect self-service ─────────────────────────────────────────────────

export interface ArchitectProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  points_total: number;
  points_redeemed: number;
  status: string;
}

export const getMyArchitectProfile = async () => {
  const response = await api.get<ApiResponse<ArchitectProfile>>('/architects/me');
  return response.data;
};

export const getMySales = async () => {
  const response = await api.get<ApiResponse<any[]>>('/sales/my');
  return response.data;
};

// ── Auth extended ──────────────────────────────────────────────────────────

export const completeProfile = async (data: Record<string, string>) => {
  const response = await api.post<ApiResponse>('/auth/complete-profile', data);
  return response.data;
};

export const updateEmailApi = async (email: string) => {
  const response = await api.put<ApiResponse>('/profile/email', { email });
  return response.data;
};

// ── Campaigns ──────────────────────────────────────────────────────────────

export interface CampaignPrize {
  id?: number;
  name: string;
  points_required: number;
  stock: number;
  image_url?: string;
}

export interface Campaign {
  id: number;
  title: string;
  subtitle?: string;
  focus: 'all' | 'architect' | 'lojista';
  points_multiplier: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  prize_count?: number;
  sale_count?: number;
  prizes?: CampaignPrize[];
}

export interface MyCampaign extends Campaign {
  points_earned: number;
}

export interface CampaignPayload {
  title: string;
  subtitle?: string;
  focus: 'all' | 'architect' | 'lojista';
  points_multiplier: number;
  start_date: string;
  end_date: string;
  active?: boolean;
  prizes?: CampaignPrize[];
}

export const getCampaigns = async () => {
  const response = await api.get<ApiResponse<Campaign[]>>('/campaigns');
  return response.data;
};

export const getCampaignById = async (id: number) => {
  const response = await api.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
  return response.data;
};

export const createCampaign = async (data: CampaignPayload) => {
  const response = await api.post<ApiResponse<Campaign>>('/campaigns', data);
  return response.data;
};

export const updateCampaign = async (id: number, data: Partial<CampaignPayload>) => {
  const response = await api.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data);
  return response.data;
};

export const deleteCampaign = async (id: number) => {
  const response = await api.delete<ApiResponse>(`/campaigns/${id}`);
  return response.data;
};

export const getCampaignRanking = async (id: number) => {
  const response = await api.get<ApiResponse<{ campaign: Campaign; ranking: { architect_id: number; architect_name: string; campaign_points: number }[] }>>(`/campaigns/${id}/ranking`);
  return response.data;
};

export const getActiveCampaigns = async () => {
  const response = await api.get<ApiResponse<Campaign[]>>('/campaigns/active');
  return response.data;
};

export const getMyActiveCampaigns = async () => {
  const response = await api.get<ApiResponse<MyCampaign[]>>('/campaigns/my');
  return response.data;
};

// ── Terms ─────────────────────────────────────────────────────────────────

export interface Terms {
  id: number;
  content: string;
  version: string;
  active: boolean;
  created_at: string;
}

export const getActiveTerms = async () => {
  const response = await api.get<ApiResponse<Terms | null>>('/terms/active');
  return response.data;
};

export const checkTermsAcceptance = async () => {
  const response = await api.get<ApiResponse<{ accepted: boolean; terms: Terms | null }>>('/terms/check');
  return response.data;
};

export const acceptTerms = async (terms_id: number) => {
  const response = await api.post<ApiResponse>('/terms/accept', { terms_id });
  return response.data;
};

export const getAllTerms = async () => {
  const response = await api.get<ApiResponse<Terms[]>>('/terms');
  return response.data;
};

export const createTerms = async (data: { content: string; version: string }) => {
  const response = await api.post<ApiResponse<Terms>>('/terms', data);
  return response.data;
};

export const updateTermsApi = async (id: number, data: { content?: string; version?: string }) => {
  const response = await api.put<ApiResponse<Terms>>(`/terms/${id}`, data);
  return response.data;
};

// ── Redemptions extended ───────────────────────────────────────────────────

export const requestRedemption = async (prize_id: number) => {
  const response = await api.post<ApiResponse>('/redemptions/request', { prize_id });
  return response.data;
};

export const getMyRedemptions = async () => {
  const response = await api.get<ApiResponse<any[]>>('/redemptions/my');
  return response.data;
};

export const approveRedemption = async (id: number) => {
  const response = await api.patch<ApiResponse>(`/redemptions/${id}/approve`);
  return response.data;
};

export const deliverRedemption = async (id: number) => {
  const response = await api.patch<ApiResponse>(`/redemptions/${id}/deliver`);
  return response.data;
};

// ── Stores extended ───────────────────────────────────────────────────────

export interface ActiveStore {
  id: number;
  name: string;
  city?: string;
  phone?: string;
  logo_url?: string;
}

export const getActiveStoresList = async () => {
  const response = await api.get<ApiResponse<ActiveStore[]>>('/stores/active-list');
  return response.data;
};

// ── Architects extended ───────────────────────────────────────────────────

export const getActiveCompleteArchitects = async () => {
  const response = await api.get<ApiResponse<{ id: number; nome: string; email: string }[]>>('/architects/active-complete');
  return response.data;
};

// ── Sales extended ────────────────────────────────────────────────────────
export const approveSale = async (id: string) => {
  const response = await api.post<ApiResponse>(`/sales/${id}/approve`);
  return response.data;
};

export const rejectSale = async (id: string) => {
  const response = await api.post<ApiResponse>(`/sales/${id}/reject`);
  return response.data;
};
