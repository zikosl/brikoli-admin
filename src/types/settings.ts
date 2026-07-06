import type { DateValue } from './user';

export interface AppSettings {
  cities: string[];
  categories: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
  updatedAt: DateValue;
}

export interface AppSettingsFormValues {
  cities: string[];
  categories: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
}
