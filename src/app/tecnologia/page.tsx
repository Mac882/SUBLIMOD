"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowRight, Laptop, ShieldCheck, Search, Wrench } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TecnologiaPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onSnapshot(query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc")), (snap) => {
      setProducts(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
  }, []);

  const available = useMemo(() => products.filter((item) => item.disponibilidad !== "Vendida"), [products]);
  const filtered = available.filter((item) => `${item.nombre} ${item.marca} ${item.modelo} ${item.procesador} ${item.ram} ${item.almacenamiento}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <section className="relative overflow-hidden bg-[#111111] px-4 py-20 text-white md:py-28">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-primary">SubliMod / Tecnología</p>
          <div className="max-w-3xl"><h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">Laptops seleccionadas para trabajar, crear y avanzar.</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">Equipos nuevos, usados y reacondicionados con especificaciones claras, fotografías reales y garantía según disponibilidad.</p></div>
          <div className="mt-8 flex flex-wrap gap-3"><span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest">Laptops</span><span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest">Equipos verificados</span><span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest">Garantía</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><Laptop className="text-primary"/><h2 className="mt-4 text-sm font-black uppercase tracking-widest">Laptops</h2><p className="mt-2 text-xs leading-6 text-gray-500">Equipos para estudio, trabajo y uso profesional.</p></div><div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><ShieldCheck className="text-primary"/><h2 className="mt-4 text-sm font-black uppercase tracking-widest">Estado claro</h2><p className="mt-2 text-xs leading-6 text-gray-500">Indicamos si el equipo es nuevo, usado o reacondicionado.</p></div><div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><Wrench className="text-primary"/><h2 className="mt-4 text-sm font-black uppercase tracking-widest">Verificadas</h2><p className="mt-2 text-xs leading-6 text-gray-500">La ficha muestra las pruebas y condiciones reportadas.</p></div></div>

        <div className="mt-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Catálogo tecnológico</p><h2 className="mt-2 text-3xl font-black uppercase tracking-tight">Laptops disponibles</h2></div><div className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 md:max-w-sm"><Search size={18} className="text-gray-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar laptop..." className="w-full bg-transparent text-sm outline-none"/></div></div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <Link href={`/tecnologia/${product.id}`} key={product.id} className="group overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/3] overflow-hidden bg-gray-100">{product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-gray-300"><Laptop size={60}/></div>}<span className="absolute left-4 top-4 rounded-full bg-[#111111]/90 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">{product.estado}</span></div><div className="p-6"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{product.marca} · {product.modelo}</p><h3 className="mt-2 text-xl font-black uppercase tracking-tight">{product.nombre}</h3><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-gray-500"><span className="rounded-lg bg-gray-50 px-2 py-1">{product.procesador}</span><span className="rounded-lg bg-gray-50 px-2 py-1">{product.ram}</span><span className="rounded-lg bg-gray-50 px-2 py-1">{product.almacenamiento}</span></div><div className="mt-6 flex items-end justify-between"><div><span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">Precio</span><span className="text-2xl font-black">{product.moneda === "USD" ? "$" : "C$"} {Number(product.precio).toLocaleString()}</span></div><span className="rounded-full bg-primary p-3 text-white"><ArrowRight size={18}/></span></div></div></Link>)}{filtered.length === 0 && <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-gray-200 p-16 text-center"><Laptop className="mx-auto text-gray-300" size={40}/><p className="mt-4 text-sm font-black uppercase tracking-widest text-gray-400">Estamos preparando nuestro inventario de laptops.</p><p className="mt-2 text-xs text-gray-400">Próximamente encontrarás equipos disponibles aquí.</p></div>}</div>

        <div className="mt-16 rounded-[2rem] bg-[#111111] p-8 text-white md:p-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Próximamente</p><h2 className="mt-2 text-2xl font-black uppercase">Más tecnología en camino</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">Computadoras de escritorio, monitores, componentes y accesorios forman parte de la expansión futura de SubliMod Tecnología.</p></div>
      </section>
      <Footer />
    </main>
  );
}
