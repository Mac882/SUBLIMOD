"use client";
import React, { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { X, Upload, Layers, Save, Plus, Edit, Trash2, Package, ArrowUpRight, AlertTriangle } from "lucide-react";

interface CategoryManagerProps { onSelectCategory: (catName: string) => void; triggerDelete: (id: string, type: string, action: () => void) => void; }

const CategoryManager = ({ onSelectCategory, triggerDelete }: CategoryManagerProps) => {
  const [categorias, setCategorias] = useState<any[]>([]), [productos, setProductos] = useState<any[]>([]), [atributos, setAtributos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true), [isModalOpen, setIsModalOpen] = useState(false), [categoryToEdit, setCategoryToEdit] = useState<any>(null), [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(""), [description, setDescription] = useState(""), [imageFile, setImageFile] = useState<File | null>(null), [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), snap => { setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    const unsubProd = onSnapshot(collection(db, "productos"), snap => setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAttr = onSnapshot(collection(db, "atributos_globales"), snap => setAtributos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubCat(); unsubProd(); unsubAttr(); };
  }, []);

  useEffect(() => { if (categoryToEdit) { setName(categoryToEdit.nombre || ""); setDescription(categoryToEdit.descripcion || ""); setPreviewUrl(categoryToEdit.imagenUrl || null); } else resetForm(); }, [categoryToEdit]);
  const resetForm = () => { setName(""); setDescription(""); setImageFile(null); setPreviewUrl(null); setCategoryToEdit(null); };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); } };

  const handleSubmit = async () => {
    const cleanName = name.trim(); if (!cleanName) return alert("El nombre es obligatorio.");
    if (categorias.some(c => c.nombre.trim().toLowerCase() === cleanName.toLowerCase() && c.id !== categoryToEdit?.id)) return alert("Ya existe una categoría con ese nombre.");
    setIsUploading(true);
    try {
      let finalImageUrl = previewUrl;
      if (imageFile) { const storageRef = ref(storage, `categorias/${Date.now()}_${imageFile.name}`); finalImageUrl = await getDownloadURL((await uploadBytes(storageRef, imageFile)).ref); }
      const categoryData = { nombre: cleanName, descripcion: description.trim(), imagenUrl: finalImageUrl, updatedAt: serverTimestamp() };
      if (categoryToEdit) {
        const oldName = categoryToEdit.nombre;
        await updateDoc(doc(db, "categorias", categoryToEdit.id), categoryData);
        if (oldName !== cleanName) {
          const batch = writeBatch(db);
          productos.filter(p => p.categoriaId === categoryToEdit.id || p.categoria === oldName).forEach(p => batch.update(doc(db, "productos", p.id), { categoriaId: categoryToEdit.id, categoria: cleanName, updatedAt: serverTimestamp() }));
          atributos.filter(a => a.categoriaId === categoryToEdit.id || a.categoriaAsociada === oldName).forEach(a => batch.update(doc(db, "atributos_globales", a.id), { categoriaId: categoryToEdit.id, categoriaAsociada: cleanName, updatedAt: serverTimestamp() }));
          await batch.commit();
        }
      } else {
        const newRef = await addDoc(collection(db, "categorias"), { ...categoryData, createdAt: serverTimestamp() });
        await updateDoc(newRef, { id: newRef.id });
      }
      setIsModalOpen(false); resetForm();
    } catch (error) { console.error(error); alert("Error en Firebase."); } finally { setIsUploading(false); }
  };

  const deleteCategoryAndRelations = async (categoryId: string) => {
    const category = categorias.find(c => c.id === categoryId); if (!category) return;
    const [productsSnap, attrsSnap] = await Promise.all([getDocs(collection(db, "productos")), getDocs(collection(db, "atributos_globales"))]);
    const batch = writeBatch(db);
    productsSnap.docs.filter(d => { const p: any = d.data(); return p.categoriaId === categoryId || p.categoria === category.nombre; }).forEach(d => batch.delete(d.ref));
    attrsSnap.docs.filter(d => { const a: any = d.data(); return a.categoriaId === categoryId || a.categoriaAsociada === category.nombre; }).forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, "categorias", categoryId)); await batch.commit();
  };

  return <div className="space-y-10 animate-in fade-in duration-500">
    <header className="flex justify-between items-center"><div><h1 className="text-4xl font-black text-white uppercase leading-none tracking-tight">Categorías</h1><p className="text-gray-500 text-xs font-bold uppercase mt-2">Navegación Visual del Catálogo</p></div><button onClick={() => { setCategoryToEdit(null); setIsModalOpen(true); }} className="bg-primary text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 uppercase text-[10px] tracking-widest shadow-xl"><Plus size={18}/> Nueva Categoría</button></header>
    {loading ? <div className="text-center py-20 text-gray-600 font-bold uppercase">Sincronizando...</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{categorias.map(cat => { const count = productos.filter(p => p.categoriaId === cat.id || p.categoria === cat.nombre).length; const attrCount = atributos.filter(a => a.categoriaId === cat.id || a.categoriaAsociada === cat.nombre).length; return <div key={cat.id} onClick={() => onSelectCategory(cat.nombre)} className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-2xl relative hover:border-primary/50 cursor-pointer transition-all"><div className="h-48 bg-[#121212] relative overflow-hidden">{cat.imagenUrl ? <img src={cat.imagenUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt=""/> : <div className="w-full h-full flex items-center justify-center opacity-10"><Layers size={48}/></div>}<div className="absolute top-4 left-4 flex gap-2"><span className="bg-black/60 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-2"><Package size={10} className="text-primary"/> {count} Artículos</span><span className="bg-black/60 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">{attrCount} Atributos</span></div><div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2">VER PRODUCTOS <ArrowUpRight size={14}/></span></div></div><div className="p-8 space-y-4"><h3 className="text-xl font-bold uppercase text-white group-hover:text-primary">{cat.nombre}</h3><p className="text-gray-500 text-xs line-clamp-2 italic">{cat.descripcion || "Sin descripción pública."}</p><div className="flex gap-3 pt-4 border-t border-white/5"><button onClick={e => { e.stopPropagation(); setCategoryToEdit(cat); setIsModalOpen(true); }} className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2"><Edit size={14}/> Editar</button><button onClick={e => { e.stopPropagation(); triggerDelete(cat.id, "Categoría y sus productos/atributos", async () => deleteCategoryAndRelations(cat.id)); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 size={16}/></button></div></div></div>; })}</div>}
    {isModalOpen && <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"><div className="bg-[#1A1A1A] w-full max-w-2xl my-auto rounded-[2.5rem] border border-white/10"><div className="p-8 border-b border-white/5 flex justify-between items-center"><h2 className="text-2xl font-bold text-white uppercase">{categoryToEdit ? "Editar" : "Nueva"} Categoría</h2><button onClick={() => {setIsModalOpen(false);resetForm();}} className="p-3 text-gray-400"><X size={28}/></button></div><div className="p-8 space-y-8"><input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none"/><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción pública" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white h-28 outline-none"/>{!previewUrl ? <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer"><Upload className="w-10 h-10 mb-3 text-gray-600"/><span className="text-[10px] font-black uppercase text-gray-400">Subir Imagen</span><input type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label> : <div className="relative h-56"><img src={previewUrl} className="w-full h-full object-cover rounded-[2rem]" alt=""/><label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 rounded-[2rem]"><span className="text-white bg-primary px-6 py-3 rounded-xl">Cambiar</span><input type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label></div>}{categoryToEdit && <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 text-[10px] font-bold uppercase flex gap-3"><AlertTriangle size={18}/><span>El ID de categoría no cambia al renombrarla.</span></div>}<button onClick={handleSubmit} disabled={isUploading} className="w-full bg-primary text-white py-6 rounded-3xl font-black text-lg uppercase">{isUploading ? "Guardando..." : <><Save size={20} className="inline mr-2"/> Guardar</>}</button></div></div></div>}
  </div>;
};
export default CategoryManager;
