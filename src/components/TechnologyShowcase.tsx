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
        snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TechnologyProduct[]
      );
    });
  }, []);

  const availableProducts = useMemo(
    () => products.filter((product) => product.disponibilidad !== "Vendida").slice(0, 3),
    [products]
  );

  return (
    <section id="tecnologia-home" className="relative overflow-hidden border-t border-primary/10 bg-[#EDF7F6] px-5 py-20 text-[#17263F] sm:px-6 md:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-[#CDEEE9]/80 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] bottom-[-80px] h-96 w-96 rounded-full bg-[#FFE7B0]/50 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-[-120px] h-64 w-64 rounded-full bg-white/80 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl md:mb-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm">
            <Laptop size={14} />
            SubliMod Tecnología
          </div>
          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-4xl md:text-5xl lg:text-6xl">
            Laptops seleccionadas
            <span className="block text-primary">para trabajar, crear y avanzar</span>
          </h2>
          <p className="mt-6 max-w-2xl text-sm font-medium leading-7 text-[#617086] sm:text-base">
            Una segunda línea de productos pensada para acompañarte en el trabajo, el estudio y tus proyectos. Tecnología clara, seleccionada y presentada sin mezclarse con nuestra línea de sublimación.
          </p>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
          <div className="flex flex-col justify-between rounded-[2.25rem] border border-white/90 bg-white/75 p-7 shadow-sm backdrop-blur-sm sm:p-8 lg:p-9">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Tecnología seleccionada</p>
              <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">Equipos para cada proyecto</h3>

              <div className="mt-7 space-y-3">
                <div className="rounded-2xl border border-[#DDECEA] bg-[#F8FCFB] p-4">
                  <ShieldCheck className="text-primary" size={20} />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest">Información clara</p>
                  <p className="mt-1 text-xs leading-5 text-[#718094]">Especificaciones y estado visibles antes de elegir.</p>
                </div>
                <div className="rounded-2xl border border-[#F1E6C9] bg-[#FFFDF7] p-4">
                  <Sparkles className="text-[#D5A83C]" size={20} />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest">Equipos seleccionados</p>
                  <p className="mt-1 text-xs leading-5 text-[#718094]">Opciones disponibles para trabajo, estudio y creación.</p>
                </div>
              </div>
            </div>

            <Link
              href="/tecnologia"
              className="group mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-[#17263F] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-[#223553] active:scale-95"
            >
              Ver tecnología
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Nuestros productos</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl">Laptops disponibles</h3>
              </div>
              <Link href="/tecnologia" className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#617086] transition-colors hover:text-primary sm:flex">
                Ver catálogo <ArrowRight size={14} />
              </Link>
            </div>

            {availableProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/tecnologia/${product.id}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-[#17263F]/10"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F1F7F6]">
                      {product.imagenUrl ? (
                        <img
                          src={product.imagenUrl}
                          alt={product.nombre || "Laptop"}
                          className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-4"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary/25">
                          <Laptop size={48} />
                        </div>
                      )}
                      {product.estado && (
                        <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary shadow-sm">
                          {product.estado}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-primary">
                        {product.marca || "Tecnología"} {product.modelo ? `· ${product.modelo}` : ""}
                      </p>
                      <h4 className="mt-1.5 line-clamp-2 text-sm font-black uppercase leading-tight text-[#17263F]">
                        {product.nombre || "Laptop"}
                      </h4>
                      <p className="mt-3 text-base font-black text-primary">
                        {product.moneda === "USD" ? "$" : "C$"} {Number(product.precio || 0).toLocaleString()}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#617086] transition-colors group-hover:text-primary">
                        Ver detalles <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-primary/20 bg-white/60 px-6 py-14 text-center">
                <Laptop className="mx-auto text-primary/30" size={42} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#52627A]">Próximamente laptops disponibles</p>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#718094]">Estamos preparando nuestro catálogo tecnológico. Puedes conocer la sección mientras incorporamos nuevos equipos.</p>
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
