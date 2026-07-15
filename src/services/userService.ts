import { apiFetch } from './apiClient';
import type { AdminFormValues, AdminUpdateInput, AdminUser, AppUser, ClientUser, UserUpdateInput, WorkerInvite, WorkerProfileFormValues, WorkerUser } from '../types/user';

type ApiUserRole = 'ADMIN' | 'CLIENT' | 'WORKER';

interface ApiWorkerProfile {
  services: string[];
  available: boolean;
  ratingAverage: number;
  completedJobs: number;
}

interface ApiTelegramAccount {
  telegramId: string;
  chatId: string;
  username?: string | null;
  fullName?: string | null;
  linkedAt?: string | null;
}

interface ApiUser {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  fullName: string;
  role: ApiUserRole;
  isGlobalAdmin?: boolean;
  active: boolean;
  profileImage?: string | null;
  city?: string | null;
  address?: string | null;
  pushTokens?: string[];
  createdAt: string;
  updatedAt: string;
  workerProfile?: ApiWorkerProfile | null;
  telegramAccount?: ApiTelegramAccount | null;
}

const roleFromApi = (role: ApiUserRole) => role.toLowerCase() as AppUser['role'];

const sortByName = <T extends { fullName: string }>(users: T[]) =>
  [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));

const mapUser = (user: ApiUser): AppUser => {
  const base = {
    uid: user.id,
    fullName: user.fullName,
    email: user.email ?? '',
    role: roleFromApi(user.role),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.role === 'WORKER') {
    return {
      ...base,
      role: 'worker',
      phoneNumber: user.phoneNumber ?? '',
      services: user.workerProfile?.services ?? [],
      city: user.city ?? '',
      available: user.workerProfile?.available ?? false,
      active: user.active,
      ratingAverage: user.workerProfile?.ratingAverage ?? 0,
      completedJobs: user.workerProfile?.completedJobs ?? 0,
      profileImage: user.profileImage ?? '',
      pushTokens: user.pushTokens ?? [],
    } satisfies WorkerUser;
  }

  if (user.role === 'CLIENT') {
    return {
      ...base,
      role: 'client',
      phoneNumber: user.phoneNumber ?? '',
      address: user.address ?? '',
      city: user.city ?? '',
      active: user.active,
      profileImage: user.profileImage ?? '',
      pushTokens: user.pushTokens ?? [],
      telegram: user.telegramAccount
        ? {
            userId: user.telegramAccount.telegramId,
            chatId: user.telegramAccount.chatId,
            username: user.telegramAccount.username ?? undefined,
            fullName: user.telegramAccount.fullName ?? undefined,
            linkedAt: user.telegramAccount.linkedAt ?? null,
          }
        : undefined,
    } satisfies ClientUser;
  }

  return {
    ...base,
    role: 'admin',
    isGlobalAdmin: user.isGlobalAdmin ?? false,
    active: user.active,
  } satisfies AdminUser;
};

export async function getUsers() {
  const users = await apiFetch<ApiUser[]>('/users');
  return sortByName(users.map(mapUser));
}

export async function getWorkers() {
  const workers = await apiFetch<ApiUser[]>('/users?role=WORKER');
  return sortByName(workers.map(mapUser).filter((user): user is WorkerUser => user.role === 'worker'));
}

export async function getWorkerInvites(): Promise<WorkerInvite[]> {
  return [];
}

export async function getClients() {
  const clients = await apiFetch<ApiUser[]>('/users?role=CLIENT');
  return sortByName(clients.map(mapUser).filter((user): user is ClientUser => user.role === 'client'));
}

export async function getAdmins() {
  const admins = await apiFetch<ApiUser[]>('/users?role=ADMIN');
  return sortByName(admins.map(mapUser).filter((user): user is AdminUser => user.role === 'admin'));
}

export async function createAdmin(values: AdminFormValues) {
  const admin = await apiFetch<ApiUser>('/users/admins', {
    method: 'POST',
    body: JSON.stringify(values),
  });

  return mapUser(admin) as AdminUser;
}

export async function updateAdmin(uid: string, values: AdminUpdateInput) {
  const admin = await apiFetch<ApiUser>(`/users/admins/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...values, password: values.password?.trim() || undefined }),
  });

  return mapUser(admin) as AdminUser;
}

export async function createWorkerProfile(values: WorkerProfileFormValues) {
  const worker = await apiFetch<ApiUser>('/users/workers', {
    method: 'POST',
    body: JSON.stringify({ ...values, password: values.password?.trim() || undefined }),
  });
  return worker.email ?? worker.id;
}

export async function updateUser(uid: string, updates: UserUpdateInput) {
  const hasWorkerFields =
    updates.services !== undefined ||
    updates.available !== undefined ||
    updates.ratingAverage !== undefined ||
    updates.completedJobs !== undefined ||
    updates.password !== undefined;

  await apiFetch<ApiUser>(hasWorkerFields ? `/users/workers/${uid}` : `/users/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, password: updates.password?.trim() || undefined }),
  });
}

export async function toggleUserActive(uid: string, active: boolean) {
  await updateUser(uid, { active });
}
