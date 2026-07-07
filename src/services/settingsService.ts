import { apiFetch } from './apiClient';
import type { AppSettings, AppSettingsFormValues, ServiceCategoryOption } from '../types/settings';

type ApiServiceCategory = string | {
  id?: string | null;
  name?: string | null;
  nameAr?: string | null;
  active?: boolean | null;
};

interface ApiSettings {
  cities?: string[];
  serviceCategories?: ApiServiceCategory[];
  categories?: ApiServiceCategory[];
  supportPhone?: string;
  commissionPercentage?: number;
  emergencyEnabled?: boolean;
  updatedAt?: string | null;
}

const defaultSettings: AppSettings = {
  cities: [],
  categories: [],
  supportPhone: '',
  commissionPercentage: 0,
  emergencyEnabled: false,
  updatedAt: null,
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'category';

const normalizeCategories = (categories?: ApiServiceCategory[]): ServiceCategoryOption[] => {
  const seen = new Set<string>();

  return (categories ?? [])
    .map((category) => {
      if (typeof category === 'string') {
        const name = category.trim();
        return name ? { id: slugify(name), name, nameAr: name, active: true } : null;
      }

      const name = category.name?.trim() ?? '';
      const id = category.id?.trim() ? slugify(category.id) : slugify(name);
      const nameAr = category.nameAr?.trim() || name;

      return name ? { id, name, nameAr, active: category.active !== false } : null;
    })
    .filter((category): category is ServiceCategoryOption => {
      if (!category || seen.has(category.id)) {
        return false;
      }
      seen.add(category.id);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const mapSettings = (settings: ApiSettings): AppSettings => ({
  ...defaultSettings,
  cities: settings.cities ?? [],
  categories: normalizeCategories(settings.serviceCategories ?? settings.categories),
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
      serviceCategories: values.categories,
      supportPhone: values.supportPhone,
      commissionPercentage: values.commissionPercentage,
      emergencyEnabled: values.emergencyEnabled,
    }),
  });
}
