import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppSettings, AppSettingsFormValues } from '../types/settings';
import { SETTINGS_DOC_ID } from '../utils/constants';

const defaultSettings: AppSettings = {
  cities: [],
  categories: [],
  supportPhone: '',
  commissionPercentage: 0,
  emergencyEnabled: false,
  updatedAt: null,
};

export async function getSettings() {
  const snapshot = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID));

  if (!snapshot.exists()) {
    return defaultSettings;
  }

  return { ...defaultSettings, ...(snapshot.data() as Partial<AppSettings>) };
}

export async function updateSettings(values: AppSettingsFormValues) {
  await setDoc(
    doc(db, 'settings', SETTINGS_DOC_ID),
    {
      ...values,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
