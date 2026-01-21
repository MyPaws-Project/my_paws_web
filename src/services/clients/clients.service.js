import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const clientsCol = collection(db, 'clients');

export async function getClients() {
  const q = query(clientsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getClientById(clientId) {
  const ref = doc(db, 'clients', clientId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}


export async function createClient(data) {
  const payload = {
    fullName: data.fullName ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
    notes: data.notes ?? '',
    active: true,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(clientsCol, payload);
  return ref.id;
}

export async function updateClient(clientId, data) {
  const ref = doc(db, 'clients', clientId);

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, payload);
}

export async function disableClient(clientId) {
  const ref = doc(db, 'clients', clientId);
  await updateDoc(ref, { active: false, updatedAt: serverTimestamp() });
}
