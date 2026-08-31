import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TechnologyCategory, TechnologyProduct } from "./types";
import { ensurePredefinedTechnologyCategories } from "./predefined";
export { createTechnologyFilterOption, subscribeTechnologyFilterOptions, updateTechnologyFilterOption } from "./filterCatalog";

export const technologyCategoriesCollection = "tecnologia_categorias";
export const technologyProductsCollection = "tecnologia_productos";

// The admin product list renders an <img> even when a product has no uploaded image yet.
// Keep the placeholder UI-only so empty strings are never passed to the browser as src.
export const TECHNOLOGY_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23181818'/%3E%3Ctext x='320' y='240' text-anchor='middle' dominant-baseline='middle' fill='%23666666' font-family='Arial,sans-serif' font-size='28'%3ESin imagen%3C/text%3E%3C/svg%3E";

const normalizeTechnologyProductForUi = (product: TechnologyProduct): TechnologyProduct => ({
  ...product,
  coverImage: product.coverImage || product.images?.[0] || TECHNOLOGY_IMAGE_PLACEHOLDER,
});

const stripTechnologyPlaceholder = <T extends Partial<TechnologyProduct>>(product: T): T => {
  if (product.coverImage === TECHNOLOGY_IMAGE_PLACEHOLDER) {
    return { ...product, coverImage: "" };
  }
  return product;
};

export const subscribeTechnologyCategories = (onChange: (items: TechnologyCategory[]) => void) => {
  void ensurePredefinedTechnologyCategories().catch((error) => {
    console.error("No se pudieron inicializar las categorías predefinidas de tecnología:", error);
  });
  return onSnapshot(query(collection(db, technologyCategoriesCollection), orderBy("order", "asc")), (snapshot) =>
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<TechnologyCategory, "id">) }))),
  );
};

export const subscribeTechnologyProducts = (onChange: (items: TechnologyProduct[]) => void) =>
  onSnapshot(query(collection(db, technologyProductsCollection), orderBy("createdAt", "desc")), (snapshot) =>
    onChange(snapshot.docs.map((item) => normalizeTechnologyProductForUi({ id: item.id, ...(item.data() as Omit<TechnologyProduct, "id">) })) ),
  );

export const createTechnologyCategory = async (category: Omit<TechnologyCategory, "id">) =>
  addDoc(collection(db, technologyCategoriesCollection), { ...category, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateTechnologyCategory = async (id: string, category: Partial<TechnologyCategory>) =>
  updateDoc(doc(db, technologyCategoriesCollection, id), { ...category, updatedAt: serverTimestamp() });

export const deleteTechnologyCategory = async (id: string) => deleteDoc(doc(db, technologyCategoriesCollection, id));

export const createTechnologyProduct = async (product: Omit<TechnologyProduct, "id">) =>
  addDoc(collection(db, technologyProductsCollection), { ...stripTechnologyPlaceholder(product), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateTechnologyProduct = async (id: string, product: Partial<TechnologyProduct>) =>
  updateDoc(doc(db, technologyProductsCollection, id), { ...stripTechnologyPlaceholder(product), updatedAt: serverTimestamp() });

export const deleteTechnologyProduct = async (id: string) => deleteDoc(doc(db, technologyProductsCollection, id));
