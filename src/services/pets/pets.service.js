import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const petsCol = (clientId) => collection(db, 'clients', clientId, 'pets');

export async function getPetsByClient(clientId) {
  const q = query(petsCol(clientId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getPetById(clientId, petId) {
  const ref = doc(db, 'clients', clientId, 'pets', petId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
}

export async function createPet(clientId, data) {
  const payload = {
    name: data.name ?? '',
    species: data.species ?? '',
    breed: data.breed ?? '',
    sex: data.sex ?? '',
    birthDate: data.birthDate ?? '',
    notes: data.notes ?? '',
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(petsCol(clientId), payload);
  return ref.id;
}

export async function updatePet(clientId, petId, data) {
  const ref = doc(db, 'clients', clientId, 'pets', petId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deletePet(clientId, petId) {
  const ref = doc(db, 'clients', clientId, 'pets', petId);
  await deleteDoc(ref);
}
