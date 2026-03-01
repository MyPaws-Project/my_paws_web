const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PETS_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PETS;
const CLINIC_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_CLINIC;

export async function uploadPetImage(file, clientId, petId) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", PETS_PRESET);
  formData.append("folder", `mypaws/clients/${clientId}/pets/${petId}`);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error("Error uploading image");
  }

  return { url: data.secure_url, publicId: data.public_id };
}

export async function uploadClinicImage(file, clinicId) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLINIC_PRESET);
  formData.append("folder", `mypaws/clinics/${clinicId}/profile`);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error("Error uploading clinic image");
  }

  return { url: data.secure_url, publicId: data.public_id };
}
