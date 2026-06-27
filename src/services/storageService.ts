import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();

export async function uploadImage(file: File, path: string) {
  const fileRef = ref(storage, `${path}/${Date.now()}-${sanitizeFileName(file.name)}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
