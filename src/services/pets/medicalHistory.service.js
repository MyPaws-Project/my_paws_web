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
    date: data.date || '',
    reason: data.reason || '',
    diagnosis: data.diagnosis || '',
    treatment: data.treatment || '',
    notes: data.notes || '',
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
  await updateDoc(historyDoc(clientId, petId, entryId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHistoryEntry(clientId, petId, entryId) {
  await deleteDoc(historyDoc(clientId, petId, entryId));
}
