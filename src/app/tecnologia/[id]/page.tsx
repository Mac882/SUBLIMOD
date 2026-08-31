"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams } from "next/navigation";
import type { TechnologyCategory, TechnologyProduct } from "@/lib/technology/types";
import { technologyCategoriesCollection, technologyProductsCollection } from "@/lib/technology/repository";

export default function TecnologiaProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<TechnologyProduct | null>(null);
  const [category, setCategory] = useState<TechnologyCategory | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, technologyProductsCollection, id), (snapshot) => {
      setProduct(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<TechnologyProduct, "id">) } : null);
    });
  }, [id]);

  useEffect(() => {
    if (!product?.categoryId) return;
    return onSnapshot(doc(db, technologyCategoriesCollection, product.categoryId), (snapshot) => {
      setCategory(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<TechnologyCategory, "id">) } : null);
    });
  }, [product?.categoryId]);

  if (!product) return <main className="min-h-screen bg-[#111] text-white"><Navbar /><div className="mx-auto max-w-6xl px-4 py-16"><p>Producto no encontrado.</p><Link className="mt-4 inline-block text-primary" href="/tecnologia">Volver a tecnología</Link></div><Footer /></main>;

  const images = product.images?.length ? product.images : product.coverImage ? [product.coverImage] : [];
  const currentImage = images[activeImage] || images[0];

  return <main className="min-h-screen bg-[#111] text-white"><Navbar /><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"><Link href="/tecnologia" className="text-sm font-bold text-gray-400 hover:text-white">← Volver a tecnología</Link><div className="mt-6 grid gap-8 lg:grid-cols-2"><section><div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/30">{currentImage ? <img src={currentImage} alt={product.name} className="h-full w-full object-contain"/> : <div className="flex h-full items-center justify-center text-gray-600">Sin imagen</div>}<span className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1 text-xs font-black uppercase text-primary">{product.condition}</span></div>{images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{images.map((image, index) => <button key={image} onClick={() => setActiveImage(index)} className={`aspect-square overflow-hidden rounded-lg border ${activeImage === index ? "border-primary" : "border-white/10"}`}><img src={image} alt="" className="h-full w-full object-cover"/></button>)}</div>}</section><section><p className="text-xs font-black uppercase tracking-[0.3em] text-primary">{category?.name || "Tecnología"}</p><h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">{product.name}</h1><p className="mt-2 text-gray-400">{product.brand || product.filterValues?.brand}{product.model ? ` · ${product.model}` : ""}</p><p className="mt-6 text-3xl font-black">{product.currency === "USD" ? "$" : "C$"}{Number(product.price).toLocaleString()}</p>{product.shortDescription && <p className="mt-5 text-gray-300">{product.shortDescription}</p>}<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-black uppercase">Especificaciones</h2><div className="mt-4 divide-y divide-white/10">{category?.specificationFields?.map((field) => { const value = product.specifications?.[field.id]; if (value === undefined || value === "") return null; return <div key={field.id} className="grid grid-cols-2 gap-4 py-3 text-sm"><strong>{field.label}</strong><span className="text-gray-400">{String(value)}</span></div>; })}{Object.entries(product.filterValues || {}).filter(([, value]) => value).map(([key, value]) => <div key={key} className="grid grid-cols-2 gap-4 py-3 text-sm"><strong>{key === "brand" ? "Marca" : key === "processor" ? "Procesador" : key === "ram" ? "RAM" : key === "storage" ? "Almacenamiento" : key === "os" ? "Sistema operativo" : key === "color" ? "Color" : key === "screenSize" ? "Tamaño de pantalla" : key === "resolution" ? "Resolución" : "Frecuencia"}</strong><span className="text-gray-400">{value}</span></div>)}</div></div></section></div>{(product.description || product.includes.length || product.warranty || product.tests) && <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="font-black uppercase">Información adicional</h2>{product.description && <p className="mt-4 whitespace-pre-line text-gray-300">{product.description}</p>}{product.includes.length > 0 && <p className="mt-4 text-gray-300"><strong>Incluye:</strong> {product.includes.join(", ")}</p>}{product.warranty && <p className="mt-4 text-gray-300"><strong>Garantía:</strong> {product.warrantyDetail || "Incluye garantía"}</p>}{product.tests && <p className="mt-4 text-gray-300"><strong>Pruebas:</strong> {product.tests}</p>}</section>}</div><Footer /></main>;
}
