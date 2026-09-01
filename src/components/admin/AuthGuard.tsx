"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signOut } from "firebase/auth";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const normalizeProductAttributes = (raw: unknown) => {
  if (!Array.isArray(raw)) return null;
  const normalized: Record<string, string[]> = {};
  raw.forEach((attribute) => {
    if (!attribute || typeof attribute !== "object") return;
    const item = attribute as { atributoId?: unknown; valores?: unknown };
    if (typeof item.atributoId !== "string" || !item.atributoId) return;
    const values = Array.isArray(item.valores)
      ? item.valores.filter((value): value is string => typeof value === "string")
      : typeof item.valores === "string" ? [item.valores] : [];
    normalized[item.atributoId] = values;
  });
  return normalized;
};

const normalizeProductAttributeStorage = async () => {
  const snapshot = await getDocs(collection(db, "productos"));
  const pending = snapshot.docs.map((productDoc) => {
    const normalized = normalizeProductAttributes(productDoc.data().atributos);
    return normalized ? { ref: doc(db, "productos", productDoc.id), atributos: normalized } : null;
  }).filter((item): item is { ref: ReturnType<typeof doc>; atributos: Record<string, string[]> } => Boolean(item));

  for (let index = 0; index < pending.length; index += 400) {
    const batch = writeBatch(db);
    pending.slice(index, index + 400).forEach((item) => batch.update(item.ref, { atributos: item.atributos }));
    await batch.commit();
  }
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const logoutForInactivity = async () => {
      try { await signOut(auth); } finally {
        if (!cancelled) {
          setAuthorized(false);
          router.replace("/admin/login");
        }
      }
    };

    const resetIdleTimer = () => {
      if (!auth.currentUser) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(logoutForInactivity, IDLE_TIMEOUT_MS);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) {
          setAuthorized(false);
          setLoading(false);
        }
        router.replace("/admin/login");
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
        resetIdleTimer();
      }
    });

    // Fuerza el panel a usar sesión de pestaña/navegador incluso para una
    // sesión que haya sido creada anteriormente con persistencia local.
    void setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error("No se pudo establecer la persistencia de sesión", error);
    });

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));

    return () => {
      cancelled = true;
      unsubscribe();
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4"><Loader2 className="text-primary animate-spin" size={40} /><p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">Verificando Identidad...</p></div>;
  }

  return authorized ? <>{children}</> : null;
}
