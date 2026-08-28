"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const normalizeProductAttributes = (raw: unknown) => {
  if (!Array.isArray(raw)) return null;

  const normalized: Record<string, string[]> = {};

  raw.forEach((attribute) => {
    if (!attribute || typeof attribute !== "object") return;

    const item = attribute as { atributoId?: unknown; valores?: unknown };
    if (typeof item.atributoId !== "string" || !item.atributoId) return;

    const values = Array.isArray(item.valores)
      ? item.valores.filter((value): value is string => typeof value === "string")
      : typeof item.valores === "string"
        ? [item.valores]
        : [];

    normalized[item.atributoId] = values;
  });

  return normalized;
};

const normalizeProductAttributeStorage = async () => {
  const snapshot = await getDocs(collection(db, "productos"));
  const batch = writeBatch(db);
  let updates = 0;

  snapshot.docs.forEach((productDoc) => {
    const data = productDoc.data();
    const normalized = normalizeProductAttributes(data.atributos);

    if (!normalized) return;

    batch.update(doc(db, "productos", productDoc.id), {
      atributos: normalized,
    });
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // Los productos creados por el flujo anterior pueden tener
        // atributos como [{ atributoId, valores }]. El preview del admin
        // y otros consumidores esperan un mapa atributoId -> valores.
        // Normalizamos esos registros antes de montar el dashboard para
        // evitar que React intente renderizar el objeto directamente.
        await normalizeProductAttributeStorage();
      } catch (error) {
        console.error("Error al normalizar atributos de productos", error);
      }

      if (!cancelled) {
        setAuthorized(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary animate-spin" size={40} />
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">Verificando Identidad...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
