import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AdminUser, AppUser } from '../types/user';

const mapUserProfile = (uid: string, data: unknown): AppUser => {
  const profile = data as Omit<AppUser, 'uid'> & { uid?: string };
  return { ...profile, uid: profile.uid ?? uid } as AppUser;
};

export async function getCurrentUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return mapUserProfile(uid, snapshot.data());
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getCurrentUserProfile(credentials.user.uid);

  if (!profile || profile.role !== 'admin') {
    await signOut(auth);
    throw new Error('This account is not authorized for admin dashboard access.');
  }

  return profile;
}

export function logout() {
  return signOut(auth);
}
