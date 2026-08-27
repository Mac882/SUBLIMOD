"use client";
import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailModal from "@/components/ProductDetailModal";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { ArrowRight, Search, X, ChevronDown } from "lucide-react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filtro") || "Todos";
  
  const [productos, setProductos] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // --- ESTADO PARA LA BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- CATEGORÍAS RESPONSIVAS EN MÓVIL ---
  const mobileCategoryContainerRef = useRef<HTMLDivElement>(null);
  const mobileCategoryMeasureRef = useRef<HTMLDivElement>(null);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(0);

  // 1. ESCUCHA DE PRODUCTOS EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. GENERACIÓN DINÁMICA DE CATEGORÍAS (Sin duplicados y normalizadas)
  const categoriesList = useMemo(() => {
    const rawCategories = productos.map(p => p.categoria?.trim()).filter(Boolean);
    const uniqueCategories = Array.from(new Set(rawCategories));
    return ["Todos", ...uniqueCategories.sort()];
  }, [productos]);

  // 3. CALCULAR CUÁNTAS CATEGORÍAS CABEN REALMENTE EN EL ANCHO MÓVIL
  //    Se reserva espacio para "Más categorías" cuando todavía quedan opciones.
  useEffect(() => {
    const container = mobileCategoryContainerRef.current;
    const measure = mobileCategoryMeasureRef.current;
    if (!container || !measure || categoriesList.length === 0) return;

    const calculateVisibleCategories = () => {
      if (window.innerWidth >= 1024) {
        setMobileVisibleCount(categoriesList.length);
        return;
      }

      const availableWidth = container.clientWidth;
      const gap = 12;
      const moreControlWidth = categoriesList.length > 1 ? 132 : 0;
      const measuredButtons = Array.from(measure.children) as HTMLElement[];

      let usedWidth = 0;
      let count = 0;

      for (const button of measuredButtons) {
        const buttonWidth = button.getBoundingClientRect().width;
        const nextWidth = usedWidth + (count > 0 ? gap : 0) + buttonWidth;
        const categoriesRemainingAfterThis = categoriesList.length - (count + 1);
        const reservedMoreWidth = categoriesRemainingAfterThis > 0 ? gap + moreControlWidth : 0;

        if (nextWidth + reservedMoreWidth <= availableWidth) {
          usedWidth = nextWidth;
          count += 1;
        } else {
          break;
        }
      }

      setMobileVisibleCount(Math.max(1, Math.min(count, categoriesList.length)));
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(calculateVisibleCategories);
    });

    observer.observe(container);
    calculateVisibleCategories();

    return () => observer.disconnect();
  }, [categoriesList]);

  const visibleMobileCategories = categoriesList.slice(0, mobileVisibleCount);
  const hiddenMobileCategories = categoriesList.slice(mobileVisibleCount);

  // 4. HELPER DE COMPARACIÓN FLEXIBLE (Singular/Plural, Case Insensitive, Trim)
  const matchesCategory = (prodCat: string, filterCat: string) => {
    if (filterCat === "Todos") return true;
    if (!prodCat) return false;
    
    const cleanProd = prodCat.trim().toLowerCase().replace(/s$/, '');
    const cleanFilter = filterCat.trim().toLowerCase().replace(/s$/, '');
    
    return cleanProd === cleanFilter || prodCat.trim().toLowerCase() === filterCat.trim().toLowerCase();
  };

  // 5. FILTRADO DE PRODUCTOS (Categoría + Nombre)
  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const categoryMatch = matchesCategory(p.categoria, activeFilter);
      const searchMatch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [productos, activeFilter, searchQuery]);

  // Sincronizar filtro cuando cambia la URL
  useEffect(() => {
    if (initialFilter) setActiveFilter(initialFilter);
  }, [initialFilter]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Header Estilizado */}
      <header className="bg-gray-50 py-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4 tracking-tight uppercase">Catálogo SubliMod</h1>
          <p className="text-secondary/60 text-lg max-w-2xl mx-auto italic font-medium mb-10">Explora productos listos para personalizar con la mejor calidad de Jinotega.</p>

          {/* BARRA DE BÚSQUEDA INTEGRADA */}
          <div className="max-w-md mx-auto relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="¿Qué producto buscas?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-full py-4 pl-14 pr-12 text-sm font-bold text-secondary outline-none focus:border-primary focus:shadow-xl focus:shadow-primary/5 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barra de Filtros Dinámicos */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 md:py-6">
        <div
          ref={mobileCategoryContainerRef}
          className="max-w-7xl mx-auto px-4 relative"
        >
          {/* Versión móvil: muestra solo lo que cabe y agrupa el resto en un desplegable nativo. */}
          <div className="lg:hidden flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
              {visibleMobileCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`shrink-0 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                    matchesCategory(cat, activeFilter)
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : "bg-transparent border-gray-100 text-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {hiddenMobileCategories.length > 0 && (
              <div className="relative shrink-0 w-[132px]">
                <label htmlFor="mobile-category-more" className="sr-only">Más categorías</label>
                <select
                  id="mobile-category-more"
                  value={hiddenMobileCategories.includes(activeFilter) ? activeFilter : ""}
                  onChange={(e) => {
                    if (e.target.value) setActiveFilter(e.target.value);
                  }}
                  className={`w-full appearance-none rounded-full border-2 px-4 py-3 pr-9 text-[10px] font-black uppercase tracking-widest outline-none transition-all ${
                    hiddenMobileCategories.includes(activeFilter)
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-gray-50 text-secondary"
                  }`}
                >
                  <option value="">Más categorías</option>
                  {hiddenMobileCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={15} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${hiddenMobileCategories.includes(activeFilter) ? "text-white" : "text-gray-500"}`} />
              </div>
            )}
          </div>

          {/* Medidor invisible para calcular el ancho real de cada categoría. */}
          <div
            ref={mobileCategoryMeasureRef}
            aria-hidden="true"
            className="absolute left-4 top-0 flex gap-3 w-max pointer-events-none opacity-0"
          >
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                tabIndex={-1}
                className="shrink-0 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-2"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Versión escritorio: conserva el comportamiento actual. */}
          <div className="hidden lg:flex gap-3 overflow-x-auto no-scrollbar">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  matchesCategory(cat, activeFilter)
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "bg-transparent border-gray-100 text-gray-400 hover:border-primary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Analizando Inventario...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
              {searchQuery 
                ? `No hay resultados para "${searchQuery}" en ${activeFilter}` 
                : `No se encontraron productos en "${activeFilter}"`}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary font-bold text-xs uppercase underline"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {filteredProducts.map((prod) => (
              <div 
                key={prod.id} 
                onClick={() => setSelectedProduct(prod)}
                className="group bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img src={prod.imagenUrl} alt={prod.nombre} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-secondary text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border border-black/5">
                      {prod.categoria}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-secondary font-black text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">{prod.nombre}</h3>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Desde</span>
                      <span className="text-primary font-black text-xl tracking-tighter">C$ {prod.escalasPrecios?.[0]?.price || 0}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RENDERIZADO DEL MODAL */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* CARRITO Y DRAWER FLOTANTE DE COTIZACIÓN */}
      <QuoteCartDrawer />

      <Footer />
    </main>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="font-black text-xs uppercase tracking-[0.3em] text-gray-300 animate-pulse">Cargando SubliMod...</p>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}