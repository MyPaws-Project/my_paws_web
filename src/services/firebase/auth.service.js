import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { geocodeAddress } from '../../services/firebase/geocoding';

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const register = async (email, password, extra = {}) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const clinicName = (extra?.clinicName ?? '').trim();
  const clinicAddress = (extra?.clinicAddress ?? '').trim();
  const coordinates = clinicAddress ? await geocodeAddress(clinicAddress) : null;

  const uid = cred.user.uid;

  await setDoc(doc(db, 'users', uid), {
    email: cred.user.email,
    role: 'vet',
    clinicId: uid,
    clinicName: clinicName || '',
    clinicAddress: clinicAddress || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    coordinates: coordinates ?? null,
  });

  await setDoc(doc(db, 'publicUsers', uid), {
    clinicName: clinicName || '',
    coordinates: coordinates ?? null,
    updatedAt: serverTimestamp(),
    active: true,
  });

  return cred;
};

export const updateClinicProfile = async (extra = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const clinicName = (extra?.clinicName ?? '').trim();
  const clinicAddress = (extra?.clinicAddress ?? '').trim();
  const coordinates = clinicAddress ? await geocodeAddress(clinicAddress) : null;

  const uid = user.uid;

  await updateDoc(doc(db, 'users', uid), {
    clinicId: uid,
    clinicName: clinicName || '',
    clinicAddress: clinicAddress || '',
    coordinates: coordinates ?? null,
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'publicUsers', uid), {
    clinicName: clinicName || '',
    coordinates: coordinates ?? null,
    updatedAt: serverTimestamp(),
    active: true,
  });
};


export const logout = () => signOut(auth);
