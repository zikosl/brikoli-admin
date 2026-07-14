import type { DateValue } from './user';

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

export interface RequestAssignmentUser {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface RequestAssignment {
  id: string;
  requestId: string;
  workerId: string;
  previousWorkerId: string | null;
  note: string;
  createdAt: DateValue;
  worker?: RequestAssignmentUser | null;
  previousWorker?: RequestAssignmentUser | null;
  assignedBy?: RequestAssignmentUser | null;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientPhoneKey?: string;
  telegramId?: string;
  serviceId: string;
  serviceName: string;
  description: string;
  address: string;
  city: string;
  urgency: RequestUrgency;
  preferredDate?: DateValue;
  images: string[];
  location?: RequestLocation | null;
  status: RequestStatus;
  assignedWorkerId: string | null;
  assignedWorkerName: string | null;
  adminNotes: string;
  workerNotes: string;
  completionImages: string[];
  assignmentHistory: RequestAssignment[];
  source?: 'app' | 'telegram';
  createdAt: DateValue;
  updatedAt: DateValue;
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
