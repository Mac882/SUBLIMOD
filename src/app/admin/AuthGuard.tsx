"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { Laptop, Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Escucha si el usuario está logueado o no en Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthorized(true);
      } else {
        // Si no hay usuario, lo redirigimos al login
        router.push("/admin/login");
      }
      setLoading(false);
    });

    // Limpia la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [router]);

  // Mientras verifica la sesión, mostramos una pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary animate-spin" size={40} />
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em]">Verificando Identidad...</p>
      </div>
    );
  }

  // Si está autorizado, mostramos el contenido (el AdminDashboard)
  if (!authorized) return null;

  return (
    <>
      {children}

      {pathname === "/admin" && (
        <button
          type="button"
          onClick={() => router.push("/admin/tecnologia")}
          className="fixed left-4 bottom-24 z-[150] hidden md:flex w-64 items-center gap-4 rounded-2xl border border-white/10 bg-[#1E1E1E] px-4 py-4 text-left text-gray-400 shadow-2xl transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          aria-label="Abrir administración de laptops"
        >
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Laptop size={20} />
          </span>
          <span>
            <span className="block text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">Tecnología</span>
            <span className="block text-sm font-bold tracking-tight">Laptops</span>
          </span>
        </button>
      )}
    </>
  );
}