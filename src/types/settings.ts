import type { DateValue } from './user';

export interface AppSettings {
  cities: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
  updatedAt: DateValue;
}

export interface AppSettingsFormValues {
  cities: string[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
}
