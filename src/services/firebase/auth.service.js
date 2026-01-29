import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebase';

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const register = async (email, password, extra = {}) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const clinicName = (extra?.clinicName ?? '').trim();
  const clinicAddress = (extra?.clinicAddress ?? '').trim();

  await setDoc(doc(db, 'users', cred.user.uid), {
    email: cred.user.email,
    role: 'vet',
    clinicName: clinicName || '',
    clinicAddress: clinicAddress || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred;
};

export const logout = () => signOut(auth);
