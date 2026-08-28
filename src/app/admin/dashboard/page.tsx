"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/app/admin/AuthGuard";
import Link from "next/link";
import { ArrowRight, Boxes, Laptop, Layers3, Package, Settings, Tag, TrendingUp } from "lucide-react";

type Item = Record<string, any> & { id: string };

function Dashboard() {
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Item[]>([]);
  const [attributes, setAttributes] = useState<Item[]>([]);
  const [laptops, setLaptops] = useState<Item[]>([]);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "productos"), orderBy("createdAt", "desc")), snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "atributos_globales"), orderBy("nombreAtributo", "asc")), snap => setAttributes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc")), snap => setLaptops(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const availableLaptops = useMemo(() => laptops.filter(item => String(item.disponibilidad || "").toLowerCase().includes("dispon" )).length, [laptops]);
  const activeCategories = useMemo(() => categories.filter(item => item.activa !== false).length, [categories]);

  const cards = [
    { label: "Productos publicados", value: products.length, hint: "Catálogo actual", icon: Package, href: "/admin" },
    { label: "Categorías", value: activeCategories, hint: "Estructura del catálogo", icon: Layers3, href: "/admin" },
    { label: "Atributos globales", value: attributes.length, hint: "Opciones reutilizables", icon: Tag, href: "/admin" },
    { label: "Laptops", value: laptops.length, hint: `${availableLaptops} disponibles`, icon: Laptop, href: "/admin/tecnologia" },
  ];

  return (
    <main className="min-h-screen bg-[#121212] text-gray-200">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#1E1E1E]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/admin/dashboard" className="group flex items-center gap-3" aria-label="Inicio del administrador">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Boxes size={22}/></div>
            <div><div className="text-lg font-black italic uppercase tracking-tight text-accent">SubliMod <span className="text-[9px] rounded bg-white/10 px-2 py-1 not-italic text-white">ADMIN</span></div><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-500">Centro de control</p></div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin/tecnologia" className="rounded-xl border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:border-primary/40 hover:text-white"><Laptop className="mr-1 inline" size={14}/> Tecnología</Link>
            <Link href="/admin" className="rounded-xl bg-primary px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">Administrador</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-7 md:px-8 md:py-10">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">Resumen operativo</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Panel de control</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">Una vista rápida de lo que realmente importa para administrar el catálogo y la sección de tecnología.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, hint, icon: Icon, href }) => (
            <Link key={label} href={href} className="group rounded-[1.75rem] border border-white/5 bg-[#1E1E1E] p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[#222]">
              <div className="mb-6 flex items-center justify-between"><div className="rounded-2xl bg-white/5 p-3 text-primary"><Icon size={21}/></div><ArrowRight size={17} className="text-gray-700 transition group-hover:text-primary"/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
              <p className="mt-1 text-4xl font-black text-white">{value}</p>
              <p className="mt-2 text-xs font-semibold text-gray-600">{hint}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black uppercase tracking-tight">Actividad reciente</h2><p className="mt-1 text-xs text-gray-600">Últimos productos registrados.</p></div><TrendingUp className="text-primary" size={20}/></div>
            <div className="divide-y divide-white/5">
              {products.slice(0, 5).map(product => <div key={product.id} className="flex items-center gap-4 py-4"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/5">{product.imagenUrl && <img src={product.imagenUrl} alt="" className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black uppercase text-white">{product.nombre || "Sin nombre"}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-gray-600">{product.categoria || "Sin categoría"}</p></div><span className="hidden rounded-full bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-primary sm:block">Publicado</span></div>)}
              {products.length === 0 && <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-gray-600">No hay productos registrados</div>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7">
            <div className="mb-5"><h2 className="text-lg font-black uppercase tracking-tight">Accesos rápidos</h2><p className="mt-1 text-xs text-gray-600">Las tareas que más vas a usar.</p></div>
            <div className="space-y-3">
              <Link href="/admin/tecnologia" className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-primary/30"><Laptop className="text-primary" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Tecnología · Laptops</p><p className="mt-1 text-[10px] text-gray-600">{laptops.length} registradas</p></div><ArrowRight size={16} className="text-gray-600"/></Link>
              <Link href="/admin" className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-primary/30"><Package className="text-accent" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Administrar catálogo</p><p className="mt-1 text-[10px] text-gray-600">Productos, categorías y atributos</p></div><ArrowRight size={16} className="text-gray-600"/></Link>
              <Link href="/admin" className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-primary/30"><Settings className="text-gray-500" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Configuración</p><p className="mt-1 text-[10px] text-gray-600">Datos generales del sitio</p></div><ArrowRight size={16} className="text-gray-600"/></Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboardPage() { return <AuthGuard><Dashboard /></AuthGuard>; }
