import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Service, ServiceFormValues } from '../types/service';

const mapServiceDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): Service => {
  const data = snapshot.data() as Omit<Service, 'id'>;
  return { ...data, id: snapshot.id };
};

export async function getServices() {
  const snapshot = await getDocs(query(collection(db, 'services'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(mapServiceDoc);
}

export async function createService(values: ServiceFormValues) {
  const ref = await addDoc(collection(db, 'services'), {
    ...values,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateService(serviceId: string, values: Partial<ServiceFormValues>) {
  await updateDoc(doc(db, 'services', serviceId), {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteService(serviceId: string) {
  await deleteDoc(doc(db, 'services', serviceId));
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await updateService(serviceId, { active });
}
