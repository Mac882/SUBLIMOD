"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribePublishedShirtDesigns, type ShirtDesign } from "@/lib/shirtDesigns";

export default function ShirtDesignCatalogPage() {
  const [designs, setDesigns] = useState<ShirtDesign[]>([]);
  useEffect(() => subscribePublishedShirtDesigns(setDesigns), []);

  return <main className="min-h-screen bg-slate-50"><Navbar/><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-xs font-black uppercase tracking-[.25em] text-primary">Hechas para ti</p><h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Diseños de camisetas</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Elige un diseño y cuéntanos el color y dónde quieres personalizarlo. Si tienes otras ideas, puedes comentarlas por WhatsApp.</p><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{designs.map((item) => <Link key={item.id} href={`/disenos-camisetas/${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="aspect-[4/3] bg-slate-100"><img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover"/></div><div className="p-5"><h2 className="text-lg font-black text-slate-900">{item.name}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p><p className="mt-3 text-xs font-semibold text-slate-500">Colores: {item.colors.join(", ") || "Consultar"}</p><span className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-black text-white">Ver diseño</span></div></Link>)}</div>{designs.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Pronto agregaremos diseños de camisetas.</p>}</div><Footer/></main>;
}
