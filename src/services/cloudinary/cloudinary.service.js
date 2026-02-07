const CLOUD_NAME = "daw1qkmqz";
const UPLOAD_PRESET = "mypaws_pets";

export async function uploadPetImage(file, clientId, petId) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `mypaws/clients/${clientId}/pets/${petId}`);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error("Error uploading image");
  }

  return { url: data.secure_url, publicId: data.public_id };
}
