"use client";
import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { X, Upload, Image as ImageIcon, Layers, Type, Info, Save, Plus, Edit, Trash2, Package, ArrowUpRight } from "lucide-react";

interface CategoryManagerProps {
  onSelectCategory: (catName: string) => void;
  triggerDelete: (id: string, type: string, action: () => void) => void; // Prop añadida
}

const CategoryManager = ({ onSelectCategory, triggerDelete }: CategoryManagerProps) => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubProd = onSnapshot(collection(db, "productos"), (snap) => {
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubCat(); unsubProd(); };
  }, []);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.nombre || "");
      setDescription(categoryToEdit.descripcion || "");
      setPreviewUrl(categoryToEdit.imagenUrl || null);
    } else {
      resetForm();
    }
  }, [categoryToEdit]);

  const resetForm = () => {
    setName(""); setDescription(""); setImageFile(null); setPreviewUrl(null); setCategoryToEdit(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!name) { alert("El nombre es obligatorio."); return; }
    setIsUploading(true);
    try {
      let finalImageUrl = previewUrl;
      if (imageFile) {
        const storageRef = ref(storage, `categorias/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(uploadResult.ref);
      }
      const categoryData = { nombre: name.trim(), descripcion: description, imagenUrl: finalImageUrl, updatedAt: serverTimestamp() };
      if (categoryToEdit) {
        await updateDoc(doc(db, "categorias", categoryToEdit.id), categoryData);
      } else {
        await addDoc(collection(db, "categorias"), { ...categoryData, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) { console.error(error); alert("Error en Firebase."); } finally { setIsUploading(false); }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white uppercase leading-none tracking-tight">Categorías</h1>
          <p className="text-gray-500 text-xs font-bold uppercase mt-2">Navegación Visual del Catálogo</p>
        </div>
        <button onClick={() => { setCategoryToEdit(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"><Plus size={18} /> Nueva Categoría</button>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-600 font-bold uppercase">Sincronizando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categorias.map((cat) => (
            <div key={cat.id} onClick={() => onSelectCategory(cat.nombre)} className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-2xl relative hover:border-primary/50 cursor-pointer transition-all">
              <div className="h-48 bg-[#121212] relative overflow-hidden">
                {cat.imagenUrl ? <img src={cat.imagenUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Layers size={48} /></div>}
                <div className="absolute top-4 left-4"><span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-2 border border-white/10"><Package size={10} className="text-primary"/> {productos.filter(p => p.categoria === cat.nombre).length} Artículos</span></div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2">VER PRODUCTOS <ArrowUpRight size={14}/></span></div>
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-xl font-bold uppercase text-white group-hover:text-primary transition-colors">{cat.nombre}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 italic font-medium">{cat.description || cat.descripcion || "Sin descripción pública."}</p>
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button onClick={(e) => { e.stopPropagation(); setCategoryToEdit(cat); setIsModalOpen(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2 transition-all"><Edit size={14} /> Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); triggerDelete(cat.id, "Categoría", async () => await deleteDoc(doc(db, "categorias", cat.id))); }} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1A1A1A] w-full max-w-2xl my-auto rounded-[2.5rem] border border-white/10 relative shadow-2xl animate-in zoom-in duration-300">
            <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md p-8 border-b border-white/5 flex justify-between items-center z-40">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{categoryToEdit ? "Editar" : "Nueva"} Categoría</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 hover:bg-white/5 rounded-full text-gray-400 transition-all"><X size={28} /></button>
            </div>
            <div className="p-8 space-y-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Nombre</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Descripción Pública</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white h-28 no-scrollbar outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-4">
                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-all"><Upload className="w-10 h-10 mb-3 text-gray-600" /><p className="text-[10px] font-black uppercase text-gray-400">Subir Imagen</p><input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label>
                ) : (
                  <div className="relative w-full h-64"><img src={previewUrl} className="w-full h-full object-cover rounded-[2.5rem] border-4 border-white/5" /><label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 rounded-[2.5rem] cursor-pointer transition-all"><span className="text-white text-[10px] font-black uppercase tracking-widest bg-primary px-6 py-3 rounded-xl">Cambiar Imagen</span><input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label></div>
                )}
              </div>
              <button onClick={handleSubmit} disabled={isUploading} className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-3xl font-black text-lg uppercase shadow-2xl active:scale-95 transition-all">{isUploading ? "Guardando..." : <><Save size={20} className="inline mr-2"/> Guardar</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;