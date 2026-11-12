import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const normalizeCategoryName = (value: unknown) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toLowerCase();

export const isProductPubliclyVisible = (product: any, categories: any[]) => {
  if (product.activo === false) return false;

  const category = product.categoriaId
    ? categories.find((item) => item.id === product.categoriaId)
    : categories.find((item) => normalizeCategoryName(item.nombre) === normalizeCategoryName(product.categoria));

  return category?.activo !== false;
};

export const canOpenProductPublicly = async (product: any) => {
  if (product.activo === false) return false;

  if (product.categoriaId) {
    const categorySnapshot = await getDoc(doc(db, "categorias", product.categoriaId));
    return !categorySnapshot.exists() || categorySnapshot.data().activo !== false;
  }

  const categoriesSnapshot = await getDocs(collection(db, "categorias"));
  const matchingCategory = categoriesSnapshot.docs.find(
    (category) => normalizeCategoryName(category.data().nombre) === normalizeCategoryName(product.categoria),
  );
  return !matchingCategory || matchingCategory.data().activo !== false;
};
