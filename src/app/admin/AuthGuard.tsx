"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

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
  return authorized ? <>{children}</> : null;
}