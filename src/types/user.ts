export type UserRole = 'admin' | 'client' | 'worker';
export type DateValue = string | Date | number | null;

export interface TelegramAccount {
  userId: string;
  chatId: string;
  username?: string;
  fullName?: string;
  linkedAt: DateValue;
}

export interface BaseUser {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
}

export interface ClientUser extends BaseUser {
  role: 'client';
  phoneNumber: string;
  address: string;
  city: string;
  active: boolean;
  profileImage: string;
  pushTokens: string[];
  telegram?: TelegramAccount;
}

export interface WorkerUser extends BaseUser {
  role: 'worker';
  phoneNumber: string;
  services: string[];
  city: string;
  available: boolean;
  active: boolean;
  ratingAverage: number;
  completedJobs: number;
  profileImage: string;
  pushTokens: string[];
}

export type AppUser = AdminUser | ClientUser | WorkerUser;

export interface WorkerProfileFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  services: string[];
  available: boolean;
  active: boolean;
  profileImage: string;
  password?: string;
}

export interface WorkerInvite {
  id: string;
  role: 'worker';
  fullName: string;
  email: string;
  phoneNumber: string;
  services: string[];
  city: string;
  available: boolean;
  active: boolean;
  profileImage: string;
  claimed: boolean;
  claimedUid?: string;
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface UserUpdateInput {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  active?: boolean;
  profileImage?: string;
  pushTokens?: string[];
  services?: string[];
  available?: boolean;
  ratingAverage?: number;
  completedJobs?: number;
  password?: string;
}
