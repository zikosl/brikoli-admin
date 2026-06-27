import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RequestStatus, RequestUpdateInput, ServiceRequest } from '../types/request';
import type { WorkerUser } from '../types/user';

const mapRequestDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): ServiceRequest => {
  const data = snapshot.data() as Omit<ServiceRequest, 'id'>;
  return { ...data, id: snapshot.id };
};

export async function getRequests() {
  const snapshot = await getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(mapRequestDoc);
}

export async function getRequestById(requestId: string) {
  const snapshot = await getDoc(doc(db, 'requests', requestId));

  if (!snapshot.exists()) {
    return null;
  }

  return { ...(snapshot.data() as Omit<ServiceRequest, 'id'>), id: snapshot.id };
}

export async function updateRequest(requestId: string, updates: RequestUpdateInput) {
  await updateDoc(doc(db, 'requests', requestId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function assignWorkerToRequest(requestId: string, worker: Pick<WorkerUser, 'uid' | 'fullName'>) {
  await updateRequest(requestId, {
    assignedWorkerId: worker.uid,
    assignedWorkerName: worker.fullName,
    status: 'assigned',
  });
}

export async function cancelRequest(requestId: string) {
  await updateRequest(requestId, { status: 'cancelled' });
}

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  await updateRequest(requestId, { status });
}
