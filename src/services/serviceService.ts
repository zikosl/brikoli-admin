import { apiFetch } from './apiClient';
import type { Service, ServiceFormValues } from '../types/service';

interface ApiService {
  id: string;
  name: string;
  nameAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  category: string;
  categoryAr?: string | null;
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
  category: service.category,
  categoryAr: service.categoryAr ?? '',
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
