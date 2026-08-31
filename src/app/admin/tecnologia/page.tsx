"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/admin/AuthGuard";
import {
  createTechnologyCategory,
  createTechnologyFilterOption,
  createTechnologyProduct,
  deleteTechnologyCategory,
  deleteTechnologyProduct,
  subscribeTechnologyCategories,
  subscribeTechnologyFilterOptions,
  subscribeTechnologyProducts,
  updateTechnologyCategory,
  updateTechnologyProduct,
} from "@/lib/technology/repository";
import { MAX_TECHNOLOGY_IMAGES, removeTechnologyProductImage, uploadTechnologyProductImages } from "@/lib/technology/imageStorage";
import { normalizeTechnologyFilterValue, type TechnologyFilterKey, type TechnologyFilterOption } from "@/lib/technology/filterCatalog";
import type { TechnologyCategory, TechnologyFieldDefinition, TechnologyProduct } from "@/lib/technology/types";
import { emptyTechnologyProduct } from "@/lib/technology/types";

const slugify = (value: string) => value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const emptyCategory: Omit<TechnologyCategory, "id"> = { name: "", slug: "", description: "", visible: true, order: 0, specificationFields: [] };
const conditionOptions: TechnologyProduct["condition"][] = ["Nuevo", "Usado - Excelente", "Usado - Bueno"];
const filterLabels: Record<TechnologyFilterKey, string> = {
  brand: "Marca", processor: "Procesador", ram: "RAM", storage: "Almacenamiento", os: "Sistema operativo",
  color: "Color", screenSize: "Tamaño de pantalla", resolution: "Resolución", refreshRate: "Frecuencia de actualización",
};

type PendingImage = { file: File; preview: string };
function withoutId<T extends { id?: string }>(value: T): Omit<T, "id"> { const { id: _id, ...rest } = value; return rest; }

function FilterSelect({
  filterKey, value, options, onChange, onAdd,
}: { filterKey: TechnologyFilterKey; value: string; options: TechnologyFilterOption[]; onChange: (value: string) => void; onAdd: (value: string) => Promise<void>; }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const submit = async () => { const clean = draft.trim(); if (!clean) return; await onAdd(clean); onChange(clean); setDraft(""); setAdding(false); };
  return <div className="space-y-2">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white">
      <option value="">Seleccionar {filterLabels[filterKey].toLowerCase()}</option>
      {options.map((option) => <option key={option.id} value={option.value}>{option.value}</option>)}
    </select>
    {!adding ? <button type="button" onClick={() => setAdding(true)} className="text-xs font-bold text-primary hover:underline">+ Agregar {filterLabels[filterKey].toLowerCase()}</button> : <div className="flex gap-2">
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }} className="min-w-0 flex-1 rounded-lg bg-black/30 p-2 text-sm text-white" placeholder={`Nueva ${filterLabels[filterKey].toLowerCase()}`} />
      <button type="button" onClick={() => void submit()} className="rounded-lg bg-primary px-3 text-xs font-bold">Guardar</button>
      <button type="button" onClick={() => setAdding(false)} className="rounded-lg bg-white/10 px-3 text-xs">×</button>
    </div>}
  </div>;
}

