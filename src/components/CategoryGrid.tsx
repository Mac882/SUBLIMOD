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
      setCategorias(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section id="catalogo" className="relative overflow-hidden bg-[#F5FBFA] px-5 py-14 sm:px-6 md:py-18 lg:py-20">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#FFD9E8]/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] bottom-10 h-72 w-72 rounded-full bg-[#DDF5F1]/60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] [background-image:radial-gradient(#2E8982_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-9 max-w-3xl text-center md:mb-11">
          <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.4em] text-primary">Nuestras colecciones</span>
          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#17263F] sm:text-4xl md:text-5xl">Productos sublimables<span className="block text-primary">que ofrecemos</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-[#617086] sm:text-base">Explora nuestras categorías y encuentra el producto ideal para personalizar cada detalle.</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i)=><div key={i} className="h-72 animate-pulse rounded-[1.75rem] bg-white/80" />)}</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {categorias.map((cat) => (
              <Link key={cat.id} href={`/catalogo?filtro=${encodeURIComponent(cat.nombre)}`} className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/90 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-[#17263F]/10">
                <div className="relative aspect-[16/9] overflow-hidden bg-[#EAF6F4] sm:aspect-[5/3]">
                  {cat.imagenUrl ? <img src={cat.imagenUrl} alt={cat.nombre} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/30"><Layers size={38}/><span className="text-[8px] font-black uppercase tracking-[0.25em]">SubliMod</span></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17263F]/15 via-transparent to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div><h3 className="text-base font-black uppercase leading-tight tracking-tight text-[#17263F] transition-colors group-hover:text-primary sm:text-lg">{cat.nombre}</h3><p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-[#6B788A] sm:text-sm">{cat.descripcion || `Personalización de alta calidad para nuestra línea de ${cat.nombre}.`}</p></div>
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary transition-all group-hover:gap-3 sm:text-[10px]"><span>Explorar colección</span><ArrowRight size={15}/></div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-7 text-center"><Link href="/catalogo" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary transition-colors hover:text-primary-dark">Ver todas las categorías<ArrowRight size={15}/></Link></div>
      </div>
    </section>
  );
};

export default CategoryGrid;
