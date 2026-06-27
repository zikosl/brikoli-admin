import type { Timestamp } from 'firebase/firestore';

export interface AppSettings {
  cities: string[];
  categories: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
  updatedAt: Timestamp | null;
}

export interface AppSettingsFormValues {
  cities: string[];
  categories: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
}
