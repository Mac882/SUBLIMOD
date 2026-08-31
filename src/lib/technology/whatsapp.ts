import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const technologyWhatsappConfigRef = doc(db, "tecnologia_configuracion", "contacto");

export type TechnologyWhatsappConfig = {
  phone: string;
};

export const defaultTechnologyWhatsappConfig: TechnologyWhatsappConfig = {
  phone: "50586153695",
};

export const normalizeTechnologyWhatsapp = (phone: string) => phone.replace(/\D/g, "");

export const subscribeTechnologyWhatsapp = (onChange: (config: TechnologyWhatsappConfig) => void) =>
  onSnapshot(technologyWhatsappConfigRef, (snapshot) => {
    if (!snapshot.exists()) return onChange(defaultTechnologyWhatsappConfig);
    const phone = normalizeTechnologyWhatsapp(String(snapshot.data().phone || ""));
    onChange({ phone: phone || defaultTechnologyWhatsappConfig.phone });
  });

export const saveTechnologyWhatsapp = async (phone: string) => {
  const normalized = normalizeTechnologyWhatsapp(phone);
  if (!normalized) throw new Error("El número de WhatsApp es obligatorio.");
  await setDoc(technologyWhatsappConfigRef, { phone: normalized, updatedAt: serverTimestamp() }, { merge: true });
};

export const buildTechnologyWhatsappUrl = (phone: string, productName?: string) => {
  const normalized = normalizeTechnologyWhatsapp(phone);
  const message = productName
    ? `Hola, estoy interesado en el producto ${productName}. ¿Me pueden brindar más información?`
    : "Hola, quiero información sobre sus productos de tecnología.";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};
