import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { uploadClinicImage } from "../cloudinary/cloudinary.service";

export async function uploadAndSaveClinicLogo(file, clinicId) {
  const result = await uploadClinicImage(file, clinicId);

  await setDoc(
    doc(db, "publicUsers", clinicId),
    {
      logoURL: result.url,
      logoPublicId: result.publicId,
      updatedAt: serverTimestamp(),
      active: true,
    },
    { merge: true }
  );

  return result;
}