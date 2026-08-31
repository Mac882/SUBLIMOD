"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";

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

  for (let index = 0; index < pending.length; index += 400) {
    const batch = writeBatch(db);
    pending.slice(index, index + 400).forEach((item) => {
      batch.update(item.ref, { atributos: item.atributos });
    });
    await batch.commit();
  }
};

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  trend: string;
};

const StatCard = ({ icon, label, value, trend }: StatCardProps) => (
  <div className="bg-[#1E1E1E] border border-white/5 rounded-[2rem] p-7 shadow-xl">
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center">{icon}</div>
      <ArrowUpRight size={16} className="text-gray-600" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
    <p className="text-3xl md:text-4xl font-black text-white mt-2">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-3">{trend}</p>
  </div>
);

declare global {
  var StatCard: typeof StatCard;
}

globalThis.StatCard = StatCard;

export default function AuthGuard({ children }: { children: ReactNode }) {
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
