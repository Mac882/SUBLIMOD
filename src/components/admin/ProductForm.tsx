"use client";
import React, { useEffect, useMemo, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, onSnapshot } from "firebase/firestore";
import { X, Plus, Trash2, Check, Hash, Type, Info, Layers, Upload, Image as ImageIcon, Tag, PlusCircle, AlertCircle, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";
import { ProductVariantCombination, ProductVariantGroup, ProductVariantOption, ProductVariantsConfig, getVariantCombinationKey } from "@/types/productVariants";
interface ColorVariant { name: string; hex: string; }
interface PriceScale { min: number; max: number; price: number; }
interface CategoryOption { id: string; nombre: string; }
interface ProductFormProps { onClose: () => void; productToEdit?: any; availableCategories?: string[] | CategoryOption[]; globalAttributes: any[]; }
const ProductForm = ({ onClose, productToEdit, globalAttributes }: ProductFormProps) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]), [isUploading, setIsUploading] = useState(false), [isCompressing, setIsCompressing] = useState(false);
  const [categoryId, setCategoryId] = useState(""), [category, setCategory] = useState(""), [productName, setProductName] = useState(""), [description, setDescription] = useState("");
  const [images, setImages] = useState<{url: string; file?: File}[]>([]), [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [colors, setColors] = useState<ColorVariant[]>([]), [priceMatrix, setPriceMatrix] = useState<PriceScale[]>([{ min: 1, max: 12, price: 0 }]);
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variantGroups, setVariantGroups] = useState<ProductVariantGroup[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<ProductVariantCombination[]>([]);
  const [variantOptionFiles, setVariantOptionFiles] = useState<Record<string, File>>({});
  const [showInSituCat, setShowInSituCat] = useState(false), [newCatName, setNewCatName] = useState(""), [showInSituAttr, setShowInSituAttr] = useState(false), [newAttrName, setNewAttrName] = useState("");

  useEffect(() => onSnapshot(collection(db, "categorias"), snap => setCategories(snap.docs.map(d => ({ id: d.id, nombre: (d.data() as any).nombre })) )), []);

  const relevantAttributes = useMemo(() => globalAttributes.filter(a => a.categoriaId ? a.categoriaId === categoryId : a.categoriaAsociada === category), [globalAttributes, categoryId, category]);

  // Inicializar un formulario NUEVO solamente cuando cambia entre nuevo/edición.
  // No depender de categories/globalAttributes evita que crear un atributo borre
  // nombre, categoría, descripción, imágenes, colores y precios ya introducidos.
  useEffect(() => {
    if (productToEdit) return;
    setProductName("");
    setCategory("");
    setCategoryId("");
    setDescription("");
    setImages([]);
    setSelectedOptions({});
    setColors([]);
    setVariantsEnabled(false);
    setVariantGroups([]);
    setVariantCombinations([]);
    setVariantOptionFiles({});
    setPriceMatrix([{ min: 1, max: 12, price: 0 }]);
  }, [productToEdit]);

  // Cargar datos de edición. Este efecto sí puede reaccionar a la llegada de
  // categorías/atributos porque no modifica el estado de un producto nuevo.
  useEffect(() => {
    if (!productToEdit) return;
    setProductName(productToEdit.nombre || "");
    setDescription(productToEdit.descripcion || "");
    const foundCategory = categories.find(c => c.id === productToEdit.categoriaId || c.nombre === productToEdit.categoria);
    setCategoryId(foundCategory?.id || productToEdit.categoriaId || "");
    setCategory(foundCategory?.nombre || productToEdit.categoria || "");
    setColors(productToEdit.colores || []);
    setVariantsEnabled(Boolean(productToEdit.variantes?.habilitado));
    setVariantGroups(Array.isArray(productToEdit.variantes?.grupos) ? productToEdit.variantes.grupos : []);
    setVariantCombinations(Array.isArray(productToEdit.variantes?.combinaciones) ? productToEdit.variantes.combinaciones : []);
    setVariantOptionFiles({});
    setPriceMatrix(productToEdit.escalasPrecios || [{ min: 1, max: 12, price: 0 }]);
    const selected: Record<string, string[]> = {};
    if (Array.isArray(productToEdit.atributos)) productToEdit.atributos.forEach((a: any) => { if (a.atributoId) selected[a.atributoId] = a.valores || []; });
    else Object.entries(productToEdit.atributos || {}).forEach(([key, vals]: any) => { const attr = globalAttributes.find(a => a.id === key || a.nombreAtributo === key); if (attr) selected[attr.id] = Array.isArray(vals) ? vals : [vals]; });
    setSelectedOptions(selected);
    setImages(productToEdit.imagenes?.length ? productToEdit.imagenes.map((url: string) => ({ url })) : (productToEdit.imagenUrl ? [{ url: productToEdit.imagenUrl }] : []));
  }, [productToEdit, categories, globalAttributes]);

  const selectCategory = (value: string) => { const cat = categories.find(c => c.id === value); setCategoryId(value); setCategory(cat?.nombre || ""); setSelectedOptions({}); };
  const toggleOption = (attrId: string, value: string) => setSelectedOptions(prev => { const current = prev[attrId] || []; return { ...prev, [attrId]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }; });
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files) return; setIsCompressing(true); try { const optimized = await Promise.all(Array.from(e.target.files).map(async file => { const compressed = await compressImage(file); return { url: URL.createObjectURL(compressed), file: compressed as File }; })); setImages(prev => [...prev, ...optimized]); } catch (e) { console.error(e); } finally { setIsCompressing(false); } };
  const handleCreateCategoryInSitu = async () => { const clean = newCatName.trim(); if (!clean) return; try { const newRef = await addDoc(collection(db, "categorias"), { nombre: clean, createdAt: serverTimestamp() }); await updateDoc(newRef, { id: newRef.id }); setCategoryId(newRef.id); setCategory(clean); setNewCatName(""); setShowInSituCat(false); } catch (e) { console.error(e); alert("No se pudo crear la categoría."); } };
  const handleCreateAttrInSitu = async () => { const clean = newAttrName.trim(); if (!clean || !categoryId) return; try { await addDoc(collection(db, "atributos_globales"), { nombreAtributo: clean, categoriaId: categoryId, categoriaAsociada: category, opciones: [], createdAt: serverTimestamp() }); setNewAttrName(""); setShowInSituAttr(false); } catch (e) { console.error(e); alert("No se pudo crear el atributo."); } };
  const addNewOption = async (attr: any, value: string) => { const clean = value.trim(); if (!clean) return; toggleOption(attr.id, clean); try { await updateDoc(doc(db, "atributos_globales", attr.id), { opciones: arrayUnion(clean) }); } catch (e) { console.error(e); } };
  const addVariantPreset = (nombre: string, opciones: string[], tipo: "select" | "color" = "select") => {
    const id = "grupo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    setVariantGroups(prev => [...prev, {
      id,
      nombre,
      tipo,
      requerido: true,
      opciones: opciones.map((nombreOpcion, index) => ({
        id: "opcion_" + Date.now() + "_" + index + "_" + Math.random().toString(36).slice(2, 6),
        nombre: nombreOpcion,
        ...(tipo === "color" ? { hex: "#2E8982" } : {}),
      })),
    }]);
    setVariantsEnabled(true);
  };

  const addVariantGroup = () => {
    const id = `grupo_${Date.now()}`;
    setVariantGroups(prev => [...prev, { id, nombre: "Nueva característica", tipo: "select", requerido: true, opciones: [] }]);
    setVariantsEnabled(true);
  };
  const updateVariantGroup = (groupId: string, patch: Partial<ProductVariantGroup>) =>
    setVariantGroups(prev => prev.map(group => group.id === groupId ? { ...group, ...patch } : group));
  const toggleVariantOptionParent = (groupId: string, optionId: string, parentOptionId: string) => {
    setVariantGroups(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        opciones: group.opciones.map(option => {
          if (option.id !== optionId) return option;
          const current = option.disponiblePara || [];
          const disponiblePara = current.includes(parentOptionId)
            ? current.filter(id => id !== parentOptionId)
            : [...current, parentOptionId];
          return { ...option, disponiblePara };
        }),
      };
    }));
  };
  const removeVariantGroup = (groupId: string) => {
    setVariantGroups(prev => prev.filter(group => group.id !== groupId));
    setVariantCombinations(prev => prev.filter(combo => !Object.prototype.hasOwnProperty.call(combo.opciones, groupId)));
  };
  const addVariantOption = (groupId: string) => {
    const option: ProductVariantOption = { id: `opcion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, nombre: "Nueva opción" };
    setVariantGroups(prev => prev.map(group => group.id === groupId ? { ...group, opciones: [...group.opciones, option] } : group));
  };
  const updateVariantOption = (groupId: string, optionId: string, patch: Partial<ProductVariantOption>) =>
    setVariantGroups(prev => prev.map(group => group.id === groupId ? { ...group, opciones: group.opciones.map(option => option.id === optionId ? { ...option, ...patch } : option) } : group));
  const handleVariantOptionImage = async (groupId: string, optionId: string, file?: File) => {
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setVariantOptionFiles(prev => ({ ...prev, [optionId]: compressed as File }));
      updateVariantOption(groupId, optionId, { imagenUrl: URL.createObjectURL(compressed) });
    } catch (e) {
      console.error(e);
      alert("No se pudo preparar la imagen de la variante.");
    } finally {
      setIsCompressing(false);
    }
  };
  const removeVariantOption = (groupId: string, optionId: string) => {
    setVariantGroups(prev => prev.map(group => group.id === groupId ? { ...group, opciones: group.opciones.filter(option => option.id !== optionId) } : group));
    setVariantCombinations(prev => prev.filter(combo => combo.opciones[groupId] !== optionId));
    setVariantOptionFiles(prev => { const next = { ...prev }; delete next[optionId]; return next; });
  };
  const generateVariantCombinations = () => {
    const validGroups = variantGroups.filter(group => group.opciones.length > 0 && group.opciones.some(option => option.nombre.trim()));
    if (!validGroups.length || validGroups.length !== variantGroups.length) {
      return alert("Cada característica de variante debe tener al menos una opción válida.");
    }

    const orderedGroups: ProductVariantGroup[] = [];
    const pending = [...validGroups];
    while (pending.length) {
      const nextIndex = pending.findIndex(group => !group.dependeDe || orderedGroups.some(parent => parent.id === group.dependeDe));
      if (nextIndex === -1) {
        return alert("Hay una dependencia de variantes que no puede resolverse. Revisa el grupo padre de cada característica.");
      }
      orderedGroups.push(pending.splice(nextIndex, 1)[0]);
    }

    const combinations: Record<string, string>[] = [];
    const build = (index: number, selected: Record<string, string>) => {
      if (index >= orderedGroups.length) {
        combinations.push(selected);
        return;
      }
      const group = orderedGroups[index];
      const parentValue = group.dependeDe ? selected[group.dependeDe] : undefined;
      const options = group.opciones.filter(option => {
        if (!option.nombre.trim()) return false;
        if (!group.dependeDe) return true;
        return !option.disponiblePara?.length || Boolean(parentValue && option.disponiblePara.includes(parentValue));
      });
      options.forEach(option => build(index + 1, { ...selected, [group.id]: option.id }));
    };
    build(0, {});

    if (!combinations.length) {
      return alert("No hay combinaciones válidas. Revisa las disponibilidades de las opciones dependientes.");
    }

    const existingByKey = new Map(variantCombinations.map(combo => [getVariantCombinationKey(combo.opciones), combo]));
    const next = combinations.map(options => {
      const existing = existingByKey.get(getVariantCombinationKey(options));
      const names = validGroups.map(group => group.opciones.find(option => option.id === options[group.id])?.nombre || "").filter(Boolean);
      return existing || {
        id: `combinacion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        opciones,
        nombre: names.join(" / "),
        activo: true,
        precio: null,
      };
    });
    setVariantCombinations(next);
  };
  const updateVariantCombination = (id: string, patch: Partial<ProductVariantCombination>) =>
    setVariantCombinations(prev => prev.map(combo => combo.id === id ? { ...combo, ...patch } : combo));

  const handleSubmit = async () => {
    if (!productName.trim() || !categoryId || images.length === 0) return alert("Faltan datos obligatorios (Nombre, Categoría e Imagen).");
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const img of images) { if (img.file) { const storageRef = ref(storage, `productos/${Date.now()}_${img.file.name}`); uploadedUrls.push(await getDownloadURL((await uploadBytes(storageRef, img.file)).ref)); } else uploadedUrls.push(img.url); }
      const atributos = Object.entries(selectedOptions).filter(([, vals]) => vals.length).map(([atributoId, valores]) => ({ atributoId, valores }));
      const preparedGroups = await Promise.all(variantGroups.map(async group => ({
        ...group,
        nombre: group.nombre.trim(),
        opciones: await Promise.all(group.opciones.map(async option => {
          const file = variantOptionFiles[option.id];
          if (!file) return { ...option, nombre: option.nombre.trim() };
          const storageRef = ref(storage, "productos/variantes/" + Date.now() + "_" + file.name);
          const upload = await uploadBytes(storageRef, file);
          const imagenUrl = await getDownloadURL(upload.ref);
          return { ...option, nombre: option.nombre.trim(), imagenUrl };
        })),
      })));
      const variantes: ProductVariantsConfig = {
        habilitado: variantsEnabled && preparedGroups.length > 0 && variantCombinations.length > 0,
        grupos: preparedGroups,
        combinaciones: variantCombinations,
      };
      const data = { nombre: productName.trim(), descripcion: description.trim(), categoriaId: categoryId, categoria: category, imagenUrl: uploadedUrls[0], imagenes: uploadedUrls, atributos, colores: colors, variantes, escalasPrecios: priceMatrix, updatedAt: serverTimestamp() };
      if (productToEdit) await updateDoc(doc(db, "productos", productToEdit.id), data); else await addDoc(collection(db, "productos"), { ...data, createdAt: serverTimestamp(), activo: true });
      onClose();
    } catch (e) { console.error(e); alert("Error al guardar el producto."); } finally { setIsUploading(false); }
  };
  return <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"><div className="bg-[#1A1A1A] w-full max-w-5xl my-auto rounded-[2.5rem] border border-white/10 relative shadow-2xl">
    {showInSituCat && <div className="absolute inset-0 bg-black/70 z-[60] flex items-center justify-center rounded-[2.5rem] p-6"><div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] space-y-6 text-center"><Layers className="mx-auto text-primary"/><h3 className="text-xl font-bold uppercase text-white">Nueva Categoría</h3><input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej: Llaveros" className="w-full bg-black/40 rounded-xl p-4 text-white text-center"/><div className="flex gap-4"><button onClick={() => setShowInSituCat(false)} className="flex-1 py-4 text-gray-500">Cancelar</button><button onClick={handleCreateCategoryInSitu} className="flex-1 bg-primary py-4 rounded-xl text-white">Crear</button></div></div></div>}
    {showInSituAttr && <div className="absolute inset-0 bg-black/70 z-[60] flex items-center justify-center rounded-[2.5rem] p-6"><div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] space-y-6 text-center"><Tag className="mx-auto text-accent"/><h3 className="text-xl font-bold uppercase text-white">Nuevo Grupo</h3><p className="text-xs text-gray-500 uppercase">Categoría: {category}</p><input value={newAttrName} onChange={e => setNewAttrName(e.target.value)} placeholder="Ej: Material" className="w-full bg-black/40 rounded-xl p-4 text-white text-center"/><div className="flex gap-4"><button onClick={() => setShowInSituAttr(false)} className="flex-1 py-4 text-gray-500">Cancelar</button><button onClick={handleCreateAttrInSitu} className="flex-1 bg-accent py-4 rounded-xl text-black font-bold">Vincular</button></div></div></div>}
    <div className="p-8 border-b border-white/5 flex justify-between items-center"><div className="flex items-center gap-4"><PlusCircle className="text-primary"/><div><h2 className="text-2xl font-black text-white uppercase">{productToEdit ? "Editar Producto" : "Nuevo Producto"}</h2><p className="text-gray-500 text-sm">Relaciones por ID de categoría y atributo.</p></div></div><button onClick={onClose} className="p-3 text-gray-400"><X size={28}/></button></div>
    <div className="p-8 space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="md:col-span-2 space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Type size={14}/> Nombre</label><input value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white outline-none" placeholder="Ej: Llavero Corazón"/></div><div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Layers size={14}/> Categoría</label><div className="flex gap-2"><select value={categoryId} onChange={e => selectCategory(e.target.value)} style={{ colorScheme: "dark" }} className="flex-grow bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 text-white [&>option]:bg-[#1A1A1A] [&>option]:text-white"><option value="">Elegir...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><button onClick={() => setShowInSituCat(true)} className="bg-primary/10 text-primary p-4 rounded-2xl"><Plus size={20}/></button></div></div><div className="md:col-span-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Info size={14}/> Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white h-24"/></div></section>
      <section className="space-y-4"><div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ImageIcon size={14}/> Galería {isCompressing && <Loader2 size={13} className="animate-spin text-primary"/>}</label><label className="cursor-pointer bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase">+ Añadir Fotos<input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/></label></div>{images.length === 0 ? <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer"><Upload className="text-gray-600 mb-3"/><span className="text-[10px] font-black text-gray-400 uppercase">Cargar imágenes</span><input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/></label> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#121212] p-4 rounded-[2rem]">{images.map((img, i) => <div key={i} className="relative aspect-square"><img src={img.url} className="w-full h-full object-cover rounded-2xl" alt=""/><button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-xl"><Trash2 size={15}/></button>{i === 0 && <span className="absolute bottom-2 left-2 bg-primary text-white text-[9px] px-2 py-1 rounded">Principal</span>}</div>)}</div>}</section>
      <section className="border-t border-white/5 pt-10 space-y-8"><div className="flex justify-between items-center"><span className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Tag size={16}/> Atributos del Producto</span><button onClick={() => categoryId ? setShowInSituAttr(true) : alert("Selecciona una categoría primero")} className="text-[10px] font-black text-accent uppercase">+ Crear Grupo</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{relevantAttributes.map(attr => <AttributeField key={attr.id} attr={attr} selected={selectedOptions[attr.id] || []} onToggle={(v: string) => toggleOption(attr.id, v)} onAdd={(v: string) => addNewOption(attr, v)}/>) }{categoryId && relevantAttributes.length === 0 && <div className="text-gray-600 bg-white/5 p-6 rounded-2xl text-[10px] font-bold uppercase flex gap-3"><AlertCircle size={18}/> Esta categoría aún no tiene grupos de atributos.</div>}</div></section>
      <section className="pt-10 border-t border-white/5 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><label className="text-[10px] font-black text-gray-500 uppercase">Variantes del producto</label><p className="text-[10px] text-gray-600 mt-1">Características que el cliente puede elegir. Sirve para tazas, camisetas y futuros productos.</p></div>
          <button type="button" onClick={() => setVariantsEnabled(prev => !prev)} className={"px-4 py-2 rounded-xl text-[10px] font-black uppercase " + (variantsEnabled ? "bg-primary text-white" : "bg-white/5 text-gray-500")}>{variantsEnabled ? "Variantes activas" : "Activar variantes"}</button>
        </div>
        {variantsEnabled && <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
            <div><p className="text-xs font-black uppercase text-white">Añadir característica</p><p className="text-[10px] text-gray-500 mt-1">Puedes usar una plantilla o crear una característica personalizada.</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addVariantPreset("Color", ["Rojo", "Azul", "Verde"], "color")} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-[10px] font-black uppercase">+ Color</button>
              <button type="button" onClick={() => addVariantPreset("Talla", ["16", "18", "S", "M", "L", "XL", "WXL"])} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-[10px] font-black uppercase">+ Talla</button>
              <button type="button" onClick={() => addVariantPreset("Cuello", ["Redondo", "V"])} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-[10px] font-black uppercase">+ Cuello</button>
              <button type="button" onClick={() => addVariantPreset("Asa", ["Azul", "Rojo", "Celeste"], "color")} className="px-3 py-2 rounded-xl bg-white/10 text-gray-200 text-[10px] font-black uppercase">+ Asa</button>
              <button type="button" onClick={addVariantGroup} className="px-3 py-2 rounded-xl bg-accent text-black text-[10px] font-black uppercase">+ Personalizada</button>
            </div>
          </div>
          {variantGroups.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><p className="text-xs font-bold text-gray-400">Todavía no has agregado características.</p><p className="text-[10px] text-gray-600 mt-1">Ejemplo: Color + Talla + Cuello para una camiseta.</p></div>}
          {variantGroups.map(group => {
            const parentGroup = group.dependeDe ? variantGroups.find(parent => parent.id === group.dependeDe) : null;
            return <div key={group.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <input value={group.nombre} onChange={e => updateVariantGroup(group.id, { nombre: e.target.value })} className="flex-grow bg-black/30 p-3 rounded-xl text-white" placeholder="Color, Talla, Asa, Cuello..." />
                <select value={group.tipo || "select"} onChange={e => updateVariantGroup(group.id, { tipo: e.target.value as "select" | "color" })} className="bg-black/30 p-3 rounded-xl text-white" style={{ colorScheme: "dark" }}><option value="select">Opciones</option><option value="color">Color</option></select>
                <select value={group.dependeDe || ""} onChange={e => updateVariantGroup(group.id, { dependeDe: e.target.value || undefined })} className="bg-black/30 p-3 rounded-xl text-white text-sm" style={{ colorScheme: "dark" }}>
                  <option value="">Independiente</option>
                  {variantGroups.filter(parent => parent.id !== group.id).map(parent => <option key={parent.id} value={parent.id}>Depende de: {parent.nombre || "Sin nombre"}</option>)}
                </select>
                <label className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-500"><input type="checkbox" checked={group.requerido !== false} onChange={e => updateVariantGroup(group.id, { requerido: e.target.checked })} /> Requerida</label>
                <button type="button" onClick={() => removeVariantGroup(group.id)} className="text-red-500 p-2"><Trash2 size={18}/></button>
              </div>
              {parentGroup && <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                <p className="text-[9px] font-black uppercase text-accent mb-2">Disponibilidad según {parentGroup.nombre}</p>
                <p className="text-[9px] text-gray-500 mb-3">Marca en cada opción de {group.nombre} para qué opciones del grupo padre estará disponible.</p>
              </div>}
              <div className="space-y-2">
                {group.opciones.map(option => <div key={option.id} className="bg-black/20 p-3 rounded-xl space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    {group.tipo === "color" && <input type="color" value={option.hex || "#2E8982"} onChange={e => updateVariantOption(group.id, option.id, { hex: e.target.value })} className="w-9 h-9 bg-transparent" />}
                    <label className="cursor-pointer bg-white/5 px-3 py-2 rounded-lg text-[9px] font-black text-gray-400 uppercase">{option.imagenUrl ? "Cambiar imagen" : "Imagen"}<input type="file" accept="image/*" className="hidden" onChange={e => handleVariantOptionImage(group.id, option.id, e.target.files?.[0])} /></label>
                    {option.imagenUrl && <img src={option.imagenUrl} alt="" className="w-9 h-9 object-cover rounded-lg border border-white/10" />}
                    <input value={option.nombre} onChange={e => updateVariantOption(group.id, option.id, { nombre: e.target.value })} className="flex-1 min-w-[140px] bg-black/30 p-2.5 rounded-lg text-white text-sm" placeholder="Nombre de opción" />
                    <button type="button" onClick={() => removeVariantOption(group.id, option.id)} className="text-red-500 p-2"><X size={15}/></button>
                  </div>
                  {parentGroup && <div className="pl-2">
                    <p className="text-[9px] font-black uppercase text-gray-500 mb-2">Disponible para:</p>
                    <div className="flex flex-wrap gap-2">
                      {parentGroup.opciones.map(parentOption => {
                        const checked = !option.disponiblePara?.length || option.disponiblePara.includes(parentOption.id);
                        return <label key={parentOption.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-[9px] text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => {
                            const current = option.disponiblePara || parentGroup.opciones.map(item => item.id);
                            const next = current.includes(parentOption.id) ? current.filter(id => id !== parentOption.id) : [...current, parentOption.id];
                            updateVariantOption(group.id, option.id, { disponiblePara: next });
                          }} />
                          {parentOption.nombre}
                        </label>;
                      })}
                    </div>
                  </div>}
                </div>)}
                <button type="button" onClick={() => addVariantOption(group.id)} className="text-[10px] font-black text-accent uppercase">+ Añadir opción</button>
              </div>
            </div>;
          })}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addVariantGroup} className="px-4 py-3 rounded-xl bg-white/5 text-gray-300 text-[10px] font-black uppercase">+ Nueva característica</button>
            <button type="button" onClick={generateVariantCombinations} disabled={!variantGroups.length} className="px-4 py-3 rounded-xl bg-accent text-black text-[10px] font-black uppercase">Generar combinaciones</button>
          </div>
          {variantCombinations.length > 0 && <div className="space-y-3">
            <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-gray-500">Combinaciones válidas: {variantCombinations.length}</span></div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">{variantCombinations.map(combo => <div key={combo.id} className="flex flex-col md:flex-row md:items-center gap-3 bg-black/20 p-3 rounded-xl">
              <div className="flex-grow text-xs text-gray-300">{variantGroups.map(group => { const option = group.opciones.find(item => item.id === combo.opciones[group.id]); return option ? <span key={group.id} className="inline-block mr-2 mb-1 bg-white/5 px-2 py-1 rounded">{group.nombre}: {option.nombre}</span> : null; })}</div>
              <input type="number" value={combo.precio ?? ""} onChange={e => updateVariantCombination(combo.id, { precio: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Precio opcional" className="w-32 bg-black/30 p-2 rounded-lg text-accent text-xs" />
              <button type="button" onClick={() => updateVariantCombination(combo.id, { activo: !combo.activo })} className={"px-3 py-2 rounded-lg text-[9px] font-black uppercase " + (combo.activo === false ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary")}>{combo.activo === false ? "Inactiva" : "Activa"}</button>
            </div>)}</div>
          </div>}
        </div>}
      </section>

      <section className="pt-10 border-t border-white/5 space-y-4"><div className="flex justify-between"><label className="text-[10px] font-black text-gray-500 uppercase">Colores / Variantes heredados</label><button onClick={() => setColors([...colors, {name: "", hex: "#2E8982"}])} className="text-primary text-[10px] font-black">+ Añadir</button></div>{colors.map((c, i) => <div key={i} className="flex gap-3"><input type="color" value={c.hex} onChange={e => {const n=[...colors]; n[i].hex=e.target.value; setColors(n)}}/><input value={c.name} onChange={e => {const n=[...colors]; n[i].name=e.target.value; setColors(n)}} className="flex-grow bg-black/30 p-3 rounded-xl text-white" placeholder="Nombre"/><button onClick={() => setColors(colors.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={18}/></button></div>)}</section>
      <button onClick={handleSubmit} disabled={isUploading || isCompressing} className="w-full bg-primary text-white py-7 rounded-[2rem] font-black text-xl uppercase disabled:opacity-50">{isUploading ? "Sincronizando..." : productToEdit ? "Actualizar Producto" : "Publicar Producto"}</button>
    </div>
  </div></div>;
};
const AttributeField = ({ attr, selected, onToggle, onAdd }: any) => { const [newValue, setNewValue] = useState(""); const options = Array.from(new Set(attr.opciones || [])); const commit = () => { if (newValue.trim()) { onAdd(newValue.trim()); setNewValue(""); } }; return <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{attr.nombreAtributo}</label><div className="flex flex-wrap gap-2">{options.map((opt: any) => <button key={opt} type="button" onClick={() => onToggle(opt)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${selected.includes(opt) ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-gray-400"}`}>{selected.includes(opt) && <Check size={12} className="inline mr-2"/>}{opt}</button>)}<input value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === "Enter" && commit()} placeholder="Añadir opción" className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 text-xs text-white outline-none w-32"/></div></div>; };
export default ProductForm;
