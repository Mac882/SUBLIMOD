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
  const pending = snapshot.docs
    .map((productDoc) => {
      const normalized = normalizeProductAttributes(productDoc.data().atributos);
      return normalized
        ? { ref: doc(db, "productos", productDoc.id), atributos: normalized }
        : null;
    })
    .filter((item): item is { ref: ReturnType<typeof doc>; atributos: Record<string, string[]> } => Boolean(item));

  // Firestore limita un batch a 500 operaciones. Dejamos margen para no
  // acercarnos al límite y procesamos por bloques.
  for (let index = 0; index < pending.length; index += 400) {
    const batch = writeBatch(db);
    pending.slice(index, index + 400).forEach((item) => {
      batch.update(item.ref, { atributos: item.atributos });
    });
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
        // El flujo anterior podía guardar atributos como
        // [{ atributoId, valores }]. El preview del admin trabaja con
        // un mapa atributoId -> valores, así que migramos esos registros
        // antes de montar el dashboard.
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
