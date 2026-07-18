import { apiFetch } from './apiClient';
import type { Service, ServiceFormValues } from '../types/service';

interface ApiService {
  id: string;
  name: string;
  nameAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  category: string;
  categoryAr?: string | null;
  categoryRef?: {
    id: string;
    title: string;
    titleAr?: string | null;
  } | null;
  subCategory?: {
    id: string;
    title: string;
    titleAr?: string | null;
  } | null;
  image?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const mapService = (service: ApiService): Service => ({
  id: service.id,
  name: service.name,
  nameAr: service.nameAr ?? '',
  description: service.description,
  descriptionAr: service.descriptionAr ?? '',
  categoryId: service.categoryId ?? service.categoryRef?.id ?? '',
  subCategoryId: service.subCategoryId ?? service.subCategory?.id ?? '',
  category: service.category,
  categoryAr: service.categoryAr ?? '',
  categoryTitle: service.categoryRef?.title ?? service.category,
  categoryTitleAr: service.categoryRef?.titleAr ?? service.categoryAr ?? '',
  subCategoryTitle: service.subCategory?.title ?? '',
  subCategoryTitleAr: service.subCategory?.titleAr ?? '',
  image: service.image ?? '',
  active: service.active,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

export async function getServices() {
  const services = await apiFetch<ApiService[]>('/services');
  return services.map(mapService);
}

export async function createService(values: ServiceFormValues) {
  const service = await apiFetch<ApiService>('/services', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return service.id;
}

export async function updateService(serviceId: string, values: Partial<ServiceFormValues>) {
  await apiFetch<ApiService>(`/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export async function deleteService(serviceId: string) {
  await apiFetch<ApiService>(`/services/${serviceId}`, {
    method: 'DELETE',
  });
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await updateService(serviceId, { active });
}
