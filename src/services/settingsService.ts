import { apiFetch } from './apiClient';
import type { AppSettings, AppSettingsFormValues } from '../types/settings';

interface ApiSettings {
  cities?: string[];
  supportPhone?: string;
  commissionPercentage?: number;
  emergencyEnabled?: boolean;
  updatedAt?: string | null;
}

const defaultSettings: AppSettings = {
  cities: [],
  supportPhone: '',
  commissionPercentage: 0,
  emergencyEnabled: false,
  updatedAt: null,
};

const mapSettings = (settings: ApiSettings): AppSettings => ({
  ...defaultSettings,
  cities: settings.cities ?? [],
  supportPhone: settings.supportPhone ?? '',
  commissionPercentage: settings.commissionPercentage ?? 0,
  emergencyEnabled: settings.emergencyEnabled ?? false,
  updatedAt: settings.updatedAt ?? null,
});

export async function getSettings() {
  const settings = await apiFetch<ApiSettings>('/settings/platform', { auth: false });
  return mapSettings(settings);
}

export async function updateSettings(values: AppSettingsFormValues) {
  await apiFetch('/settings/platform', {
    method: 'PUT',
    body: JSON.stringify({
      cities: values.cities,
      supportPhone: values.supportPhone,
      commissionPercentage: values.commissionPercentage,
      emergencyEnabled: values.emergencyEnabled,
    }),
  });
}
