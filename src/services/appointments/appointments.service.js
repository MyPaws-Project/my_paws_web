import { db } from "../firebase/firebase";
import { auth } from "../firebase/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

const appointmentsRef = collection(db, "appointments");

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  return user;
}

export async function createAppointment(data) {
  const user = requireUser();

  const payload = {
    clinicId: data.clinicId || user.uid,
    vetId: data.vetId || user.uid,
    clientId: data.clientId,
    petId: data.petId || null,
    startTime: data.startTime,
    endTime: data.endTime,
    reason: data.reason || "",
    status: data.status || "scheduled",
    notes: data.notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(appointmentsRef, payload);
  return ref.id;
}

export async function getAppointment(appointmentId) {
  const ref = doc(db, "appointments", appointmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateAppointment(appointmentId, data) {
  const ref = doc(db, "appointments", appointmentId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAppointment(appointmentId) {
  const ref = doc(db, "appointments", appointmentId);
  await deleteDoc(ref);
}

export async function listAppointmentsForVet(vetId) {
  const user = requireUser();

  const q = query(
    appointmentsRef,
    where("clinicId", "==", user.uid),
    where("vetId", "==", vetId),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * @param {string} vetId
 * @param {Date} startDate
 * @param {Date} endDate
 */
export async function listAppointmentsForVetInRange(vetId, startDate, endDate) {
  const user = requireUser();

  const start = Timestamp.fromDate(startDate);
  const end = Timestamp.fromDate(endDate);

  const q = query(
    appointmentsRef,
    where("clinicId", "==", user.uid),
    where("vetId", "==", vetId),
    where("startTime", ">=", start),
    where("startTime", "<", end),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAppointmentsForClient(clientId) {
  const user = requireUser();

  const q = query(
    appointmentsRef,
    where("clinicId", "==", user.uid),
    where("clientId", "==", clientId),
    orderBy("startTime", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * @param {string} clientId
 * @param {Date} startDate
 * @param {Date} endDate
 */
export async function listAppointmentsForClientInRange(clientId, startDate, endDate) {
  const user = requireUser();

  const start = Timestamp.fromDate(startDate);
  const end = Timestamp.fromDate(endDate);

  const q = query(
    appointmentsRef,
    where("clinicId", "==", user.uid),
    where("clientId", "==", clientId),
    where("startTime", ">=", start),
    where("startTime", "<", end),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
