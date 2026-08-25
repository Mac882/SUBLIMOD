"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Laptop, Plus, Search, Pencil, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/app/admin/AuthGuard";
import TechnologyProductForm, { TechnologyLaptop } from "@/components/admin/TechnologyProductForm";

export default function AdminTechnologyPage() {
  return <AuthGuard><TechnologyManager /></AuthGuard>;
}

function TechnologyManager() {
  const [products, setProducts] = useState<TechnologyLaptop[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TechnologyLaptop | null>(null);

  useEffect(() => {
    const q = query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setProducts(snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<TechnologyLaptop, "id">) }))));
  }, []);

  const filtered = products.filter((item) => {
    const text = `${item.nombre} ${item.marca} ${item.modelo} ${item.sku}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const remove = async (product: TechnologyLaptop) => {
    if (!product.id) return;
    if (!window.confirm(`¿Eliminar ${product.nombre}?`)) return;
    await deleteDoc(doc(db, "tecnologia_productos", product.id));
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (product: TechnologyLaptop) => { setEditing(product); setShowForm(true); };

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <header className="border-b border-white/10 bg-[#171717]/95 px-4 py-5 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary"><ArrowLeft size={14}/> Volver al administrador</Link>
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Laptop size={24}/></div><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">SubliMod / Tecnología</p><h1 className="text-2xl font-black uppercase tracking-tight">Laptops</h1></div></div>
          </div>
          <div className="flex gap-3"><Link href="/tecnologia" target="_blank" className="rounded-2xl border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"><ExternalLink className="mr-2 inline" size={14}/> Ver sección</Link><button onClick={openCreate} className="rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20"><Plus className="mr-2 inline" size={16}/> Nueva laptop</button></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><Search size={18} className="text-gray-500"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por marca, modelo o SKU..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"/></div>
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717]">
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-gray-500"><tr><th className="px-6 py-5">Laptop</th><th className="px-6 py-5">Estado</th><th className="px-6 py-5">Precio</th><th className="px-6 py-5">Disponibilidad</th><th className="px-6 py-5 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-white/5">{filtered.map((product) => <tr key={product.id} className="hover:bg-white/[0.02]"><td className="px-6 py-5"><div className="flex items-center gap-4">{product.imagenUrl ? <img src={product.imagenUrl} alt="" className="h-14 w-14 rounded-xl object-cover"/> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-gray-600"><Laptop size={22}/></div>}<div><p className="font-black uppercase text-sm text-white">{product.nombre}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">{product.marca} · {product.modelo}</p></div></div></td><td className="px-6 py-5"><span className="rounded-full bg-primary/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary">{product.estado}</span></td><td className="px-6 py-5 font-black text-accent">{product.moneda === "USD" ? "$" : "C$"} {product.precio.toLocaleString()}</td><td className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">{product.disponibilidad}</td><td className="px-6 py-5 text-right"><button onClick={() => openEdit(product)} className="mr-2 rounded-xl bg-white/5 p-3 text-gray-400 hover:text-white" title="Editar"><Pencil size={16}/></button><button onClick={() => remove(product)} className="rounded-xl bg-red-500/10 p-3 text-red-400" title="Eliminar"><Trash2 size={16}/></button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-600">No hay laptops registradas</td></tr>}</tbody></table></div>
        </div>
      </section>

      {showForm && <TechnologyProductForm productToEdit={editing} onClose={() => setShowForm(false)} onSaved={() => undefined} />}
    </main>
  );
}
