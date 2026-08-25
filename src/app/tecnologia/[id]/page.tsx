"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TecnologiaProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    return onSnapshot(doc(db, "tecnologia_productos", params.id), (snap) => setProduct(snap.exists() ? { id: snap.id, ...snap.data() } : null));
  }, [params.id]);

  const images = useMemo(() => product ? (product.imagenes?.length ? product.imagenes : product.imagenUrl ? [product.imagenUrl] : []) : [], [product]);

  if (!product) return <main className="min-h-screen bg-slate-50"><Navbar/><div className="flex min-h-[60vh] items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">Cargando equipo...</div><Footer/></main>;

  const whatsapp = `https://wa.me/50586153695?text=${encodeURIComponent(`Hola SubliMod, estoy interesado en la ${product.nombre} (${product.marca} ${product.modelo}) publicada en ${product.moneda === "USD" ? "$" : "C$"}${product.precio}.`)}`;
  const prev = () => setActiveImage((current) => current === 0 ? images.length - 1 : current - 1);
  const next = () => setActiveImage((current) => current === images.length - 1 ? 0 : current + 1);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800"><Navbar/>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8"><Link href="/tecnologia" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary"><ArrowLeft size={14}/> Volver a laptops</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div><div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-white shadow-sm">{images.length ? <img src={images[activeImage]} alt={product.nombre} className="h-full w-full object-contain"/> : <div className="flex h-full items-center justify-center text-gray-300">Sin imagen</div>}{images.length > 1 && <><button onClick={prev} className="absolute left-4 top-1/2 rounded-full bg-black/70 p-3 text-white"><ChevronLeft/></button><button onClick={next} className="absolute right-4 top-1/2 rounded-full bg-black/70 p-3 text-white"><ChevronRight/></button></>}</div><div className="mt-4 grid grid-cols-5 gap-3">{images.map((url: string, index: number) => <button key={url} onClick={() => setActiveImage(index)} className={`overflow-hidden rounded-xl border-2 ${activeImage === index ? "border-primary" : "border-transparent"}`}><img src={url} alt="" className="aspect-square w-full object-cover"/></button>)}</div></div>

          <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{product.marca} · {product.modelo}</p><h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">{product.nombre}</h1><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-[#111111] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white">{product.estado}</span><span className="rounded-full bg-primary/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-primary">{product.disponibilidad}</span></div><p className="mt-6 text-sm leading-7 text-gray-500">{product.descripcionCorta}</p><div className="mt-7 border-y border-gray-200 py-6"><span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Precio</span><span className="text-4xl font-black">{product.moneda === "USD" ? "$" : "C$"} {Number(product.precio).toLocaleString()}</span>{product.precioAnterior > product.precio && <span className="ml-3 text-sm text-gray-400 line-through">{product.moneda === "USD" ? "$" : "C$"}{Number(product.precioAnterior).toLocaleString()}</span>}</div><a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:bg-primary-dark"><MessageCircle size={19}/> Consultar disponibilidad</a>

            <div className="mt-8 grid grid-cols-2 gap-3">{[["Procesador", product.procesador],["RAM", product.ram],["Almacenamiento", product.almacenamiento],["Gráficos", product.grafica],["Pantalla", product.pantalla],["Resolución", product.resolucion]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-4 shadow-sm"><span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span><span className="mt-1 block text-sm font-bold">{value || "—"}</span></div>)}</div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3"><div className="rounded-[2rem] bg-white p-7 shadow-sm lg:col-span-2"><h2 className="text-xl font-black uppercase">Especificaciones y descripción</h2><p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-500">{product.descripcion || "Sin descripción adicional."}</p><div className="mt-7 grid gap-3 md:grid-cols-2">{[["Sistema operativo", product.sistemaOperativo],["Batería", product.bateria],["Cargador", product.cargador],["Conectividad", product.conectividad],["Puertos", product.puertos],["Pruebas realizadas", product.pruebasRealizadas]].map(([label, value]) => <div key={label} className="border-b border-gray-100 py-3"><span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span><span className="mt-1 block text-sm font-bold">{value || "No especificado"}</span></div>)}</div></div><aside className="rounded-[2rem] bg-[#111111] p-7 text-white"><ShieldCheck className="text-primary"/><h2 className="mt-5 text-xl font-black uppercase">Garantía</h2><p className="mt-3 text-sm leading-6 text-gray-400">{product.garantia ? product.garantiaDetalle : "Este equipo no incluye garantía indicada."}</p><h3 className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Incluye</h3><ul className="mt-4 space-y-3">{(product.incluye || []).map((item: string) => <li key={item} className="flex gap-2 text-sm"><CheckCircle2 size={17} className="shrink-0 text-primary"/>{item}</li>)}</ul>{product.descripcionEstado && <><h3 className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado físico</h3><p className="mt-3 text-sm leading-6 text-gray-400">{product.descripcionEstado}</p></>}</aside></div>
      </section><Footer/></main>
  );
}
