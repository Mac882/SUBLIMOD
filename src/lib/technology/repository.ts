import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TechnologyCategory, TechnologyProduct } from "./types";

export const technologyCategoriesCollection = "tecnologia_categorias";
export const technologyProductsCollection = "tecnologia_productos";

export const subscribeTechnologyCategories = (onChange: (items: TechnologyCategory[]) => void) =>
  onSnapshot(
    query(collection(db, technologyCategoriesCollection), orderBy("order", "asc")),
    (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<TechnologyCategory, "id">) }))),
  );

export const subscribeTechnologyProducts = (onChange: (items: TechnologyProduct[]) => void) =>
  onSnapshot(
    query(collection(db, technologyProductsCollection), orderBy("createdAt", "desc")),
    (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<TechnologyProduct, "id">) }))),
  );

export const createTechnologyCategory = async (category: Omit<TechnologyCategory, "id">) =>
  addDoc(collection(db, technologyCategoriesCollection), { ...category, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateTechnologyCategory = async (id: string, category: Partial<TechnologyCategory>) =>
  updateDoc(doc(db, technologyCategoriesCollection, id), { ...category, updatedAt: serverTimestamp() });

export const deleteTechnologyCategory = async (id: string) => deleteDoc(doc(db, technologyCategoriesCollection, id));

export const createTechnologyProduct = async (product: Omit<TechnologyProduct, "id">) =>
  addDoc(collection(db, technologyProductsCollection), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateTechnologyProduct = async (id: string, product: Partial<TechnologyProduct>) =>
  updateDoc(doc(db, technologyProductsCollection, id), { ...product, updatedAt: serverTimestamp() });

export const deleteTechnologyProduct = async (id: string) => deleteDoc(doc(db, technologyProductsCollection, id));
