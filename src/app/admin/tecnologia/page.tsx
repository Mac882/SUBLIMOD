"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/admin/AuthGuard";
import { createTechnologyCategory, createTechnologyProduct, deleteTechnologyCategory, deleteTechnologyProduct, subscribeTechnologyCategories, subscribeTechnologyProducts, updateTechnologyCategory, updateTechnologyProduct } from "@/lib/technology/repository";
import { uploadTechnologyProductImages, removeTechnologyProductImage, MAX_TECHNOLOGY_IMAGES } from "@/lib/technology/imageStorage";
import type { TechnologyCategory, TechnologyFieldDefinition, TechnologyProduct } from "@/lib/technology/types";
import { emptyTechnologyProduct } from "@/lib/technology/types";

const slugify = (value: string) => value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const emptyCategory: Omit<TechnologyCategory, "id"> = { name: "", slug: "", description: "", visible: true, order: 0, specificationFields: [] };
const conditionOptions: TechnologyProduct["condition"][] = ["Nuevo", "Usado - Excelente", "Usado - Bueno"];

type PendingImage = { file: File; preview: string };
function withoutId<T extends { id?: string }>(value: T): Omit<T, "id"> { const { id: _id, ...rest } = value; return rest; }

function TechnologyManager() {
  const [categories, setCategories] = useState<TechnologyCategory[]>([]);
  const [products, setProducts] = useState<TechnologyProduct[]>([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState<TechnologyProduct>(emptyTechnologyProduct);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"categories" | "products">("categories");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeTechnologyCategories(setCategories), []);
  useEffect(() => subscribeTechnologyProducts(setProducts), []);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const clearPendingImages = () => { pendingImages.forEach((item) => URL.revokeObjectURL(item.preview)); setPendingImages([]); };
  const resetCategory = () => { setCategoryForm(emptyCategory); setEditingCategory(null); };
  const resetProduct = () => { clearPendingImages(); setProductForm(emptyTechnologyProduct); setEditingProduct(null); };

  const selectImages = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const remaining = MAX_TECHNOLOGY_IMAGES - productForm.images.length - pendingImages.length;
    if (remaining <= 0) { setError("Un producto puede tener como máximo 5 imágenes."); return; }
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, remaining);
    setPendingImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    if (selected.length < files.length) setError("Solo se pueden guardar 5 imágenes por producto.");
  };

  const removeExisting = async (url: string) => {
    setError("");
    await removeTechnologyProductImage(url);
    setProductForm((current) => {
      const images = current.images.filter((image) => image !== url);
      return { ...current, images, coverImage: current.coverImage === url ? (images[0] || "") : current.coverImage };
    });
  };
  const removePending = (index: number) => setPendingImages((current) => { const item = current[index]; if (item) URL.revokeObjectURL(item.preview); return current.filter((_, i) => i !== index); });
  const makePrimary = (index: number) => setProductForm((current) => { const images = [...current.images]; const primary = images.splice(index, 1)[0]; return primary ? { ...current, images: [primary, ...images], coverImage: primary } : current; });

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
    setSaving(true);
    try {
      const base = { ...productForm, name: productForm.name.trim(), brand: productForm.brand.trim(), model: productForm.model.trim(), sku: productForm.sku.trim(), coverImage: productForm.coverImage || productForm.images[0] || "" };
      let id = editingProduct;
      if (id) await updateTechnologyProduct(id, base);
      else id = (await createTechnologyProduct(base)).id;
      if (id && pendingImages.length) {
        const uploaded = await uploadTechnologyProductImages(id, pendingImages.map((item) => item.file));
        const images = [...base.images, ...uploaded].slice(0, MAX_TECHNOLOGY_IMAGES);
        await updateTechnologyProduct(id, { images, coverImage: images[0] || "" });
      }
      resetProduct();
    } catch (e) { console.error(e); setError("No se pudo guardar el producto o sus imágenes."); }
    finally { setSaving(false); }
  };

  const toggleAvailability = async (product: TechnologyProduct) => { if (!product.id) return; try { await updateTechnologyProduct(product.id, { available: product.available === false }); } catch (e) { console.error(e); setError("No se pudo cambiar la disponibilidad."); } };
  const addField = () => setCategoryForm((current) => ({ ...current, specificationFields: [...current.specificationFields, { id: `field_${Date.now()}`, label: "", type: "text", options: [], required: false, order: current.specificationFields.length }] }));
  const updateField = (id: string, patch: Partial<TechnologyFieldDefinition>) => setCategoryForm((current) => ({ ...current, specificationFields: current.specificationFields.map((field) => field.id === id ? { ...field, ...patch } : field) }));
  const removeField = (id: string) => setCategoryForm((current) => ({ ...current, specificationFields: current.specificationFields.filter((field) => field.id !== id) }));

  return <main className="min-h-screen bg-[#111] p-5 text-white md:p-10"><div className="mx-auto max-w-7xl">
    <header className="mb-8"><Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white">← Volver al administrador</Link><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">SubliMod / Admin</p><h1 className="mt-2 text-3xl font-black uppercase">Tecnología</h1><p className="mt-2 max-w-3xl text-sm text-gray-400">Módulo independiente. Las categorías definen sus propios campos y los productos almacenan sus valores.</p></header>
    {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
    <div className="mb-8 flex gap-2 border-b border-white/10"><button onClick={() => setActiveSection("categories")} className={`px-5 py-3 text-sm font-bold ${activeSection === "categories" ? "border-b-2 border-primary text-white" : "text-gray-500"}`}>Categorías</button><button onClick={() => setActiveSection("products")} className={`px-5 py-3 text-sm font-bold ${activeSection === "products" ? "border-b-2 border-primary text-white" : "text-gray-500"}`}>Productos</button></div>

    {activeSection === "categories" && <section className="grid gap-8 lg:grid-cols-[1fr_1.3fr]"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-lg font-black uppercase">{editingCategory ? "Editar categoría" : "Nueva categoría"}</h2><label className="mt-5 block text-xs font-bold uppercase text-gray-500">Nombre<input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" placeholder="Ej. Laptops" /></label><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción<textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={categoryForm.visible} onChange={(e) => setCategoryForm({ ...categoryForm, visible: e.target.checked })} />Visible para clientes</label><div className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase">Campos de especificaciones</h3><button onClick={addField} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold">+ Campo</button></div><div className="mt-4 space-y-3">{categoryForm.specificationFields.map((field) => <div key={field.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="rounded-lg bg-white/5 p-2 text-sm" placeholder="Nombre del campo" /><select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as TechnologyFieldDefinition["type"] })} className="rounded-lg bg-white/5 p-2 text-sm"><option value="text">Texto</option><option value="number">Número</option><option value="select">Selección</option><option value="boolean">Sí / No</option></select></div>{field.type === "select" && <input value={(field.options || []).join(", ")} onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="mt-2 w-full rounded-lg bg-white/5 p-2 text-sm" placeholder="Opciones separadas por comas" />}<div className="mt-2 flex justify-between"><label className="text-xs text-gray-400"><input type="checkbox" checked={Boolean(field.required)} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="mr-2" />Obligatorio</label><button onClick={() => removeField(field.id)} className="text-xs font-bold text-red-400">Eliminar</button></div></div>)}</div></div><div className="mt-6 flex gap-3"><button onClick={saveCategory} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold">Guardar categoría</button>{editingCategory && <button onClick={resetCategory} className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold">Cancelar</button>}</div></div><div className="space-y-3">{categories.map((category) => <article key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black uppercase">{category.name}</h3><p className="mt-1 text-xs text-gray-500">{category.description || "Sin descripción"}</p><p className="mt-2 text-xs text-gray-500">{category.specificationFields?.length || 0} campos · {category.visible ? "Visible" : "Oculta"}</p></div><div className="flex gap-2"><button onClick={() => { setEditingCategory(category.id || null); setCategoryForm(withoutId(category)); }} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Editar</button><button onClick={async () => { if (category.id) await deleteTechnologyCategory(category.id); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">Eliminar</button></div></div></article>)}</div></section>}

    {activeSection === "products" && <section className="grid gap-8 lg:grid-cols-[1fr_1.3fr]"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-lg font-black uppercase">{editingProduct ? "Editar producto" : "Nuevo producto"}</h2><label className="mt-5 block text-xs font-bold uppercase text-gray-500">Categoría<select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value, specifications: {} })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Nombre<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Marca<input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Modelo<input value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">SKU<input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Precio<input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-bold uppercase text-gray-500">Moneda<select value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value as TechnologyProduct["currency"] })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="USD">USD</option><option value="NIO">NIO</option></select></label><label className="block text-xs font-bold uppercase text-gray-500 sm:col-span-2">Estado del equipo<select value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value as TechnologyProduct["condition"] })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white">{conditionOptions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></label></div>

    {categoryMap.get(productForm.categoryId)?.specificationFields?.map((field) => <label key={field.id} className="mt-4 block text-xs font-bold uppercase text-gray-500">{field.label}{field.required ? " *" : ""}{field.type === "select" ? <select value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: e.target.value } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "boolean" ? <select value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: e.target.value === "true" } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white"><option value="">Seleccionar</option><option value="true">Sí</option><option value="false">No</option></select> : <input type={field.type === "number" ? "number" : "text"} value={String(productForm.specifications[field.id] ?? "")} onChange={(e) => setProductForm({ ...productForm, specifications: { ...productForm.specifications, [field.id]: field.type === "number" ? Number(e.target.value) : e.target.value } })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" />}</label>)}

    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-sm font-black uppercase text-primary">Galería del producto</h3><p className="mt-1 text-xs text-gray-500">1 a 5 imágenes. La primera es la principal. Se comprimen antes de subirlas para reducir peso y mantener calidad.</p></div><label className="cursor-pointer rounded-xl bg-primary px-4 py-3 text-xs font-bold">Agregar imágenes<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { selectImages(e.target.files); e.currentTarget.value = ""; }} /></label></div>{(productForm.images.length + pendingImages.length) > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{productForm.images.map((image, index) => <div key={image} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"><img src={image} alt={`Imagen ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex gap-1"><button type="button" onClick={() => makePrimary(index)} className="flex-1 rounded-md bg-black/75 px-1 py-1 text-[10px] font-bold">{index === 0 ? "Principal" : "Hacer principal"}</button><button type="button" onClick={() => removeExisting(image)} className="rounded-md bg-red-500/80 px-2 py-1 text-[10px] font-bold">×</button></div></div>)}{pendingImages.map((image, index) => <div key={image.preview} className="relative overflow-hidden rounded-xl border border-primary/40 bg-black/30"><img src={image.preview} alt={`Nueva imagen ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex gap-1"><span className="flex-1 rounded-md bg-black/75 px-1 py-1 text-center text-[10px] font-bold">Pendiente</span><button type="button" onClick={() => removePending(index)} className="rounded-md bg-red-500/80 px-2 py-1 text-[10px] font-bold">×</button></div></div>)}</div>}</div>

    <label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción corta<input value={productForm.shortDescription} onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 block text-xs font-bold uppercase text-gray-500">Descripción<textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={productForm.available} onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })} />Disponible</label><div className="mt-6 flex gap-3"><button disabled={saving} onClick={saveProduct} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold disabled:opacity-50">{saving ? "Guardando..." : "Guardar producto"}</button>{editingProduct && <button onClick={resetProduct} className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold">Cancelar</button>}</div></div>

    <div className="space-y-3">{products.map((product) => { const available = product.available !== false; return <article key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="h-16 w-16 overflow-hidden rounded-xl bg-black/30">{(product.coverImage || product.images?.[0]) && <img src={product.coverImage || product.images[0]} alt={product.name} className="h-full w-full object-cover" />}</div><div><h3 className="font-black uppercase">{product.name}</h3><p className="mt-1 text-xs text-gray-500">{product.brand} · {product.model}</p><p className="mt-2 text-sm font-bold text-amber-300">{product.currency === "USD" ? "$" : "C$"}{Number(product.price).toLocaleString()}</p><p className="mt-1 text-xs font-bold text-gray-400">Estado: {product.condition}</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${available ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{available ? "Disponible" : "No disponible"}</span></div></div><div className="flex flex-wrap gap-2"><button onClick={() => toggleAvailability(product)} className={`rounded-lg px-3 py-2 text-xs font-bold ${available ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{available ? "Marcar no disponible" : "Marcar disponible"}</button><button onClick={() => { clearPendingImages(); setEditingProduct(product.id || null); setProductForm(product); }} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Editar</button><button onClick={async () => { if (product.id) await deleteTechnologyProduct(product.id); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">Eliminar</button></div></div></article>; })}{products.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-gray-500">No hay productos. Crea el primero.</p>}</div>
    </section>}
  </div></main>;
}

export default function TecnologiaAdminPage() { return <AuthGuard><TechnologyManager /></AuthGuard>; }
