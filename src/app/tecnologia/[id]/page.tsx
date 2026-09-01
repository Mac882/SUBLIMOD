"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { technologyCategoriesCollection, technologyProductsCollection } from "@/lib/technology/repository";
import { buildTechnologyWhatsappUrl, defaultTechnologyWhatsappConfig, subscribeTechnologyWhatsapp, type TechnologyWhatsappConfig } from "@/lib/technology/whatsapp";
import type { TechnologyCategory, TechnologyProduct } from "@/lib/technology/types";

const fallbackLabels: Record<string, string> = {
  brand: "Marca", processor: "Procesador", ram: "RAM", storage: "Almacenamiento", os: "Sistema operativo",
  color: "Color", screenSize: "Tamaño de pantalla", resolution: "Resolución", refreshRate: "Frecuencia de actualización",
};

function ZoomIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M11 8v6M8 11h6" /></svg>;
}

export default function TecnologiaProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<TechnologyProduct | null>(null);
  const [category, setCategory] = useState<TechnologyCategory | null>(null);
  const [whatsapp, setWhatsapp] = useState<TechnologyWhatsappConfig>(defaultTechnologyWhatsappConfig);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

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

  useEffect(() => subscribeTechnologyWhatsapp(setWhatsapp), []);

  const images = useMemo(() => product?.images?.length ? product.images : product?.coverImage ? [product.coverImage] : [], [product]);
  const currentImage = images[activeImage] || images[0] || "";

  const specs = useMemo(() => {
    if (!product) return [] as { label: string; value: string }[];
    const fromCategory = (category?.specificationFields || []).flatMap((field) => {
      const value = product.specifications?.[field.id];
      return value === undefined || value === "" ? [] : [{ label: field.label, value: String(value) }];
    });
    const categoryLabels = new Set((category?.specificationFields || []).map((field) => field.label.toLowerCase()));
    const fromFilters = Object.entries(product.filterValues || {}).flatMap(([key, value]) => {
      if (!value || key === "brand" || categoryLabels.has((fallbackLabels[key] || key).toLowerCase())) return [];
      return [{ label: fallbackLabels[key] || key, value: String(value) }];
    });
    return [...fromCategory, ...fromFilters];
  }, [category, product]);

  const openGallery = (index = activeImage) => {
    setActiveImage(index);
    setZoomImage(null);
    setZoomScale(1);
    setGalleryOpen(true);
  };

  const openZoom = (index: number) => {
    setActiveImage(index);
    setZoomImage(index);
    setZoomScale(1);
  };

  useEffect(() => {
    const modalOpen = galleryOpen || zoomImage !== null;
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (zoomImage !== null) {
          setZoomImage(null);
          setZoomScale(1);
        } else {
          setGalleryOpen(false);
        }
      }
      if (galleryOpen && zoomImage === null && images.length > 1) {
        if (event.key === "ArrowRight") setActiveImage((value) => (value + 1) % images.length);
        if (event.key === "ArrowLeft") setActiveImage((value) => (value - 1 + images.length) % images.length);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryOpen, zoomImage, images.length]);

  if (!product) {
    return <main className="min-h-screen bg-[#f5f8ff] text-[#16254a]"><Navbar /><div className="mx-auto max-w-6xl px-4 py-20"><p>Producto no encontrado.</p><Link className="mt-4 inline-flex rounded-full bg-[#3158ee] px-5 py-3 text-sm font-bold text-white" href="/tecnologia">Volver a tecnología</Link></div><Footer /></main>;
  }

  const whatsappUrl = buildTechnologyWhatsappUrl(whatsapp.phone, product.name);

  return <main className="min-h-screen bg-[#f5f8ff] text-[#16254a]">
    <Navbar />
    <div className="relative overflow-hidden pb-16">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#c7d8ff]/55 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] top-44 h-96 w-96 rounded-full bg-[#8fd3ff]/35 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7890b4]" aria-label="Breadcrumb"><Link href="/">Inicio</Link><span>›</span><Link href="/tecnologia">Tecnología</Link><span>›</span><span className="text-[#3158ee]">{category?.name || "Producto"}</span></nav>

        <div className="mt-5 grid items-start gap-7 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-[0_24px_60px_rgba(42,67,125,0.12)] backdrop-blur">
            <button type="button" onClick={() => currentImage && openGallery(activeImage)} className="group relative block w-full cursor-zoom-in text-left" aria-label="Abrir galería del producto">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-[#e9efff]">
                {currentImage ? <img src={currentImage} alt={product.name} className="h-full w-full object-contain p-5 sm:p-7" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-[#7c8daa]">Sin imagen disponible</div>}
                <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 transition group-hover:opacity-100"><span className="rounded-full bg-[#17284d]/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">⌕ Ver galería</span></div>
                <div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#3158ee] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">{product.condition}</span>{product.available !== false && <span className="rounded-full bg-[#11b77a] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">Disponible</span>}</div>
              </div>
            </button>
            {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => { setActiveImage(index); openGallery(index); }} className={`overflow-hidden rounded-xl border-2 bg-white transition ${activeImage === index ? "border-[#3158ee]" : "border-transparent"}`} aria-label={`Abrir imagen ${index + 1}`}><img src={image} alt="" className="aspect-square w-full object-contain p-1" /></button>)}</div>}
            <p className="mt-2 text-center text-[10px] font-semibold text-[#8a9ab4]">Toca la imagen para abrir la galería</p>
          </section>

          <section className="pt-2 lg:pt-5">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3158ee]">{category?.name || "Tecnología"}</p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-[#17284d] sm:text-5xl">{product.name}</h1>
            <p className="mt-3 text-base font-semibold text-[#6a7e9e]">{product.brand || product.filterValues?.brand}{product.model ? ` · ${product.model}` : ""}</p>
            <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-2"><span className="text-4xl font-black text-[#3158ee]">{product.currency === "USD" ? "$" : "C$"}{Number(product.price).toLocaleString()}</span>{product.previousPrice > product.price && <span className="pb-1 text-sm font-bold text-[#8a9bb7] line-through">{product.currency === "USD" ? "$" : "C$"}{Number(product.previousPrice).toLocaleString()}</span>}</div>
            {product.shortDescription && <p className="mt-5 max-w-2xl text-base leading-7 text-[#566c8e]">{product.shortDescription}</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#dfe8fb] bg-white p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7086aa]">Estado</p><p className="mt-2 text-sm font-extrabold text-[#20345e]">{product.condition}</p></div><div className="rounded-2xl border border-[#dfe8fb] bg-white p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7086aa]">Disponibilidad</p><p className="mt-2 text-sm font-extrabold text-[#20345e]">{product.available === false ? "No disponible" : "Disponible"}</p></div><div className="rounded-2xl border border-[#dfe8fb] bg-white p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7086aa]">Categoría</p><p className="mt-2 truncate text-sm font-extrabold text-[#20345e]">{category?.name || "Tecnología"}</p></div></div>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/tecnologia" className="inline-flex items-center justify-center rounded-full border-2 border-[#3158ee] bg-white px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#3158ee] transition hover:bg-[#edf2ff]">← Ver tecnología</Link>{product.available !== false && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Realizar pedido por WhatsApp" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#25D366]/25 transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.2-3.5-8.3Zm-8.4 18.1h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-3.9 1 1-3.8-.2-.3a9.8 9.8 0 1 1 8.3 4.7Zm5.4-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.7-.8-2.8-1.4-3.9-3.2-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.3 1.4.5 2 .1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" /></svg>Realizar pedido <span aria-hidden="true">→</span></a>}</div>
            <p className="mt-3 text-xs font-medium text-[#8192ae]">Se abrirá WhatsApp con el producto seleccionado en el mensaje.</p>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]"><div className="rounded-[1.8rem] border border-[#dfe8fb] bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf2ff] text-[#3158ee]">▦</span><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3158ee]">Detalle técnico</p><h2 className="mt-1 text-xl font-black uppercase text-[#1b2e55]">Especificaciones</h2></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-[#e7edf8]">{specs.length ? specs.map((spec, index) => <div key={`${spec.label}-${index}`} className={`grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 text-sm ${index % 2 ? "bg-[#fbfcff]" : "bg-white"}`}><span className="font-bold text-[#334a70]">{spec.label}</span><span className="font-medium text-[#6980a2]">{spec.value}</span></div>) : <p className="p-6 text-sm text-[#7a8eac]">No hay especificaciones adicionales registradas.</p>}</div></div><aside className="rounded-[1.8rem] border border-[#dfe8fb] bg-gradient-to-br from-white to-[#eef5ff] p-6 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3158ee]">Compra con confianza</p><h2 className="mt-2 text-2xl font-black uppercase text-[#1b2e55]">Equipo seleccionado</h2><div className="mt-5 space-y-3 text-sm text-[#5b7193]"><p>✓ Información clara del equipo</p><p>✓ Imágenes reales del producto</p><p>✓ Estado visible antes de consultar</p>{product.warranty && <p>✓ {product.warrantyDetail || "Garantía incluida"}</p>}</div></aside></section>
        {(product.description || product.includes.length || product.tests) && <section className="mt-6 rounded-[1.8rem] border border-[#dfe8fb] bg-white p-6 shadow-sm sm:p-7"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3158ee]">Información adicional</p>{product.description && <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#586f92]">{product.description}</div>}{product.includes.length > 0 && <p className="mt-5 text-sm leading-6 text-[#586f92]"><strong className="text-[#253b62]">Incluye:</strong> {product.includes.join(", ")}</p>}{product.tests && <p className="mt-5 text-sm leading-6 text-[#586f92]"><strong className="text-[#253b62]">Pruebas realizadas:</strong> {product.tests}</p>}</section>}
      </div>
    </div>

    {galleryOpen && zoomImage === null && <div className="fixed inset-0 z-[1000] bg-white sm:bg-black/70 sm:p-4" role="dialog" aria-modal="true" aria-label={`Galería de ${product.name}`}>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden bg-white sm:h-[calc(100vh-2rem)] sm:rounded-2xl sm:shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8edf5] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3158ee]">Galería de productos</p><h2 className="mt-1 text-lg font-black text-[#17284d] sm:text-xl">{product.name}</h2></div><button type="button" onClick={() => setGalleryOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-3xl font-light text-[#52627d] transition hover:bg-[#f1f4f9]" aria-label="Cerrar galería">×</button></header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="md:hidden">
            <div className="divide-y divide-[#e7ebf2] bg-[#f5f6f8]">{images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => openZoom(index)} className="group relative block w-full bg-white text-left" aria-label={`Ampliar imagen ${index + 1}`}><img src={image} alt={`${product.name} imagen ${index + 1}`} className="block h-auto max-h-[78vh] w-full object-contain" /><span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-[#111827]/85 px-4 py-2 text-xs font-bold text-white opacity-90 shadow-lg"><ZoomIcon /> Ampliar</span></button>)}</div>
          </div>

          <div className="hidden h-full min-h-0 md:grid md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative flex min-h-0 items-center justify-center overflow-hidden bg-[#f4f5f7] p-5 lg:p-8">
              <button type="button" onClick={() => openZoom(activeImage)} className="group relative flex max-h-full max-w-full cursor-zoom-in items-center justify-center" aria-label="Hacer zoom en la imagen actual"><img src={currentImage} alt={`${product.name} ampliado`} className="max-h-[calc(100vh-9rem)] max-w-full object-contain transition duration-200 group-hover:scale-[1.01]" /><span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100"><span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2.5 text-sm font-bold text-white shadow-xl"><ZoomIcon /> Hacer zoom</span></span></button>
              {images.length > 1 && <><button type="button" onClick={() => setActiveImage((value) => (value - 1 + images.length) % images.length)} className="absolute left-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-[#17284d] shadow-lg" aria-label="Imagen anterior">‹</button><button type="button" onClick={() => setActiveImage((value) => (value + 1) % images.length)} className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-[#17284d] shadow-lg" aria-label="Siguiente imagen">›</button></>}
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">{activeImage + 1} / {images.length}</span>
            </div>
            <aside className="overflow-y-auto border-l border-[#e3e7ed] bg-white p-4"><p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#75839b]">Miniaturas</p><div className="grid grid-cols-2 gap-3">{images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`overflow-hidden rounded-xl border-2 bg-white transition ${activeImage === index ? "border-[#3158ee] shadow-md" : "border-[#e2e6ec] hover:border-[#9aa8bd]"}`} aria-label={`Seleccionar imagen ${index + 1}`}><img src={image} alt="" className="aspect-square w-full object-contain p-1.5" /></button>)}</div></aside>
          </div>
        </div>
      </div>
    </div>}

    {zoomImage !== null && images[zoomImage] && <div className="fixed inset-0 z-[1100] flex flex-col bg-[#07112a]/95 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label="Zoom de imagen">
      <div className="flex shrink-0 items-center justify-between"><span className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">{zoomImage + 1} / {images.length} · Zoom {Math.round(zoomScale * 100)}%</span><button type="button" onClick={() => { setZoomImage(null); setZoomScale(1); }} className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl font-bold text-[#17284d] shadow-xl" aria-label="Cerrar zoom">×</button></div>
      <div className="min-h-0 flex-1 overflow-auto py-3 sm:py-5"><div className="flex min-h-full min-w-full items-center justify-center"><img src={images[zoomImage]} alt={`${product.name} imagen ${zoomImage + 1} ampliada`} className="max-h-[calc(100vh-9rem)] max-w-[calc(100vw-2rem)] rounded-xl object-contain shadow-2xl transition-transform duration-200" style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }} /></div></div>
      <div className="flex shrink-0 justify-center gap-2 pt-2"><button type="button" onClick={() => setZoomScale((value) => Math.max(1, value - 0.25))} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold text-[#17284d] shadow-lg" aria-label="Reducir zoom">−</button><button type="button" onClick={() => setZoomScale((value) => Math.min(3, value + 0.25))} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold text-[#17284d] shadow-lg" aria-label="Aumentar zoom">+</button><button type="button" onClick={() => setZoomScale(1)} className="rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-widest text-[#17284d] shadow-lg">Restablecer</button></div>
    </div>}

    <Footer />
  </main>;
}
