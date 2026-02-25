import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { geocodeAddress } from "../../services/firebase/geocoding";

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const register = async (email, password, extra = {}) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const clinicName = (extra?.clinicName ?? "").trim();
  const clinicAddress = (extra?.clinicAddress ?? "").trim();
  const coordinates = clinicAddress ? await geocodeAddress(clinicAddress) : null;

  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    email: cred.user.email,
    role: "vet",
    clinicId: uid,
    clinicName: clinicName || "",
    clinicAddress: clinicAddress || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    coordinates: coordinates ?? null,
  });

  await setDoc(doc(db, "publicUsers", uid), {
    clinicName: clinicName || "",
    clinicAddress: clinicAddress || "",
    coordinates: coordinates ?? null,
    updatedAt: serverTimestamp(),
    active: true,
  });

  return cred;
};

export const reauthenticateUser = async (password) => {
  const user = auth.currentUser;
  if (!user) {
    const e = new Error("NOT_AUTH");
    e.code = "NOT_AUTH";
    throw e;
  }

  const email = user.email || "";
  const cred = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, cred);
};

export const updateClinicProfile = async (extra = {}) => {
  const user = auth.currentUser;
  if (!user) {
    const e = new Error("NOT_AUTH");
    e.code = "NOT_AUTH";
    throw e;
  }

  const clinicName = (extra?.clinicName ?? "").trim();
  const clinicAddress = (extra?.clinicAddress ?? "").trim();
  const nextEmail = (extra?.email ?? "").trim();

  const uid = user.uid;
  const currentEmail = user.email || "";

  const emailChanged =
    nextEmail && nextEmail.length > 0 && nextEmail !== currentEmail;

  if (emailChanged) {
    await verifyBeforeUpdateEmail(user, nextEmail);
  }

  const coordinates = clinicAddress ? await geocodeAddress(clinicAddress) : null;

  await updateDoc(doc(db, "users", uid), {
    clinicId: uid,
    clinicName: clinicName || "",
    clinicAddress: clinicAddress || "",
    email: currentEmail || "",
    pendingEmail: emailChanged ? nextEmail : null,
    coordinates: coordinates ?? null,
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "publicUsers", uid),
    {
      clinicName: clinicName || "",
      clinicAddress: clinicAddress || "",
      coordinates: coordinates ?? null,
      updatedAt: serverTimestamp(),
      active: true,
    },
    { merge: true }
  );

  return { emailVerificationSent: emailChanged };
};

export const logout = () => signOut(auth);