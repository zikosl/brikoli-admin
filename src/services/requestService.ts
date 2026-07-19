import { apiFetch } from './apiClient';
import type { RequestStatus, RequestUpdateInput, RequestUrgency, ServiceRequest } from '../types/request';
import type { WorkerUser } from '../types/user';

type ApiRequestStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

type ApiRequestUrgency = 'NORMAL' | 'URGENT';

interface ApiUpload {
  id: string;
  url: string;
}

interface ApiAssignmentUser {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
}

interface ApiRequestAssignment {
  id: string;
  requestId: string;
  workerId: string;
  previousWorkerId: string | null;
  note: string;
  createdAt: string;
  worker?: ApiAssignmentUser | null;
  previousWorker?: ApiAssignmentUser | null;
  assignedBy?: ApiAssignmentUser | null;
}

interface ApiServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientPhoneKey?: string | null;
  telegramId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  serviceName: string;
  description: string;
  address: string;
  city: string;
  urgency: ApiRequestUrgency;
  preferredDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: ApiUpload[];
  status: ApiRequestStatus;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  adminNotes: string;
  workerNotes: string;
  completionImages?: ApiUpload[];
  assignmentHistory?: ApiRequestAssignment[];
  source?: 'APP' | 'TELEGRAM';
  createdAt: string;
  updatedAt: string;
}

const statusFromApi = (status: ApiRequestStatus) => status.toLowerCase() as RequestStatus;
const urgencyFromApi = (urgency: ApiRequestUrgency) => urgency.toLowerCase() as RequestUrgency;
const statusToApi = (status: RequestStatus) => status.toUpperCase() as ApiRequestStatus;

const mapRequest = (request: ApiServiceRequest): ServiceRequest => ({
  id: request.id,
  clientId: request.clientId,
  clientName: request.clientName,
  clientPhone: request.clientPhone,
  clientPhoneKey: request.clientPhoneKey ?? undefined,
  telegramId: request.telegramId ?? undefined,
  categoryId: request.categoryId ?? undefined,
  subCategoryId: request.subCategoryId ?? undefined,
  serviceName: request.serviceName,
  description: request.description,
  address: request.address,
  city: request.city,
  urgency: urgencyFromApi(request.urgency),
  preferredDate: request.preferredDate ?? null,
  images: request.images?.map((image) => image.url) ?? [],
  location:
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : null,
  status: statusFromApi(request.status),
  assignedWorkerId: request.assignedWorkerId,
  assignedWorkerName: request.assignedWorkerName,
  adminNotes: request.adminNotes,
  workerNotes: request.workerNotes,
  completionImages: request.completionImages?.map((image) => image.url) ?? [],
  assignmentHistory: request.assignmentHistory ?? [],
  source: request.source?.toLowerCase() as ServiceRequest['source'],
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

export async function getRequests() {
  const requests = await apiFetch<ApiServiceRequest[]>('/admin/requests');
  return requests.map(mapRequest);
}

export async function getRequestById(requestId: string) {
  const request = await apiFetch<ApiServiceRequest>(`/admin/requests/${requestId}`);
  return mapRequest(request);
}

export async function updateRequest(requestId: string, updates: RequestUpdateInput) {
  await apiFetch<ApiServiceRequest>(`/admin/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...updates,
      status: updates.status ? statusToApi(updates.status) : undefined,
    }),
  });
}

export async function assignWorkerToRequest(requestId: string, worker: Pick<WorkerUser, 'uid' | 'fullName'>, note?: string) {
  await apiFetch<ApiServiceRequest>(`/admin/requests/${requestId}/assign-worker`, {
    method: 'POST',
    body: JSON.stringify({ workerId: worker.uid, note: note?.trim() || undefined }),
  });
}

export async function cancelRequest(requestId: string) {
  await updateRequest(requestId, { status: 'cancelled' });
}

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  await updateRequest(requestId, { status });
}
