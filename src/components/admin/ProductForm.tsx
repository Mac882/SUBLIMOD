"use client";
import React, { useEffect, useMemo, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { X, Plus, Trash2, Check, Hash, Type, Info, Layers, Upload, Image as ImageIcon, Tag, PlusCircle, AlertCircle, Edit, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";

interface ColorVariant { name: string; hex: string; }
interface PriceScale { min: number; max: number; price: number; }
interface CategoryOption { id: string; nombre: string; }
interface ProductFormProps { onClose: () => void; productToEdit?: any; availableCategories: string[] | CategoryOption[]; globalAttributes: any[]; }

const ProductForm = ({ onClose, productToEdit, availableCategories, globalAttributes }: ProductFormProps) => {
  const categories: CategoryOption[] = availableCategories.map((c: any) => typeof c === "string" ? ({ id: "", nombre: c }) : c);
  const [isUploading, setIsUploading] = useState(false), [isCompressing, setIsCompressing] = useState(false);
  const [categoryId, setCategoryId] = useState(""), [category, setCategory] = useState(""), [productName, setProductName] = useState(""), [description, setDescription] = useState("");
  const [images, setImages] = useState<{url: string; file?: File}[]>([]), [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [colors, setColors] = useState<ColorVariant[]>([]), [priceMatrix, setPriceMatrix] = useState<PriceScale[]>([{ min: 1, max: 12, price: 0 }]);
  const [showInSituCat, setShowInSituCat] = useState(false), [newCatName, setNewCatName] = useState(""), [showInSituAttr, setShowInSituAttr] = useState(false), [newAttrName, setNewAttrName] = useState("");

  const relevantAttributes = useMemo(() => globalAttributes.filter(a => a.categoriaId ? a.categoriaId === categoryId : a.categoriaAsociada === category), [globalAttributes, categoryId, category]);

  useEffect(() => {
    if (!productToEdit) { setProductName(""); setCategory(""); setCategoryId(""); setDescription(""); setImages([]); setSelectedOptions({}); setColors([]); setPriceMatrix([{ min: 1, max: 12, price: 0 }]); return; }
    setProductName(productToEdit.nombre || ""); setDescription(productToEdit.descripcion || "");
    const foundCategory = categories.find(c => c.id === productToEdit.categoriaId || c.nombre === productToEdit.categoria);
    setCategoryId(foundCategory?.id || productToEdit.categoriaId || ""); setCategory(foundCategory?.nombre || productToEdit.categoria || "");
    setColors(productToEdit.colores || []); setPriceMatrix(productToEdit.escalasPrecios || [{ min: 1, max: 12, price: 0 }]);
    let selected: Record<string, string[]> = {};
    if (Array.isArray(productToEdit.atributos)) productToEdit.atributos.forEach((a: any) => { if (a.atributoId) selected[a.atributoId] = a.valores || []; });
    else if (productToEdit.atributos && typeof productToEdit.atributos === "object") {
      Object.entries(productToEdit.atributos).forEach(([key, vals]: any) => { const attr = globalAttributes.find(a => a.id === key || a.nombreAtributo === key); if (attr) selected[attr.id] = Array.isArray(vals) ? vals : [vals]; });
    }
    setSelectedOptions(selected);
    const existing = productToEdit.imagenes?.length ? productToEdit.imagenes.map((url: string) => ({ url })) : (productToEdit.imagenUrl ? [{ url: productToEdit.imagenUrl }] : []); setImages(existing);
  }, [productToEdit]);

  const selectCategory = (value: string) => { const cat = categories.find(c => c.id === value); setCategoryId(value); setCategory(cat?.nombre || ""); setSelectedOptions({}); };
  const toggleOption = (attrId: string, value: string) => setSelectedOptions(prev => { const current = prev[attrId] || []; return { ...prev, [attrId]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] }; });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return; setIsCompressing(true);
    try { const optimized = await Promise.all(Array.from(e.target.files).map(async file => { const compressed = await compressImage(file); return { url: URL.createObjectURL(compressed), file: compressed as File }; })); setImages(prev => [...prev, ...optimized]); }
    catch (e) { console.error(e); } finally { setIsCompressing(false); }
  };

  const handleCreateCategoryInSitu = async () => {
    const clean = newCatName.trim(); if (!clean) return;
    try { const newRef = await addDoc(collection(db, "categorias"), { nombre: clean, createdAt: serverTimestamp() }); await updateDoc(newRef, { id: newRef.id }); setCategoryId(newRef.id); setCategory(clean); setNewCatName(""); setShowInSituCat(false); }
    catch (e) { console.error(e); alert("No se pudo crear la categoría."); }
  };

  const handleCreateAttrInSitu = async () => {
    const clean = newAttrName.trim(); if (!clean || !categoryId) return;
    try { await addDoc(collection(db, "atributos_globales"), { nombreAtributo: clean, categoriaId: categoryId, categoriaAsociada: category, opciones: [], createdAt: serverTimestamp() }); setNewAttrName(""); setShowInSituAttr(false); }
    catch (e) { console.error(e); alert("No se pudo crear el atributo."); }
  };

  const addNewOption = async (attr: any, value: string) => {
    const clean = value.trim(); if (!clean) return;
    toggleOption(attr.id, clean);
    try { await updateDoc(doc(db, "atributos_globales", attr.id), { opciones: arrayUnion(clean) }); } catch (e) { console.error(e); }
  };

  const handleSubmit = async () => {
    if (!productName.trim() || !categoryId || images.length === 0) return alert("Faltan datos obligatorios (Nombre, Categoría e Imagen).");
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const img of images) { if (img.file) { const storageRef = ref(storage, `productos/${Date.now()}_${img.file.name}`); uploadedUrls.push(await getDownloadURL((await uploadBytes(storageRef, img.file)).ref)); } else uploadedUrls.push(img.url); }
      const atributos = Object.entries(selectedOptions).filter(([, vals]) => vals.length).map(([atributoId, valores]) => ({ atributoId, valores }));
      const data = { nombre: productName.trim(), descripcion: description.trim(), categoriaId, categoria: category, imagenUrl: uploadedUrls[0], imagenes: uploadedUrls, atributos, colores: colors, escalasPrecios: priceMatrix, updatedAt: serverTimestamp() };
      if (productToEdit) await updateDoc(doc(db, "productos", productToEdit.id), data); else await addDoc(collection(db, "productos"), { ...data, createdAt: serverTimestamp(), activo: true });
      onClose();
    } catch (e) { console.error(e); alert("Error al guardar el producto."); } finally { setIsUploading(false); }
  };

  return <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"><div className="bg-[#1A1A1A] w-full max-w-5xl my-auto rounded-[2.5rem] border border-white/10 relative shadow-2xl">
    {showInSituCat && <div className="absolute inset-0 bg-black/70 z-[60] flex items-center justify-center rounded-[2.5rem] p-6"><div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] space-y-6 text-center"><Layers className="mx-auto text-primary"/><h3 className="text-xl font-bold uppercase text-white">Nueva Categoría</h3><input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej: Llaveros" className="w-full bg-black/40 rounded-xl p-4 text-white text-center"/><div className="flex gap-4"><button onClick={() => setShowInSituCat(false)} className="flex-1 py-4 text-gray-500">Cancelar</button><button onClick={handleCreateCategoryInSitu} className="flex-1 bg-primary py-4 rounded-xl text-white">Crear</button></div></div></div>}
    {showInSituAttr && <div className="absolute inset-0 bg-black/70 z-[60] flex items-center justify-center rounded-[2.5rem] p-6"><div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] space-y-6 text-center"><Tag className="mx-auto text-accent"/><h3 className="text-xl font-bold uppercase text-white">Nuevo Grupo</h3><p className="text-xs text-gray-500 uppercase">Categoría: {category}</p><input value={newAttrName} onChange={e => setNewAttrName(e.target.value)} placeholder="Ej: Material" className="w-full bg-black/40 rounded-xl p-4 text-white text-center"/><div className="flex gap-4"><button onClick={() => setShowInSituAttr(false)} className="flex-1 py-4 text-gray-500">Cancelar</button><button onClick={handleCreateAttrInSitu} className="flex-1 bg-accent py-4 rounded-xl text-black font-bold">Vincular</button></div></div></div>}
    <div className="p-8 border-b border-white/5 flex justify-between items-center"><div className="flex items-center gap-4"><PlusCircle className="text-primary"/><div><h2 className="text-2xl font-black text-white uppercase">{productToEdit ? "Editar Producto" : "Nuevo Producto"}</h2><p className="text-gray-500 text-sm">Relaciones por ID de categoría y atributo.</p></div></div><button onClick={onClose} className="p-3 text-gray-400"><X size={28}/></button></div>
    <div className="p-8 space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="md:col-span-2 space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Type size={14}/> Nombre</label><input value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white outline-none" placeholder="Ej: Llavero Corazón"/></div><div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Layers size={14}/> Categoría</label><div className="flex gap-2"><select value={categoryId} onChange={e => selectCategory(e.target.value)} className="flex-grow bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white"><option value="">Elegir...</option>{categories.map(c => <option key={c.id || c.nombre} value={c.id}>{c.nombre}</option>)}</select><button onClick={() => setShowInSituCat(true)} className="bg-primary/10 text-primary p-4 rounded-2xl"><Plus size={20}/></button></div></div><div className="md:col-span-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Info size={14}/> Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white h-24"/></div></section>
      <section className="space-y-4"><div className="flex justify-between items-center"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ImageIcon size={14}/> Galería {isCompressing && <Loader2 size={13} className="animate-spin text-primary"/>}</label><label className="cursor-pointer bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 uppercase">+ Añadir Fotos<input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/></label></div>{images.length === 0 ? <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer"><Upload className="text-gray-600 mb-3"/><span className="text-[10px] font-black text-gray-400 uppercase">Cargar imágenes</span><input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/></label> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#121212] p-4 rounded-[2rem]">{images.map((img, i) => <div key={i} className="relative aspect-square"><img src={img.url} className="w-full h-full object-cover rounded-2xl" alt=""/><button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-xl"><Trash2 size={15}/></button>{i === 0 && <span className="absolute bottom-2 left-2 bg-primary text-white text-[9px] px-2 py-1 rounded">Principal</span>}</div>)}</div>}</section>
      <section className="border-t border-white/5 pt-10 space-y-8"><div className="flex justify-between items-center"><span className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Tag size={16}/> Atributos del Producto</span><button onClick={() => categoryId ? setShowInSituAttr(true) : alert("Selecciona una categoría primero")} className="text-[10px] font-black text-accent uppercase">+ Crear Grupo</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{relevantAttributes.map(attr => <AttributeField key={attr.id} attr={attr} selected={selectedOptions[attr.id] || []} onToggle={(v: string) => toggleOption(attr.id, v)} onAdd={(v: string) => addNewOption(attr, v)}/>) }{categoryId && relevantAttributes.length === 0 && <div className="text-gray-600 bg-white/5 p-6 rounded-2xl text-[10px] font-bold uppercase flex gap-3"><AlertCircle size={18}/> Esta categoría aún no tiene grupos de atributos.</div>}</div></section>
      <section className="pt-10 border-t border-white/5 space-y-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Hash className="text-accent" size={20}/> Escalas de Precios</h3>{priceMatrix.map((scale, i) => <div key={i} className="flex flex-col md:flex-row gap-4 bg-white/[0.02] p-5 rounded-2xl"><input type="number" value={scale.min} onChange={e => {const n=[...priceMatrix]; n[i].min=Number(e.target.value); setPriceMatrix(n)}} className="bg-black/40 p-3 rounded-xl text-primary w-24"/><input type="number" value={scale.max} onChange={e => {const n=[...priceMatrix]; n[i].max=Number(e.target.value); setPriceMatrix(n)}} className="bg-black/40 p-3 rounded-xl text-primary w-24"/><input type="number" value={scale.price} onChange={e => {const n=[...priceMatrix]; n[i].price=Number(e.target.value); setPriceMatrix(n)}} className="flex-grow bg-black/40 p-3 rounded-xl text-accent"/><button onClick={() => setPriceMatrix(priceMatrix.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={18}/></button></div>)}<button onClick={() => setPriceMatrix([...priceMatrix, {min: 1, max: 12, price: 0}])} className="text-[10px] font-black text-gray-400 uppercase">+ Nueva Escala</button></section>
      <section className="pt-10 border-t border-white/5 space-y-4"><div className="flex justify-between"><label className="text-[10px] font-black text-gray-500 uppercase">Colores / Variantes</label><button onClick={() => setColors([...colors, {name: "", hex: "#2E8982"}])} className="text-primary text-[10px] font-black">+ Añadir</button></div>{colors.map((c, i) => <div key={i} className="flex gap-3"><input type="color" value={c.hex} onChange={e => {const n=[...colors]; n[i].hex=e.target.value; setColors(n)}}/><input value={c.name} onChange={e => {const n=[...colors]; n[i].name=e.target.value; setColors(n)}} className="flex-grow bg-black/30 p-3 rounded-xl text-white" placeholder="Nombre"/><button onClick={() => setColors(colors.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={18}/></button></div>)}</section>
      <button onClick={handleSubmit} disabled={isUploading || isCompressing} className="w-full bg-primary text-white py-7 rounded-[2rem] font-black text-xl uppercase disabled:opacity-50">{isUploading ? "Sincronizando..." : productToEdit ? "Actualizar Producto" : "Publicar Producto"}</button>
    </div>
  </div></div>;
};

const AttributeField = ({ attr, selected, onToggle, onAdd }: any) => { const [newValue, setNewValue] = useState(""); const options = Array.from(new Set(attr.opciones || [])); const commit = () => { if (newValue.trim()) { onAdd(newValue.trim()); setNewValue(""); } }; return <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{attr.nombreAtributo}</label><div className="flex flex-wrap gap-2">{options.map((opt: any) => <button key={opt} type="button" onClick={() => onToggle(opt)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${selected.includes(opt) ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-gray-400"}`}>{selected.includes(opt) && <Check size={12} className="inline mr-2"/>}{opt}</button>)}<input value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === "Enter" && commit()} placeholder="Añadir opción" className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 text-xs text-white outline-none w-32"/></div></div>; };
export default ProductForm;
