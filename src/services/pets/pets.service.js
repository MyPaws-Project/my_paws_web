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
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

const petsCol = (clientId) => collection(db, 'clients', clientId, 'pets');

export async function getPetsByClient(clientId, { includeInactive = false } = {}) {
  const user = auth.currentUser;
  if (!user) return [];

  const base = petsCol(clientId);

  const q = includeInactive
    ? query(base, orderBy('createdAt', 'desc'))
    : query(base, where('active', '==', true), orderBy('createdAt', 'desc'));

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

  const weight = data.weightKg;
  const weightKg =
    weight === '' || weight == null ? null : Number(weight);

  const payload = {
    name: (data.name ?? '').trim(),
    species: data.species ?? '',
    breed: data.breed ?? '',
    sex: data.sex ?? '',
    birthDate: data.birthDate ?? '',

    weightKg: Number.isFinite(weightKg) ? weightKg : null,

    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    chronicIllnesses: Array.isArray(data.chronicIllnesses) ? data.chronicIllnesses : [],
    currentMedication: Array.isArray(data.currentMedication) ? data.currentMedication : [],

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

  const ref = doc(db, 'clients', clientId, 'pets', petId);

  const weight = data?.weightKg;
  const weightKg =
    weight === '' || weight == null ? null : Number(weight);

  const payload = {
    ...data,
    name: (data?.name ?? '').trim(),
    weightKg: Number.isFinite(weightKg) ? weightKg : null,
    updatedAt: serverTimestamp(),
  };

  if (!Array.isArray(payload.allergies)) payload.allergies = [];
  if (!Array.isArray(payload.chronicIllnesses)) payload.chronicIllnesses = [];
  if (!Array.isArray(payload.currentMedication)) payload.currentMedication = [];

  delete payload.createdAt;

  await updateDoc(ref, payload);
}

export async function disablePet(clientId, petId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId, 'pets', petId);
  await updateDoc(ref, { active: false, updatedAt: serverTimestamp() });
}

export async function reactivatePet(clientId, petId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const ref = doc(db, 'clients', clientId, 'pets', petId);
  await updateDoc(ref, { active: true, updatedAt: serverTimestamp() });
}
