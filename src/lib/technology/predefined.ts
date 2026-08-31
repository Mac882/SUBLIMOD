import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TechnologyCategory } from "./types";

const technologyCategoriesCollection = "tecnologia_categorias";

export const PREDEFINED_TECHNOLOGY_CATEGORIES: Omit<TechnologyCategory, "id">[] = [
  {
    name: "Laptops", slug: "laptops", description: "Computadoras portátiles y notebooks.", visible: true, order: 10,
    specificationFields: [
      ["modelName", "Nombre del modelo", false], ["screenSize", "Tamaño de pantalla", false], ["specialFeature", "Característica especial", false],
      ["graphics", "Descripción de la tarjeta gráfica", false], ["storageType", "Tecnología del disco duro", false], ["weight", "Peso", false],
      ["specificUses", "Usos específicos del producto", false], ["formFactor", "Factor de forma", false], ["driveInterface", "Interfaz del disco duro", false],
      ["compatibleDevices", "Dispositivos compatibles", false], ["warrantyType", "Tipo de garantía", false], ["videoOutput", "Salida de vídeo", false], ["osFamily", "Familia del sistema operativo", false],
    ].map(([id, label, required], index) => ({ id: String(id), label: String(label), type: "text" as const, required: Boolean(required), order: index + 1 })),
  },
  {
    name: "Computadoras de escritorio", slug: "computadoras-escritorio", description: "Computadoras de escritorio y equipos de oficina o trabajo.", visible: true, order: 20,
    specificationFields: [
      ["modelNumber", "Número de modelo", false], ["modelName", "Nombre del modelo", false], ["graphics", "Tarjeta gráfica", false], ["formFactor", "Factor de forma", false],
      ["equipmentType", "Tipo de equipo", false], ["included", "Contenido de la caja", false], ["videoOutput", "Salida de vídeo", false], ["warranty", "Descripción de la garantía", false], ["compatibleDevices", "Dispositivos compatibles", false],
    ].map(([id, label, required], index) => ({ id: String(id), label: String(label), type: "text" as const, required: Boolean(required), order: index + 1 })),
  },
  {
    name: "Monitores", slug: "monitores", description: "Monitores y pantallas para computadora.", visible: true, order: 30,
    specificationFields: [
      ["modelNumber", "Número de modelo", false], ["modelName", "Nombre del modelo", false], ["aspectRatio", "Relación de aspecto", false], ["panelType", "Tipo de panel", false],
      ["responseTime", "Tiempo de respuesta", false], ["screenSurface", "Descripción de la superficie de pantalla", false], ["viewingAngle", "Ángulo de visión", false],
      ["features", "Características del producto", false], ["videoInputs", "Entradas / salidas de vídeo", false], ["warranty", "Descripción de la garantía", false], ["included", "Contenido de la caja", false],
    ].map(([id, label, required], index) => ({ id: String(id), label: String(label), type: "text" as const, required: Boolean(required), order: index + 1 })),
  },
];

const RESERVED_FILTER_FIELD_IDS = new Set(["brand", "cpu", "ram", "storage", "os", "color", "screenSize", "resolution", "refreshRate", "processorManufacturer"]);
let initializationPromise: Promise<void> | null = null;

export const ensurePredefinedTechnologyCategories = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      for (const category of PREDEFINED_TECHNOLOGY_CATEGORIES) {
        const existing = await getDocs(query(collection(db, technologyCategoriesCollection), where("slug", "==", category.slug)));
        if (existing.empty) {
          await addDoc(collection(db, technologyCategoriesCollection), { ...category, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          continue;
        }
        const current = existing.docs[0];
        const currentData = current.data() as Partial<TechnologyCategory>;
        const currentFields = Array.isArray(currentData.specificationFields) ? currentData.specificationFields : [];
        const cleaned = currentFields.filter((field) => !RESERVED_FILTER_FIELD_IDS.has(String(field.id)));
        const existingIds = new Set(cleaned.map((field) => String(field.id)));
        const missing = category.specificationFields.filter((field) => !existingIds.has(field.id));
        const nextFields = [...cleaned, ...missing].map((field, index) => ({ ...field, order: index + 1 }));
        await updateDoc(doc(db, technologyCategoriesCollection, current.id), { specificationFields: nextFields, updatedAt: serverTimestamp() });
      }
    })().catch((error) => { initializationPromise = null; throw error; });
  }
  return initializationPromise;
};
