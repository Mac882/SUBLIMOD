"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeTechnologyCategories, subscribeTechnologyFilterOptions, subscribeTechnologyProducts } from "@/lib/technology/repository";
import type { TechnologyCategory, TechnologyProduct } from "@/lib/technology/types";
import type { TechnologyFilterKey, TechnologyFilterOption } from "@/lib/technology/filterCatalog";

const FILTERS_BY_CATEGORY: Record<string, TechnologyFilterKey[]> = {
  laptops: ["brand", "processor", "ram", "storage", "os", "color"],
  "computadoras-escritorio": ["brand", "processor", "ram", "storage", "os", "color"],
  monitores: ["brand", "screenSize", "resolution", "refreshRate", "color"],
};
const LABELS: Record<TechnologyFilterKey, string> = { brand: "Marca", processor: "Procesador", ram: "RAM", storage: "Almacenamiento", os: "Sistema operativo", color: "Color", screenSize: "Tamaño", resolution: "Resolución", refreshRate: "Frecuencia" };
const CONDITION_OPTIONS = ["Nuevo", "Usado - Excelente", "Usado - Bueno"];

type Filters = Partial<Record<TechnologyFilterKey | "condition", string>>;

export default function TecnologiaPage() {
  const [categories, setCategories] = useState<TechnologyCategory[]>([]);
  const [products, setProducts] = useState<TechnologyProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<TechnologyFilterKey, TechnologyFilterOption[]>>({ brand: [], processor: [], ram: [], storage: [], os: [], color: [], screenSize: [], resolution: [], refreshRate: [] });
  const [categoryId, setCategoryId] = useState("all");
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => subscribeTechnologyCategories(setCategories), []);
  useEffect(() => subscribeTechnologyProducts(setProducts), []);
  useEffect(() => {
    const keys = Object.keys(LABELS) as TechnologyFilterKey[];
    const unsubs = keys.map((key) => subscribeTechnologyFilterOptions(key, (items) => setFilterOptions((current) => ({ ...current, [key]: items }))));
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, []);

  const visibleCategories = useMemo(() => categories.filter((category) => category.visible).sort((a, b) => a.order - b.order), [categories]);
  const selectedCategory = categoryId === "all" ? null : categories.find((category) => category.id === categoryId);
  const activeFilterKeys = selectedCategory ? FILTERS_BY_CATEGORY[selectedCategory.slug] || ["brand", "color"] : ["brand", "condition"] as TechnologyFilterKey[];

  const optionValues = useMemo(() => {
    const result = { ...filterOptions };
    (Object.keys(LABELS) as TechnologyFilterKey[]).forEach((key) => {
      const map = new Map(result[key].map((option) => [option.normalized, option.value]));
      products.forEach((product) => {
        const value = key === "brand" ? product.filterValues?.brand || product.brand : product.filterValues?.[key];
        if (value) map.set(value.trim().toLowerCase(), value);
      });
      result[key] = Array.from(map.values()).map((value) => ({ key, value, normalized: value.trim().toLowerCase(), id: `${key}-${value}` }));
    });
    return result;
  }, [filterOptions, products]);

  const filtered = useMemo(() => products.filter((product) => {
    if (product.available === false) return false;
    if (categoryId !== "all" && product.categoryId !== categoryId) return false;
    if (filters.condition && product.condition !== filters.condition) return false;
    for (const key of activeFilterKeys) {
      if (key === "condition") continue;
      const selected = filters[key];
      if (!selected) continue;
      const actual = key === "brand" ? product.filterValues?.brand || product.brand : product.filterValues?.[key];
      if (!actual || actual.trim().toLowerCase() !== selected.trim().toLowerCase()) return false;
    }
    const text = `${product.name} ${product.brand} ${product.model} ${product.sku}`.toLowerCase();
    return text.includes(search.toLowerCase().trim());
  }), [products, categoryId, filters, search, activeFilterKeys]);

  const clearFilters = () => setFilters({});
  const setCategory = (id: string) => { setCategoryId(id); clearFilters(); };

  return <main className="min-h-screen bg-[#111] text-white"><Navbar /><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <header className="mb-8"><p className="text-xs font-black uppercase tracking-[0.35em] text-primary">SubliMod / Tecnología</p><h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Tecnología</h1><p className="mt-3 max-w-2xl text-sm text-gray-400">Equipos disponibles, organizados por categoría y especificaciones importantes.</p></header>
    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4"><button onClick={() => setCategory("all")} className={`rounded-full px-4 py-2 text-xs font-black uppercase ${categoryId === "all" ? "bg-primary text-white" : "bg-white/5 text-gray-400"}`}>Todos</button>{visibleCategories.map((category) => <button key={category.id} onClick={() => setCategory(category.id || "")} className={`rounded-full px-4 py-2 text-xs font-black uppercase ${categoryId === category.id ? "bg-primary text-white" : "bg-white/5 text-gray-400"}`}>{category.name}</button>)}</div>
    <div className="mt-6 flex gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, marca o modelo..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none focus:border-primary"/><button onClick={() => setMobileFiltersOpen((value) => !value)} className="rounded-xl bg-white/10 px-4 py-3 text-xs font-black uppercase lg:hidden">Filtros</button></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className={`${mobileFiltersOpen ? "block" : "hidden"} rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:block`}><div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase">Filtros</h2><button onClick={clearFilters} className="text-[10px] font-bold text-primary">Limpiar</button></div><div className="mt-5 space-y-4">{activeFilterKeys.filter((key) => key !== "condition").map((key) => <label key={key} className="block text-xs font-bold uppercase text-gray-500">{LABELS[key]}<select value={filters[key] || ""} onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.value }))} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm font-normal text-white"><option value="">Todos</option>{optionValues[key].map((option) => <option key={option.id} value={option.value}>{option.value}</option>)}</select></label>)}{(categoryId === "all" || activeFilterKeys.includes("condition")) && <label className="block text-xs font-bold uppercase text-gray-500">Estado<select value={filters.condition || ""} onChange={(e) => setFilters((current) => ({ ...current, condition: e.target.value }))} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm font-normal text-white"><option value="">Todos</option>{CONDITION_OPTIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></label>}</div></aside>
      <section><div className="mb-4 flex items-center justify-between"><p className="text-xs text-gray-500">{filtered.length} {filtered.length === 1 ? "producto" : "productos"}</p><p className="text-xs text-gray-500">Solo equipos disponibles</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <Link href={`/tecnologia/${product.id}`} key={product.id} className="group"><article className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-primary/50"><div className="relative aspect-[4/3] bg-black/30">{(product.coverImage || product.images?.[0]) ? <img src={product.coverImage || product.images[0]} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"/> : <div className="flex h-full items-center justify-center text-xs text-gray-600">Sin imagen</div>}<span className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-[10px] font-black uppercase text-primary">{product.condition}</span></div><div className="p-5"><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{categories.find((category) => category.id === product.categoryId)?.name || "Tecnología"}</p><h2 className="mt-2 font-black uppercase">{product.name}</h2><p className="mt-1 text-sm text-gray-400">{product.brand || product.filterValues?.brand}{product.model ? ` · ${product.model}` : ""}</p><p className="mt-4 text-xl font-black">{product.currency === "USD" ? "$" : "C$"}{Number(product.price).toLocaleString()}</p></div></article></Link>)}{filtered.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-3">No hay productos que coincidan con los filtros seleccionados.</div>}</div></section>
    </div>
  </div><Footer /></main>;
}
