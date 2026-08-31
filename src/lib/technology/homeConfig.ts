import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const technologyHomeConfigPath = ["tecnologia_configuracion", "inicio"] as const;

export type TechnologyHomeConfig = {
  title: string;
  description: string;
  imageUrl: string;
  eyebrow: string;
};

export const defaultTechnologyHomeConfig: TechnologyHomeConfig = {
  eyebrow: "Tecnología",
  title: "Tecnología que impulsa tus proyectos",
  description: "Equipos seleccionados, verificados y listos para acompañarte en cada proyecto.",
  imageUrl: "",
};

const configRef = doc(db, technologyHomeConfigPath[0], technologyHomeConfigPath[1]);

export const subscribeTechnologyHomeConfig = (onChange: (config: TechnologyHomeConfig) => void) =>
  onSnapshot(configRef, (snapshot) => {
    if (!snapshot.exists()) return onChange(defaultTechnologyHomeConfig);
    onChange({ ...defaultTechnologyHomeConfig, ...(snapshot.data() as Partial<TechnologyHomeConfig>) });
  });

export const saveTechnologyHomeConfig = async (config: TechnologyHomeConfig) =>
  setDoc(configRef, { ...config, updatedAt: serverTimestamp() }, { merge: true });
