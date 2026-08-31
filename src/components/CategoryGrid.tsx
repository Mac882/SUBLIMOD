"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

const CategoryGrid = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "categorias"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategorias(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section id="catalogo" className="relative overflow-hidden bg-[#F5FBFA] px-5 py-20 sm:px-6 md:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#FFD9E8]/45 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] bottom-10 h-80 w-80 rounded-full bg-[#DDF5F1]/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#2E8982_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.4em] text-primary">Nuestras colecciones</span>
          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#17263F] sm:text-4xl md:text-5xl lg:text-6xl">
            Productos sublimables
            <span className="block text-primary">que ofrecemos</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-7 text-[#617086] sm:text-base">
            Explora nuestras categorías y encuentra el producto ideal para personalizar cada detalle.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-[2rem] bg-white/80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 lg:gap-6">
            {categorias.map((cat, index) => (
              <Link
                key={cat.id}
                href={`/catalogo?filtro=${encodeURIComponent(cat.nombre)}`}
                className={`group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-[#17263F]/10 ${
                  index === 0 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#EAF6F4]">
                  {cat.imagenUrl ? (
                    <img
                      src={cat.imagenUrl}
                      alt={cat.nombre}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-primary/30">
                      <Layers size={48} />
                      <span className="text-[9px] font-black uppercase tracking-[0.25em]">SubliMod</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17263F]/20 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div>
                    <h3 className="text-lg font-black uppercase leading-tight tracking-tight text-[#17263F] transition-colors group-hover:text-primary sm:text-xl">
                      {cat.nombre}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-[#6B788A] sm:text-sm">
                      {cat.descripcion || `Personalización de alta calidad para nuestra línea de ${cat.nombre}.`}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary transition-all group-hover:gap-3 sm:text-[10px]">
                    <span>Explorar colección</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary transition-colors hover:text-primary-dark"
          >
            Ver todas las categorías
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
