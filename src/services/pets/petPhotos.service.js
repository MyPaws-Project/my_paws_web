import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

export async function addPetPhoto(clientId, petId, photo) {
  const ref = collection(db, "clients", clientId, "pets", petId, "photos");

  const docRef = await addDoc(ref, {
    url: photo.url,
    publicId: photo.publicId,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function listPetPhotos(clientId, petId) {
  const ref = collection(db, "clients", clientId, "pets", petId, "photos");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
