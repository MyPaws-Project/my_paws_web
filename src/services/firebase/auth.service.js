import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebase';

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const register = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, 'users', cred.user.uid), {
    email: cred.user.email,
    role: 'vet',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred;
};

export const logout = () => signOut(auth);
