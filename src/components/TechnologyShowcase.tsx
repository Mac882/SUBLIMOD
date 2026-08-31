"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowRight, Laptop, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";

type TechnologyProduct = {
  id: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  precio?: number | string;
  moneda?: string;
  estado?: string;
  disponibilidad?: string;
  imagenUrl?: string;
};

export default function TechnologyShowcase() {
  const [products, setProducts] = useState<TechnologyProduct[]>([]);

  useEffect(() => {
    const productsQuery = query(
      collection(db, "tecnologia_productos"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(productsQuery, (snapshot) => {
      setProducts(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as TechnologyProduct[]
      );
    });
  }, []);

  const availableProducts = useMemo(
    () => products.filter((product) => product.disponibilidad !== "Vendida").slice(0, 3),
    [products]
  );

  return (
    <section className="relative overflow-hidden bg-[#111111] px-4 py-16 text-white md:py-24">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#FFD56A]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              <Laptop size={14} />
              SubliMod Tecnología
            </div>

            <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-5xl">
              También tenemos la tecnología para acompañar tus proyectos.
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-white/60 md:text-base">
              Explora nuestras laptops seleccionadas para trabajo, estudio y creación. Cada equipo cuenta con una ficha clara para que puedas conocer sus especificaciones antes de decidir.
            </p>

            <div className="mt-7 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="text-primary" size={20} />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/80">Información clara</p>
                <p className="mt-1 text-xs leading-5 text-white/40">Estado y especificaciones visibles.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Sparkles className="text-[#FFD56A]" size={20} />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/80">Equipos seleccionados</p>
                <p className="mt-1 text-xs leading-5 text-white/40">Opciones disponibles en el catálogo.</p>
              </div>
            </div>

            <Link
              href="/tecnologia"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#FFD56A] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FFD56A]/10 active:scale-95"
            >
              Ver tecnología
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Nuestros productos</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight md:text-3xl">Laptops disponibles</h3>
              </div>
              <Link href="/tecnologia" className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 transition-colors hover:text-white sm:flex">
                Ver catálogo <ArrowRight size={14} />
              </Link>
            </div>

            {availableProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/tecnologia/${product.id}`}
                    className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.06] transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.08]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                      {product.imagenUrl ? (
                        <img
                          src={product.imagenUrl}
                          alt={product.nombre || "Laptop"}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                          <Laptop size={48} />
                        </div>
                      )}
                      {product.estado && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#111111]/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-white">
                          {product.estado}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary">
                        {product.marca || "Tecnología"} {product.modelo ? `· ${product.modelo}` : ""}
                      </p>
                      <h4 className="mt-1.5 line-clamp-2 text-sm font-black uppercase leading-tight text-white">
                        {product.nombre || "Laptop"}
                      </h4>
                      <p className="mt-3 text-base font-black text-[#FFD56A]">
                        {product.moneda === "USD" ? "$" : "C$"} {Number(product.precio || 0).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
                <Laptop className="mx-auto text-white/20" size={42} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/50">Próximamente laptops disponibles</p>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/30">Estamos preparando nuestro catálogo tecnológico. Puedes conocer la sección mientras incorporamos nuevos equipos.</p>
                <Link href="/tecnologia" className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  Ir a tecnología <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