function TechnologyManager() {
  const [categories, setCategories] = useState<TechnologyCategory[]>([]);
  const [products, setProducts] = useState<TechnologyProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<TechnologyFilterKey, TechnologyFilterOption[]>>({ brand: [], processor: [], ram: [], storage: [], os: [], color: [], screenSize: [], resolution: [], refreshRate: [] });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState<TechnologyProduct>(emptyTechnologyProduct);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"categories" | "products">("products");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeTechnologyCategories(setCategories), []);
  useEffect(() => subscribeTechnologyProducts(setProducts), []);
  useEffect(() => {
    const unsubs = (Object.keys(filterLabels) as TechnologyFilterKey[]).map((key) => subscribeTechnologyFilterOptions(key, (items) => setFilterOptions((current) => ({ ...current, [key]: items }))));
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const category = categoryMap.get(productForm.categoryId);
  const isLaptop = category?.slug === "laptops";
  const isDesktop = category?.slug === "computadoras-escritorio";
  const isMonitor = category?.slug === "monitores";

  const derivedOptions = useMemo(() => {
    const keys = Object.keys(filterLabels) as TechnologyFilterKey[];
    const result = { ...filterOptions };
    for (const key of keys) {
      const values = new Map(result[key].map((option) => [option.normalized, option.value]));
      for (const product of products) {
        const value = product.filterValues?.[key];
        if (value) values.set(normalizeTechnologyFilterValue(value), value);
        if (key === "brand" && product.brand) values.set(normalizeTechnologyFilterValue(product.brand), product.brand);
      }
      result[key] = Array.from(values, ([normalized, display]) => ({ id: `derived-${key}-${normalized}`, key, value: display, normalized }));
    }
    return result;
  }, [filterOptions, products]);

  const clearPendingImages = () => { pendingImages.forEach((item) => URL.revokeObjectURL(item.preview)); setPendingImages([]); };
  const resetCategory = () => { setCategoryForm(emptyCategory); setEditingCategory(null); };
  const resetProduct = () => { clearPendingImages(); setProductForm(emptyTechnologyProduct); setEditingProduct(null); };

  const selectImages = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const remaining = MAX_TECHNOLOGY_IMAGES - productForm.images.length - pendingImages.length;
    if (remaining <= 0) return setError("Un producto puede tener como máximo 5 imágenes.");
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, remaining);
    setPendingImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    if (selected.length < files.length) setError("Solo se pueden guardar 5 imágenes por producto.");
  };

  const removeExisting = async (url: string) => {
    setError("");
    try { await removeTechnologyProductImage(url); } catch (e) { console.warn(e); }
    setProductForm((current) => { const images = current.images.filter((image) => image !== url); return { ...current, images, coverImage: current.coverImage === url ? (images[0] || "") : current.coverImage }; });
  };
  const removePending = (index: number) => setPendingImages((current) => { const item = current[index]; if (item) URL.revokeObjectURL(item.preview); return current.filter((_, i) => i !== index); });
  const makePrimary = (index: number) => setProductForm((current) => { const images = [...current.images]; const primary = images.splice(index, 1)[0]; return primary ? { ...current, images: [primary, ...images], coverImage: primary } : current; });
  const makePendingPrimary = (index: number) => setPendingImages((current) => { if (index < 0 || index >= current.length) return current; const next = [...current]; const [primary] = next.splice(index, 1); next.unshift(primary); return next; });

  const setFilterValue = (key: TechnologyFilterKey, value: string) => setProductForm((current) => ({ ...current, filterValues: { ...(current.filterValues || {}), [key]: value }, ...(key === "brand" ? { brand: value } : {}) }));
  const addFilterOption = async (key: TechnologyFilterKey, value: string) => {
    const normalized = normalizeTechnologyFilterValue(value);
    const exists = filterOptions[key].some((option) => option.normalized === normalized);
    if (!exists) await createTechnologyFilterOption(key, value);
  };

  const saveCategory = async () => {
    setError("");
    if (!categoryForm.name.trim()) return setError("La categoría necesita un nombre.");
    try { const payload = { ...categoryForm, name: categoryForm.name.trim(), slug: slugify(categoryForm.name) }; editingCategory ? await updateTechnologyCategory(editingCategory, payload) : await createTechnologyCategory(payload); resetCategory(); }
    catch (e) { console.error(e); setError("No se pudo guardar la categoría."); }
  };

  const saveProduct = async () => {
    setError("");
    if (!productForm.categoryId || !productForm.name.trim()) return setError("El producto necesita categoría y nombre.");
    if (productForm.price <= 0) return setError("El precio debe ser mayor que cero.");
    if (productForm.images.length + pendingImages.length > MAX_TECHNOLOGY_IMAGES) return setError("Un producto puede tener como máximo 5 imágenes.");
    if (isLaptop && (!productForm.filterValues?.brand || !productForm.filterValues?.processor || !productForm.filterValues?.ram || !productForm.filterValues?.storage)) return setError("Para una laptop completa Marca, Procesador, RAM y Almacenamiento son necesarios.");
    setSaving(true);
    try {
      const filterValues = { ...(productForm.filterValues || {}) };
      const base: Omit<TechnologyProduct, "id"> = { ...productForm, filterValues, brand: filterValues.brand || productForm.brand.trim(), name: productForm.name.trim(), model: productForm.model.trim(), sku: productForm.sku.trim(), coverImage: productForm.coverImage || productForm.images[0] || "" };
      let id = editingProduct;
      if (id) await updateTechnologyProduct(id, base); else id = (await createTechnologyProduct(base)).id;
      if (id && pendingImages.length) {
        const uploaded = await uploadTechnologyProductImages(id, pendingImages.map((item) => item.file));
        const images = [...base.images, ...uploaded].slice(0, MAX_TECHNOLOGY_IMAGES);
        await updateTechnologyProduct(id, { images, coverImage: images[0] || "" });
      }
      resetProduct();
    } catch (e) { console.error(e); setError("No se pudo guardar el producto o sus imágenes."); }
    finally { setSaving(false); }
  };

  const editProduct = (product: TechnologyProduct) => { setEditingProduct(product.id || null); setProductForm({ ...product, filterValues: product.filterValues || { brand: product.brand } }); setActiveSection("products"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleAvailability = async (product: TechnologyProduct) => { if (!product.id) return; try { await updateTechnologyProduct(product.id, { available: product.available === false }); } catch (e) { console.error(e); setError("No se pudo cambiar la disponibilidad."); } };
  const addField = () => setCategoryForm((current) => ({ ...current, specificationFields: [...current.specificationFields, { id: `field_${Date.now()}`, label: "", type: "text", options: [], required: false, order: current.specificationFields.length }] }));
  const updateField = (id: string, patch: Partial<TechnologyFieldDefinition>) => setCategoryForm((current) => ({ ...current, specificationFields: current.specificationFields.map((field) => field.id === id ? { ...field, ...patch } : field) }));
  const removeField = (id: string) => setCategoryForm((current) => ({ ...current, specificationFields: current.specificationFields.filter((field) => field.id !== id) }));

  const renderFilter = (key: TechnologyFilterKey) => <FilterSelect filterKey={key} value={productForm.filterValues?.[key] || ""} options={derivedOptions[key]} onChange={(value) => setFilterValue(key, value)} onAdd={(value) => addFilterOption(key, value)} />;

  return <AuthGuard><main className="min-h-screen bg-[#111] p-5 text-white md:p-10"><div className="mx-auto max-w-7xl">
    <header className="mb-8"><Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white">← Volver al administrador</Link><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">SubliMod / Admin</p><h1 className="mt-2 text-3xl font-black uppercase">Tecnología</h1><p className="mt-2 max-w-3xl text-sm text-gray-400">Catálogo tecnológico con categorías predefinidas y valores filtrables reutilizables.</p></header>
    {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
    <div className="mb-8 flex gap-2 border-b border-white/10"><button onClick={() => setActiveSection("products")} className={`px-5 py-3 text-sm font-bold ${activeSection === "products" ? "border-b-2 border-primary text-white" : "text-gray-500"}`}>Productos</button><button onClick={() => setActiveSection("categories")} className={`px-5 py-3 text-sm font-bold ${activeSection === "categories" ? "border-b-2 border-primary text-white" : "text-gray-500"}`}>Categorías</button></div>

    {activeSection === "products" && <section className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-black uppercase">{editingProduct ? "Editar producto" : "Nuevo producto"}</h2>{editingProduct && <button onClick={resetProduct} className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold">Cancelar edición</button>}</div>
        <label className="mt-5 block text-xs font-bold uppercase text-gray-500">Categoría<select value={productForm.categoryId} onChange={(e) => setProductForm({ ...emptyTechnologyProduct, categoryId: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar categoría</option>{categories.filter((item) => item.visible).sort((a,b) => a.order-b.order).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Datos principales</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="block text-xs font-bold uppercase text-gray-500">Nombre<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Modelo<input value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">SKU<input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Precio<input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Moneda<select value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value as TechnologyProduct["currency"] })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="USD">USD</option><option value="NIO">NIO</option></select></label><label className="block text-xs font-bold uppercase text-gray-500">Estado del equipo<select value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value as TechnologyProduct["condition"] })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white">{conditionOptions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></label></div></div>

        {(isLaptop || isDesktop || isMonitor) && <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Filtros del producto</p><p className="mt-1 text-xs text-gray-500">Los valores se guardan en Firebase y quedan disponibles para los siguientes productos.</p><div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-bold uppercase text-gray-500">Marca{renderFilter("brand")}</label>
          {(isLaptop || isDesktop) && <label className="block text-xs font-bold uppercase text-gray-500">Procesador{renderFilter("processor")}</label>}
          {(isLaptop || isDesktop) && <label className="block text-xs font-bold uppercase text-gray-500">RAM{renderFilter("ram")}</label>}
          {(isLaptop || isDesktop) && <label className="block text-xs font-bold uppercase text-gray-500">Almacenamiento{renderFilter("storage")}</label>}
          {(isLaptop || isDesktop) && <label className="block text-xs font-bold uppercase text-gray-500">Sistema operativo{renderFilter("os")}</label>}
          <label className="block text-xs font-bold uppercase text-gray-500">Color{renderFilter("color")}</label>
          {(isLaptop || isMonitor) && <label className="block text-xs font-bold uppercase text-gray-500">Tamaño de pantalla{renderFilter("screenSize")}</label>}
          {isMonitor && <><label className="block text-xs font-bold uppercase text-gray-500">Resolución{renderFilter("resolution")}</label><label className="block text-xs font-bold uppercase text-gray-500">Frecuencia{renderFilter("refreshRate")}</label></>}
        </div></div>}

        {isDesktop && <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Tipo de equipo</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><input type="radio" checked={productForm.specifications.equipmentType === "CPU"} onChange={() => setProductForm({ ...productForm, specifications: { ...productForm.specifications, equipmentType: "CPU" } })} />Solo CPU / torre</label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><input type="radio" checked={productForm.specifications.equipmentType === "PC completa"} onChange={() => setProductForm({ ...productForm, specifications: { ...productForm.specifications, equipmentType: "PC completa" } })} />PC completa</label></div></div>}

        {category?.specificationFields?.length ? <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Especificaciones adicionales</p><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{category.specificationFields.map((field) => <label key={field.id} className="block text-xs font-bold uppercase text-gray-500">{field.label}{field.required ? " *" : ""}{field.type === "select" ? <select value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: e.target.value } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "boolean" ? <select value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: e.target.value === "true" } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar</option><option value="true">Sí</option><option value="false">No</option></select> : <input type={field.type === "number" ? "number" : "text"} value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: field.type === "number" ? Number(e.target.value) : e.target.value } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" />}</label>)}</div></div> : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Estado físico y descripción</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="block text-xs font-bold uppercase text-gray-500">Detalles físicos<input value={productForm.physicalCondition} onChange={(e) => setProductForm({ ...productForm, physicalCondition: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" placeholder="Ej. Leves marcas de uso" /></label><label className="block text-xs font-bold uppercase text-gray-500">Incluye<input value={productForm.includes.join(", ")} onChange={(e) => setProductForm({ ...productForm, includes: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" placeholder="Cargador, teclado, mouse..." /></label></div><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción corta<input value={productForm.shortDescription} onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción completa<textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="mt-2 min-h-32 w-full rounded-xl bg-black/30 p-3 text-white" /></label></div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Galería</p><p className="mt-1 text-xs text-gray-500">Máximo 5 imágenes. Se comprimen antes de subirlas a Firebase Storage.</p></div><label className="cursor-pointer rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase">Agregar imágenes<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { selectImages(e.target.files); e.currentTarget.value = ""; }} /></label></div>{(productForm.images.length + pendingImages.length) > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{productForm.images.map((image, index) => <div key={image} className="relative overflow-hidden rounded-xl border border-white/10"><img src={image} alt="" className="aspect-square w-full object-cover"/><button type="button" onClick={() => makePrimary(index)} className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold">{index === 0 ? "Principal" : "Hacer principal"}</button><button type="button" onClick={() => void removeExisting(image)} className="absolute right-2 top-2 rounded-md bg-red-500/80 px-2 py-1 text-[10px] font-bold">×</button></div>)}{pendingImages.map((item, index) => <div key={item.preview} className="relative overflow-hidden rounded-xl border border-primary/40"><img src={item.preview} alt="" className="aspect-square w-full object-cover"/><button type="button" onClick={() => makePendingPrimary(index)} className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold">{index === 0 ? "Principal al guardar" : "Hacer principal"}</button><button type="button" onClick={() => removePending(index)} className="absolute right-2 top-2 rounded-md bg-red-500/80 px-2 py-1 text-[10px] font-bold">×</button></div>)}</div>}</div>

        <div className="mt-6 flex flex-wrap justify-end gap-3"><button onClick={resetProduct} className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold">Limpiar</button><button disabled={saving} onClick={() => void saveProduct()} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold disabled:opacity-50">{saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Guardar producto"}</button></div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black uppercase">Productos registrados</h2><span className="text-xs text-gray-500">{products.length} registrados</span></div><div className="space-y-3">{products.map((product) => <article key={product.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/10 p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4"><img src={product.coverImage || product.images?.[0] || ""} alt="" className="h-16 w-16 rounded-xl bg-black object-cover"/><div><h3 className="font-black uppercase">{product.name}</h3><p className="text-xs text-gray-500">{categoryMap.get(product.categoryId)?.name || "Sin categoría"} · {product.brand || product.filterValues?.brand || "Sin marca"}</p><p className="mt-1 text-xs text-gray-500">{product.available === false ? "No disponible" : "Disponible"} · {product.condition}</p></div></div><div className="flex flex-wrap gap-2"><button onClick={() => void toggleAvailability(product)} className={`rounded-lg px-3 py-2 text-xs font-bold ${product.available === false ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"}`}>{product.available === false ? "No disponible" : "Disponible"}</button><button onClick={() => editProduct(product)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">Editar</button><button onClick={async () => { if (product.id) await deleteTechnologyProduct(product.id); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">Eliminar</button></div></article>)}{products.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">Todavía no hay productos tecnológicos.</p>}</div></div>
    </section>}

    {activeSection === "categories" && <section className="grid gap-8 lg:grid-cols-[1fr_1.3fr]"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-lg font-black uppercase">{editingCategory ? "Editar categoría" : "Nueva categoría"}</h2><label className="mt-5 block text-xs font-bold uppercase text-gray-500">Nombre<input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" placeholder="Ej. Tablets" /></label><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción<textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={categoryForm.visible} onChange={(e) => setCategoryForm({ ...categoryForm, visible: e.target.checked })} />Visible para clientes</label><div className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase">Campos adicionales</h3><button onClick={addField} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold">+ Campo</button></div><div className="mt-4 space-y-3">{categoryForm.specificationFields.map((field) => <div key={field.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="rounded-lg bg-white/5 p-2 text-sm" placeholder="Nombre del campo" /><select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as TechnologyFieldDefinition["type"] })} className="rounded-lg bg-white/5 p-2 text-sm"><option value="text">Texto</option><option value="number">Número</option><option value="select">Selección</option><option value="boolean">Sí / No</option></select></div>{field.type === "select" && <input value={(field.options || []).join(", ")} onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="mt-2 w-full rounded-lg bg-white/5 p-2 text-sm" placeholder="Opciones separadas por comas" />}<div className="mt-2 flex justify-between"><label className="text-xs text-gray-400"><input type="checkbox" checked={Boolean(field.required)} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="mr-2" />Obligatorio</label><button onClick={() => removeField(field.id)} className="text-xs font-bold text-red-400">Eliminar</button></div></div>)}</div></div><div className="mt-6 flex gap-3"><button onClick={() => void saveCategory()} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold">Guardar categoría</button>{editingCategory && <button onClick={resetCategory} className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold">Cancelar</button>}</div></div><div className="space-y-3">{categories.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black uppercase">{item.name}</h3><p className="mt-1 text-xs text-gray-500">{item.description || "Sin descripción"}</p><p className="mt-2 text-xs text-gray-500">{item.specificationFields?.length || 0} campos adicionales · {item.visible ? "Visible" : "Oculta"}</p></div><div className="flex gap-2"><button onClick={() => { setEditingCategory(item.id || null); setCategoryForm(withoutId(item)); }} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Editar</button><button onClick={async () => { if (item.id) await deleteTechnologyCategory(item.id); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">Eliminar</button></div></div></article>)}</div></section>}
  </div></main></AuthGuard>;
}

export default TechnologyManager;
