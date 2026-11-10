import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type ShirtDesign = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  colors: string[];
  published: boolean;
};

export const shirtDesignsCollection = "disenos_camisetas";

export const subscribeShirtDesigns = (onChange: (items: ShirtDesign[]) => void) =>
  onSnapshot(query(collection(db, shirtDesignsCollection), orderBy("createdAt", "desc")), (snapshot) =>
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ShirtDesign, "id">) }))),
  );

export const subscribePublishedShirtDesigns = (onChange: (items: ShirtDesign[]) => void) =>
  onSnapshot(query(collection(db, shirtDesignsCollection), where("published", "==", true)), (snapshot) =>
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ShirtDesign, "id">) }))),
  );

export const createShirtDesign = async (input: Omit<ShirtDesign, "id" | "imageUrl">, image: File) => {
  const imageRef = ref(storage, `disenos_camisetas/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`);
  await uploadBytes(imageRef, image, { contentType: image.type, cacheControl: "public,max-age=31536000" });
  const imageUrl = await getDownloadURL(imageRef);
  return addDoc(collection(db, shirtDesignsCollection), { ...input, imageUrl, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

export const updateShirtDesign = async (id: string, input: Partial<Omit<ShirtDesign, "id">>, image?: File) => {
  let imageUrl: string | undefined;
  if (image) {
    const imageRef = ref(storage, `disenos_camisetas/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`);
    await uploadBytes(imageRef, image, { contentType: image.type, cacheControl: "public,max-age=31536000" });
    imageUrl = await getDownloadURL(imageRef);
  }
  return updateDoc(doc(db, shirtDesignsCollection, id), { ...input, ...(imageUrl ? { imageUrl } : {}), updatedAt: serverTimestamp() });
};

export const deleteShirtDesign = async (id: string) => deleteDoc(doc(db, shirtDesignsCollection, id));
