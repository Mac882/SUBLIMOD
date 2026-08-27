"use client";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailModal from "@/components/ProductDetailModal";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { ArrowRight, Search, X, ChevronLeft, Package, Layers } from "lucide-react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = searchParams.get("filtro") || "";
  const isCategoriesView = searchParams.get("vista") === "categorias";

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState(isCategoriesView ? "" : initialFilter);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubProd = onSnapshot(
      query(collection(db, "productos"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubCat = onSnapshot(
      query(collection(db, "categorias"), orderBy("nombre", "asc")),
      (snapshot) => {
        setCategorias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  useEffect(() => {
    setActiveFilter(isCategoriesView ? "" : initialFilter);
    setSearchQuery("");
    setSelectedProduct(null);
  }, [initialFilter, isCategoriesView]);

  const matchesCategory = (prodCat: string, filterCat: string) => {
    if (!filterCat || filterCat === "Todos") return true;
    if (!prodCat) return false;

    const cleanProd = prodCat.trim().toLowerCase().replace(/s$/, "");
    const cleanFilter = filterCat.trim().toLowerCase().replace(/s$/, "");

    return cleanProd === cleanFilter || prodCat.trim().toLowerCase() === filterCat.trim().toLowerCase();
  };

  const categoryProductCount = (categoryName: string) =>
    productos.filter(product => matchesCategory(product.categoria, categoryName)).length;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return productos.filter(product => {
      const categoryMatch = matchesCategory(product.categoria, activeFilter || "Todos");
      const searchMatch = !normalizedSearch || product.nombre?.toLowerCase().includes(normalizedSearch);
      return categoryMatch && searchMatch;
    });
  }, [productos, activeFilter, searchQuery]);

  const showProducts = Boolean(activeFilter);

  const openCategory = (categoryName: string) => {
    setActiveFilter(categoryName);
    setSearchQuery("");
    router.replace(`/catalogo?filtro=${encodeURIComponent(categoryName)}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showAllProducts = () => {
    setActiveFilter("Todos");
    setSearchQuery("");
    router.replace("/catalogo?filtro=Todos", { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToCategories = () => {
    setActiveFilter("");
    setSearchQuery("");
    router.replace("/catalogo?vista=categorias", { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-white text-secondary">
      <Navbar />

      <header className="bg-gray-50 py-14 md:py-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4 tracking-tight uppercase">
            Catálogo SubliMod
          </h1>
          <p className="text-secondary/60 text-base md:text-lg max-w-2xl mx-auto italic font-medium mb-8">
            {showProducts
              ? `Productos de ${activeFilter}`
              : "Explora nuestras categorías y encuentra el producto que quieres personalizar."}
          </p>

          <div className="max-w-md mx-auto relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder={showProducts ? "¿Qué producto buscas?" : "Busca una categoría o producto"}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!showProducts && e.target.value.trim()) showAllProducts();
              }}
              className="w-full bg-white border-2 border-gray-200 rounded-full py-4 pl-14 pr-12 text-sm font-bold text-secondary outline-none focus:border-primary focus:shadow-xl focus:shadow-primary/5 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {showProducts ? (
        <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <button
              type="button"
              onClick={backToCategories}
              className="inline-flex items-center gap-2 self-start px-5 py-3 rounded-full border-2 border-gray-100 bg-white text-secondary/70 hover:border-primary/30 hover:text-primary font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <ChevronLeft size={16} /> Volver a categorías
            </button>

            <button
              type="button"
              onClick={showAllProducts}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                activeFilter === "Todos"
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white border-gray-100 text-secondary/60 hover:border-primary/30 hover:text-primary"
              }`}
            >
              <Package size={15} /> Todos los productos
            </button>
          </div>

          {activeFilter !== "Todos" && (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Categoría:</span>
              <span className="bg-primary text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                {activeFilter}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
                {searchQuery
                  ? `No hay resultados para "${searchQuery}"`
                  : `No se encontraron productos en "${activeFilter}"`}
              </p>
              <button
                type="button"
                onClick={backToCategories}
                className="mt-5 text-primary font-black text-[10px] uppercase tracking-widest underline"
              >
                Volver a categorías
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className="group bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-accent text-secondary text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border border-black/5">
                        {prod.categoria}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 md:p-7">
                    <h3 className="text-secondary font-black text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                      {prod.nombre}
                    </h3>
                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-50">
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
      ) : (
        <section className="max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8 md:mb-10">
            <div>
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-2">Explora</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Categorías</h2>
              <p className="text-gray-400 text-sm mt-2">Selecciona una categoría para ver sus productos.</p>
            </div>
            <button
              type="button"
              onClick={showAllProducts}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all self-start sm:self-auto"
            >
              <Package size={16} /> Ver todos los productos
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Cargando categorías...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <Layers className="mx-auto text-gray-300 mb-4" size={42} />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No hay categorías disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {categorias.map((cat) => {
                const count = categoryProductCount(cat.nombre);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openCategory(cat.nombre)}
                    className="group text-left bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="relative h-48 md:h-56 bg-gray-50 overflow-hidden">
                      {cat.imagenUrl ? (
                        <img
                          src={cat.imagenUrl}
                          alt={cat.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Layers size={52} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/95 backdrop-blur-sm text-secondary text-[9px] font-black px-3 py-1.5 rounded-full uppercase flex items-center gap-2 shadow-sm">
                          <Package size={11} className="text-primary" /> {count} {count === 1 ? "Artículo" : "Artículos"}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-white text-secondary p-3 rounded-2xl shadow-lg group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                    <div className="p-6 md:p-7">
                      <h3 className="text-xl font-black uppercase tracking-tight text-secondary group-hover:text-primary transition-colors">
                        {cat.nombre}
                      </h3>
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2 italic font-medium min-h-[2.5rem]">
                        {cat.descripcion || cat.description || "Productos personalizables para crear algo único."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <QuoteCartDrawer />
      <Footer />
    </main>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <p className="font-black text-xs uppercase tracking-[0.3em] text-gray-300 animate-pulse">Cargando SubliMod...</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
