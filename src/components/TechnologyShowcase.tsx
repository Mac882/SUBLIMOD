"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowRight, Laptop, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";

type TechnologyProduct = { id: string; nombre?: string; marca?: string; modelo?: string; precio?: number | string; moneda?: string; estado?: string; disponibilidad?: string; imagenUrl?: string };

const defaults = {
  title: "Laptops seleccionadas para trabajar, crear y avanzar",
  description: "Una segunda línea de productos pensada para acompañarte en el trabajo, el estudio y tus proyectos.",
};

export default function TechnologyShowcase() {
  const [products, setProducts] = useState<TechnologyProduct[]>([]);
  const [copy, setCopy] = useState(defaults);

  useEffect(() => {
    const productsQuery = query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc"));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TechnologyProduct[]));
    const unsubscribeConfig = onSnapshot(doc(db, "configuracion", "general"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setCopy((current) => ({ title: data.homeTechnologyTitle || current.title, description: data.homeTechnologyDescription || current.description }));
    });
    return () => { unsubscribeProducts(); unsubscribeConfig(); };
  }, []);

  const availableProducts = useMemo(() => products.filter((product) => product.disponibilidad !== "Vendida").slice(0, 3), [products]);

  return (
    <section id="tecnologia-home" className="relative overflow-hidden border-t border-primary/15 bg-gradient-to-br from-[#E8F7F5] via-[#F5FBFA] to-[#EAF2F6] px-5 py-14 text-[#17263F] sm:px-6 md:py-18 lg:py-20">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#B9E7E0]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] bottom-[-80px] h-96 w-96 rounded-full bg-[#FFE0A1]/45 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-[-140px] h-72 w-72 rounded-full bg-white/80 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm"><Laptop size={14}/>SubliMod Tecnología</div>
          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-4xl md:text-5xl">{copy.title}</h2>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[#617086] sm:text-base">{copy.description}</p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-8">
          <div className="flex flex-col justify-between rounded-[1.75rem] border border-white/90 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Tecnología seleccionada</p>
              <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight sm:text-2xl">Equipos para cada proyecto</h3>
              <div className="mt-5 grid gap-2.5">
                <div className="rounded-xl border border-[#DDECEA] bg-[#F8FCFB] p-3"><div className="flex items-center gap-2"><ShieldCheck className="text-primary" size={17}/><p className="text-[9px] font-black uppercase tracking-widest">Información clara</p></div><p className="mt-1.5 text-[11px] leading-4 text-[#718094]">Especificaciones y estado visibles antes de elegir.</p></div>
                <div className="rounded-xl border border-[#F1E6C9] bg-[#FFFDF7] p-3"><div className="flex items-center gap-2"><Sparkles className="text-[#D5A83C]" size={17}/><p className="text-[9px] font-black uppercase tracking-widest">Equipos seleccionados</p></div><p className="mt-1.5 text-[11px] leading-4 text-[#718094]">Opciones disponibles para trabajo, estudio y creación.</p></div>
              </div>
            </div>
            <Link href="/tecnologia" className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#17263F] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-[#223553] active:scale-95">Ver tecnología<ArrowRight size={14} className="transition-transform group-hover:translate-x-1"/></Link>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Nuestros productos</p><h3 className="mt-1.5 text-xl font-black uppercase tracking-tight sm:text-2xl">Laptops disponibles</h3></div><Link href="/tecnologia" className="hidden items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#617086] transition-colors hover:text-primary sm:flex">Ver catálogo<ArrowRight size={13}/></Link></div>
            {availableProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableProducts.map((product) => (
                  <Link key={product.id} href={`/tecnologia/${product.id}`} className="group overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F1F7F6]">{product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre || "Laptop"} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-primary/25"><Laptop size={42}/></div>}{product.estado && <span className="absolute left-2.5 top-2.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[7px] font-black uppercase tracking-widest text-primary shadow-sm">{product.estado}</span>}</div>
                    <div className="p-4"><p className="text-[7px] font-black uppercase tracking-[0.18em] text-primary">{product.marca || "Tecnología"} {product.modelo ? `· ${product.modelo}` : ""}</p><h4 className="mt-1 line-clamp-2 text-xs font-black uppercase leading-tight text-[#17263F]">{product.nombre || "Laptop"}</h4><p className="mt-2 text-sm font-black text-primary">{product.moneda === "USD" ? "$" : "C$"} {Number(product.precio || 0).toLocaleString()}</p><span className="mt-3 inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#617086] transition-colors group-hover:text-primary">Ver detalles<ArrowRight size={11}/></span></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-white/60 px-5 py-10 text-center"><Laptop className="mx-auto text-primary/30" size={38}/><p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#52627A]">Próximamente laptops disponibles</p><p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#718094]">Estamos preparando nuestro catálogo tecnológico.</p><Link href="/tecnologia" className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">Ir a tecnología<ArrowRight size={12}/></Link></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
