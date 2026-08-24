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
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategorias(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section id="catalogo" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO ELEGANTE */}
        <div className="text-center mb-20 relative">
          <span className="text-primary font-black uppercase text-[10px] tracking-[0.4em] mb-4 block">Nuestras Colecciones</span>
          <h2 className="text-4xl md:text-6xl font-black text-secondary uppercase tracking-tighter leading-none mb-6">
            Lo que ofrecemos
          </h2>
          <p className="text-secondary/60 max-w-xl mx-auto italic font-medium text-lg leading-relaxed">
            Explora nuestra variedad de productos listos para ser transformados con tu diseño ideal.
          </p>
          <div className="h-2 w-24 bg-accent mx-auto mt-10 rounded-full shadow-sm"></div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-50 animate-pulse rounded-[3rem] border border-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {categorias.map((cat) => (
              <Link 
                key={cat.id}
                href={`/catalogo?filtro=${encodeURIComponent(cat.nombre)}`}
                className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 hover:border-primary/20 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] flex flex-col h-full"
              >
                {/* PORTADA DE CATEGORÍA */}
                <div className="relative h-72 overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
                  {cat.imagenUrl ? (
                    <img
                      src={cat.imagenUrl}
                      alt={cat.nombre}
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Layers size={64} className="text-white" />
                      <span className="text-[10px] text-white font-black uppercase tracking-[0.3em]">SubliMod Premium</span>
                    </div>
                  )}
                  {/* Overlay gradiente suave */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                
                {/* CONTENIDO DE LA TARJETA */}
                <div className="p-10 flex flex-col justify-between flex-grow">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-secondary uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">
                      {cat.nombre}
                    </h3>
                    <p className="text-secondary/60 text-sm leading-relaxed line-clamp-3 font-medium">
                      {cat.descripcion || `Personalización de alta calidad para cada producto de nuestra línea de ${cat.nombre}.`}
                    </p>
                  </div>
                  
                  <div className="mt-10 flex items-center gap-3 text-primary font-black text-xs tracking-widest uppercase group-hover:gap-5 transition-all">
                    <span>Explorar Colección</span>
                    <ArrowRight size={20} className="transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;