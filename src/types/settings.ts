import type { DateValue } from './user';

export interface ServiceCategoryOption {
  id: string;
  name: string;
  nameAr: string;
  active: boolean;
}

export interface AppSettings {
  cities: string[];
  categories: ServiceCategoryOption[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
  updatedAt: DateValue;
}

export interface AppSettingsFormValues {
  cities: string[];
  categories: ServiceCategoryOption[];
  supportPhone: string;
  commissionPercentage: number;
  emergencyEnabled: boolean;
}
