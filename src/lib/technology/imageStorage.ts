import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { compressImage } from "@/lib/imageUtils";

export const MAX_TECHNOLOGY_IMAGES = 5;

export const uploadTechnologyProductImages = async (productId: string, files: File[]) => {
  const filesToUpload = files.slice(0, MAX_TECHNOLOGY_IMAGES);
  return Promise.all(filesToUpload.map(async (file, index) => {
    const compressed = await compressImage(file);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const storageRef = ref(storage, `tecnologia_productos/${productId}/${Date.now()}-${index}-${safeName}`);
    await uploadBytes(storageRef, compressed, { contentType: compressed.type || "image/jpeg", cacheControl: "public,max-age=31536000" });
    return getDownloadURL(storageRef);
  }));
};

export const removeTechnologyProductImage = async (url: string) => {
  try { await deleteObject(ref(storage, url)); } catch (error) { console.warn("No se pudo eliminar la imagen de Storage:", error); }
};

export const uploadTechnologyHomeImage = async (file: File) => {
  const compressed = await compressImage(file);
  const storageRef = ref(storage, `tecnologia_inicio/${Date.now()}-hero-${file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")}`);
  await uploadBytes(storageRef, compressed, { contentType: compressed.type || "image/jpeg", cacheControl: "public,max-age=31536000" });
  return getDownloadURL(storageRef);
};

export const removeTechnologyHomeImage = async (url: string) => {
  try { await deleteObject(ref(storage, url)); } catch (error) { console.warn("No se pudo eliminar la imagen principal de tecnología:", error); }
};
