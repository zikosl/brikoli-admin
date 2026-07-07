import { apiFetch, clearAuthSession, getRefreshToken, setAuthSession } from './apiClient';
import type { AdminUser, AppUser } from '../types/user';

type ApiUserRole = 'ADMIN' | 'CLIENT' | 'WORKER';

export interface ApiUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  role: ApiUserRole;
  isGlobalAdmin?: boolean;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export const roleFromApi = (role: ApiUserRole) => role.toLowerCase() as AppUser['role'];

export function mapUserProfile(user: ApiUser): AppUser {
  const base = {
    uid: user.id,
    fullName: user.fullName,
    email: user.email ?? '',
    role: roleFromApi(user.role),
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };

  if (user.role === 'ADMIN') {
    return {
      ...base,
      role: 'admin',
      isGlobalAdmin: user.isGlobalAdmin ?? false,
      active: user.active,
    };
  }

  return base as AppUser;
}

export async function getCurrentUserProfile() {
  const profile = await apiFetch<ApiUser | null>('/auth/me');

  if (!profile) {
    return null;
  }

  return mapUserProfile(profile);
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const response = await apiFetch<LoginResponse>('/auth/admin/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthSession(response);

  const profile = mapUserProfile(response.user);
  if (profile.role !== 'admin') {
    clearAuthSession();
    throw new Error('This account is not authorized for admin dashboard access.');
  }

  return profile;
}

export async function logout() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    await apiFetch('/auth/logout', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  clearAuthSession();
}
