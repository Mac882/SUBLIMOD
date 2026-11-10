"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribePublishedShirtDesigns, type ShirtDesign } from "@/lib/shirtDesigns";

const locations = ["Pecho", "Espalda", "Mangas"];

export default function ShirtDesignDetailPage() {
  const params = useParams<{ id: string }>();
  const [designs, setDesigns] = useState<ShirtDesign[]>([]);
  const [color, setColor] = useState("");
  const [location, setLocation] = useState(locations[0]);
  useEffect(() => subscribePublishedShirtDesigns(setDesigns), []);
  const design = designs.find((item) => item.id === params.id);
  const whatsappUrl = design ? `https://wa.me/50586153695?text=${encodeURIComponent(`Hola, quiero consultar por el diseño de camiseta "${design.name}". Color: ${color || "por definir"}. Ubicación: ${location}.`)}` : "#";

  return <main className="min-h-screen bg-slate-50"><Navbar/><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Link href="/disenos-camisetas" className="text-sm font-bold text-primary">← Todos los diseños</Link>{!design ? <p className="py-20 text-center text-slate-500">Cargando diseño o no está disponible.</p> : <div className="mt-6 grid gap-8 md:grid-cols-2"><div className="overflow-hidden rounded-3xl bg-white shadow-sm"><img src={design.imageUrl} alt={design.name} className="aspect-square h-full w-full object-cover"/></div><section className="py-2"><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Diseño de camiseta</p><h1 className="mt-2 text-3xl font-black text-slate-900">{design.name}</h1><p className="mt-4 leading-7 text-slate-600">{design.description}</p><div className="mt-7"><h2 className="text-sm font-black text-slate-800">1. Elige el color</h2><p className="mt-1 text-xs text-slate-500">Selecciona uno de los colores disponibles.</p><div className="mt-3 flex flex-wrap gap-2">{design.colors.map((item) => <button key={item} onClick={() => setColor(item)} className={`rounded-full border px-4 py-2 text-sm font-bold ${color === item ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-700"}`}>{item}</button>)}</div>{design.colors.length === 0 && <p className="mt-2 text-sm text-slate-500">Consulta los colores disponibles por WhatsApp.</p>}</div><fieldset className="mt-7"><legend className="text-sm font-black text-slate-800">2. ¿Dónde quieres personalizar?</legend><p className="mt-1 text-xs text-slate-500">Elige una ubicación principal; puedes agregar sugerencias al chatear.</p><div className="mt-3 grid grid-cols-3 gap-2">{locations.map((item) => <label key={item} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold ${location === item ? "border-primary bg-primary/5 text-primary" : "border-slate-200 bg-white text-slate-600"}`}><input type="radio" name="location" value={item} checked={location === item} onChange={() => setLocation(item)} className="sr-only"/>{item}</label>)}</div></fieldset><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 text-sm font-black text-white hover:bg-[#1fbd5b]"><MessageCircle size={18}/> Consultar por WhatsApp</a><p className="mt-3 text-center text-xs text-slate-500">En el chat puedes dar más detalles o compartir otras sugerencias.</p></section></div>}</div><Footer/></main>;
}
