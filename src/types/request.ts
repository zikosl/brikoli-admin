import type { Timestamp } from 'firebase/firestore';

export type RequestStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type RequestUrgency = 'normal' | 'urgent';

export interface RequestLocation {
  latitude: number;
  longitude: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  description: string;
  address: string;
  city: string;
  urgency: RequestUrgency;
  preferredDate?: Timestamp | null;
  images: string[];
  location?: RequestLocation | null;
  status: RequestStatus;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  adminNotes: string;
  workerNotes: string;
  completionImages: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface RequestFiltersState {
  search: string;
  status: RequestStatus | 'all';
  city: string;
  serviceId: string;
  urgentOnly: boolean;
}

export interface RequestUpdateInput {
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  adminNotes?: string;
  status?: RequestStatus;
}
