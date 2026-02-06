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
  where,
} from 'firebase/firestore';

import { db, auth } from '../firebase/firebase';

const clientsCol = collection(db, 'clients');

export async function getClients() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    clientsCol,
    where('clinicId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getClientById(clientId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  if (data.clinicId !== user.uid) return null;

  return {
    id: snap.id,
    ...data,
  };
}

export async function createClient(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const payload = {
    clinicId: user.uid,
    fullName: data.fullName ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
    notes: data.notes ?? '',
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(clientsCol, payload);
  return ref.id;
}

export async function updateClient(clientId, data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId);

  const { clinicId, createdAt, ...safeData } = data ?? {};

  const payload = {
    ...safeData,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, payload);
}

export async function disableClient(clientId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId);

  await updateDoc(ref, {
    active: false,
    updatedAt: serverTimestamp(),
  });
}
