import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const historyCol = (clientId, petId) =>
  collection(db, 'clients', clientId, 'pets', petId, 'medicalHistory');

const historyDoc = (clientId, petId, entryId) =>
  doc(db, 'clients', clientId, 'pets', petId, 'medicalHistory', entryId);

export async function createHistoryEntry(clientId, petId, data) {
  const payload = {
    date: (data?.date ?? '').trim(),
    reason: (data?.reason ?? '').trim(),
    diagnosis: (data?.diagnosis ?? '').trim(),
    treatment: (data?.treatment ?? '').trim(),
    notes: (data?.notes ?? '').trim(),
    photos: Array.isArray(data?.photos) ? data.photos : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(historyCol(clientId, petId), payload);
  return ref.id;
}

export async function listHistoryEntries(clientId, petId) {
  const q = query(historyCol(clientId, petId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getHistoryEntry(clientId, petId, entryId) {
  const snap = await getDoc(historyDoc(clientId, petId, entryId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateHistoryEntry(clientId, petId, entryId, data) {
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  delete payload.createdAt;

  await updateDoc(historyDoc(clientId, petId, entryId), payload);
}

export async function deleteHistoryEntry(clientId, petId, entryId) {
  await deleteDoc(historyDoc(clientId, petId, entryId));
}
