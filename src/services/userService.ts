import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppUser, ClientUser, UserUpdateInput, WorkerInvite, WorkerProfileFormValues, WorkerUser } from '../types/user';

const mapUserDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): AppUser => {
  const data = snapshot.data() as Omit<AppUser, 'uid'> & { uid?: string };
  return { ...data, uid: data.uid ?? snapshot.id } as AppUser;
};

const mapWorkerInviteDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): WorkerInvite => {
  const data = snapshot.data() as Omit<WorkerInvite, 'id'>;
  return { ...data, id: snapshot.id };
};

const sortByName = <T extends { fullName: string }>(users: T[]) =>
  [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));

const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

export async function getUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return sortByName(snapshot.docs.map(mapUserDoc));
}

export async function getWorkers() {
  const users = await getUsers();
  return users.filter((user): user is WorkerUser => user.role === 'worker');
}

export async function getWorkerInvites() {
  const snapshot = await getDocs(collection(db, 'workerInvites'));
  return sortByName(snapshot.docs.map(mapWorkerInviteDoc).filter((invite) => !invite.claimed));
}

export async function getClients() {
  const users = await getUsers();
  return users.filter((user): user is ClientUser => user.role === 'client');
}

export async function createWorkerProfile(values: WorkerProfileFormValues) {
  const email = normalizeInviteEmail(values.email);
  const ref = doc(db, 'workerInvites', email);
  const existingInvite = await getDoc(ref);

  await setDoc(
    ref,
    {
      role: 'worker',
      fullName: values.fullName,
      email,
      phoneNumber: values.phoneNumber,
      services: values.services,
      city: values.city,
      available: values.available,
      active: values.active,
      profileImage: values.profileImage,
      claimed: false,
      createdAt: existingInvite.exists() ? existingInvite.get('createdAt') : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return email;
}

export async function updateUser(uid: string, updates: UserUpdateInput) {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleUserActive(uid: string, active: boolean) {
  await updateUser(uid, { active });
}
