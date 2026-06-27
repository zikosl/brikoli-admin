import {
  collection,
  getDocs,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rating } from '../types/rating';

const mapRatingDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): Rating => {
  const data = snapshot.data() as Omit<Rating, 'id'>;
  return { ...data, id: snapshot.id };
};

export async function getRatings() {
  const snapshot = await getDocs(query(collection(db, 'ratings'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(mapRatingDoc);
}
