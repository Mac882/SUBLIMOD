import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TechnologyFilterKey =
  | "brand"
  | "processor"
  | "ram"
  | "storage"
  | "os"
  | "color"
  | "screenSize"
  | "resolution"
  | "refreshRate";

export type TechnologyFilterOption = {
  id?: string;
  key: TechnologyFilterKey;
  value: string;
  normalized: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const technologyFilterOptionsCollection = "tecnologia_filtros";

export const normalizeTechnologyFilterValue = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-NI");

export const subscribeTechnologyFilterOptions = (
  key: TechnologyFilterKey,
  onChange: (items: TechnologyFilterOption[]) => void,
) =>
  onSnapshot(
    query(
      collection(db, technologyFilterOptionsCollection),
      orderBy("normalized", "asc"),
    ),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<TechnologyFilterOption, "id">) }))
          .filter((item) => item.key === key),
      ),
  );

export const createTechnologyFilterOption = async (
  key: TechnologyFilterKey,
  value: string,
) => {
  const cleanValue = value.trim().replace(/\s+/g, " ");
  if (!cleanValue) return null;
  return addDoc(collection(db, technologyFilterOptionsCollection), {
    key,
    value: cleanValue,
    normalized: normalizeTechnologyFilterValue(cleanValue),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateTechnologyFilterOption = async (id: string, value: string) => {
  const cleanValue = value.trim().replace(/\s+/g, " ");
  return updateDoc(doc(db, technologyFilterOptionsCollection, id), {
    value: cleanValue,
    normalized: normalizeTechnologyFilterValue(cleanValue),
    updatedAt: serverTimestamp(),
  });
};
