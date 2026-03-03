import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

const petsCol = (clientId) => collection(db, 'clients', clientId, 'pets');

export async function getPetsByClient(clientId) {
  const user = auth.currentUser;
  if (!user) return [];

  const base = petsCol(clientId);

  const q = query(base, orderBy('createdAt', 'desc'));

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getPetById(clientId, petId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId, 'pets', petId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
}

export async function createPet(clientId, data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const weight =
    data.weight === '' || data.weight == null
      ? null
      : Number(data.weight);

  const payload = {
    name: (data.name ?? '').trim(),
    species: data.species ?? '',
    breed: data.breed ?? '',
    gender: data.gender ?? '',
    birthDate: data.birthDate ?? '',

    weight: Number.isFinite(weight) ? weight : null,

    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    illnesses: Array.isArray(data.illnesses) ? data.illnesses : [],
    medication: Array.isArray(data.medication) ? data.medication : [],

    notes: data.notes ?? '',
    active: true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(petsCol(clientId), payload);
  return ref.id;
}

export async function updatePet(clientId, petId, data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  if (!data || typeof data !== 'object') throw new Error('Datos inválidos');

  const ref = doc(db, 'clients', clientId, 'pets', petId);

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    payload.name = (data.name ?? '').trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'weight')) {
    const w =
      data.weight === '' || data.weight == null
        ? null
        : Number(data.weight);

    payload.weight = Number.isFinite(w) ? w : null;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'allergies')) {
    payload.allergies = Array.isArray(data.allergies) ? data.allergies : [];
  }

  if (Object.prototype.hasOwnProperty.call(data, 'illnesses')) {
    payload.illnesses = Array.isArray(data.illnesses) ? data.illnesses : [];
  }

  if (Object.prototype.hasOwnProperty.call(data, 'medication')) {
    payload.medication = Array.isArray(data.medication) ? data.medication : [];
  }

  delete payload.createdAt;

  await updateDoc(ref, payload);
}

export async function deletePet(clientId, petId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId, 'pets', petId);
  await deleteDoc(ref);
}
