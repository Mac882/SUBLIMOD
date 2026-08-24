"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { 
  X, Plus, Trash2, Check, Hash, Type, Info, Layers, 
  Upload, Image as ImageIcon, Tag, PlusCircle, AlertCircle, Edit 
} from "lucide-react";

// --- INTERFACES ---
interface ColorVariant { name: string; hex: string; }
interface PriceScale { min: number; max: number; price: number; }

interface ProductFormProps {
  onClose: () => void;
  productToEdit?: any;
  availableCategories: string[];
  globalAttributes: any[];
}

// --- CONFIGURACIÓN PREDETERMINADA DE SUBLIMOD ---
const DEFAULT_OPTIONS: any = {
  Tazas: {
    modelo: ["Blanca Clásica", "Mágica Térmica", "Cónica", "Pareja Asa Corazón", "Vidrio Esmerilado"],
    capacidad: ["11 oz", "15 oz", "17 oz"],
    acabado: ["Mate", "Brillante", "Interior de Color"]
  },
  Camisetas: {
    tallas: ["S", "M", "L", "XL", "XXL"],
    cuello: ["Redondo", "V", "Polo"],
    material: ["Algodón", "Poliéster", "Dry-Fit"]
  },
  "Botellas y Termos": {
    capacidad_ml: ["500 ml", "600 ml", "750 ml", "1 Litro"],
    material: ["Acero Inoxidable", "Aluminio"],
    tapa: ["Rosca Térmica", "Boquilla Deportiva"]
  }
};

const ProductForm = ({ onClose, productToEdit, availableCategories, globalAttributes }: ProductFormProps) => {
  // --- ESTADOS DEL PRODUCTO ---
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  
  // NUEVO: Manejo de múltiples imágenes
  const [images, setImages] = useState<{url: string, file?: File}[]>([]);

  const [selectedOptions, setSelectedOptions] = useState<any>({});
  const [colors, setColors] = useState<ColorVariant[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<PriceScale[]>([{ min: 1, max: 12, price: 0 }]);
  const [localOptionsPool, setLocalOptionsPool] = useState<any>({});

  // --- ESTADOS DE SUB-MODALES (IN SITU) ---
  const [showInSituCat, setShowInSituCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showInSituAttr, setShowInSituAttr] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");

  // --- FILTRADO DE ATRIBUTOS SEGÚN CATEGORÍA ---
  const relevantAttributes = useMemo(() => {
    if (!category) return [];
    return globalAttributes.filter(attr => attr.categoriaAsociada === category);
  }, [category, globalAttributes]);

  // --- EFECTO DE CARGA PARA EDICIÓN ---
  useEffect(() => {
    if (productToEdit) {
      setProductName(productToEdit.nombre || "");
      setCategory(productToEdit.categoria || "");
      setDescription(productToEdit.descripcion || "");
      setSelectedOptions(productToEdit.atributos || {});
      setColors(productToEdit.colores || []);
      setPriceMatrix(productToEdit.escalasPrecios || [{ min: 1, max: 12, price: 0 }]);
      
      // Cargar galería existente
      let initialImages: {url: string}[] = [];
      if (productToEdit.imagenes && productToEdit.imagenes.length > 0) {
        initialImages = productToEdit.imagenes.map((url: string) => ({ url }));
      } else if (productToEdit.imagenUrl) {
        initialImages = [{ url: productToEdit.imagenUrl }];
      }
      setImages(initialImages);
    }
  }, [productToEdit]);

  // --- MANEJO DE MÚLTIPLES IMÁGENES ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- LÓGICA IN SITU: CATEGORÍA ---
  const handleCreateCategoryInSitu = async () => {
    if (!newCatName) return;
    try {
      await addDoc(collection(db, "categorias"), { 
        nombre: newCatName, 
        createdAt: serverTimestamp() 
      });
      setCategory(newCatName);
      setNewCatName("");
      setShowInSituCat(false);
    } catch (e) { console.error(e); }
  };

  // --- LÓGICA IN SITU: GRUPO DE ATRIBUTO ---
  const handleCreateAttrInSitu = async () => {
    if (!newAttrName || !category) return;
    try {
      await addDoc(collection(db, "atributos_globales"), { 
        nombreAtributo: newAttrName, 
        categoriaAsociada: category,
        opciones: [], 
        createdAt: serverTimestamp() 
      });
      setNewAttrName("");
      setShowInSituAttr(false);
    } catch (e) { console.error(e); }
  };

  // --- GESTIÓN DE SELECCIÓN DE OPCIONES ---
  const toggleOption = (group: string, value: string) => {
    setSelectedOptions((prev: any) => {
      const current = prev[group] || [];
      const isSelected = current.includes(value);
      return { 
        ...prev, 
        [group]: isSelected ? current.filter((i: any) => i !== value) : [...current, value] 
      };
    });
  };

  // --- MÉTODOS CORREGIDO: AÑADE LOCALMENTE Y GUARDA EN FIRESTORE SI EXISTE UN ATTR_ID ---
  const addNewLocalOption = async (group: string, value: string, attrDocId?: string) => {
    if (!value || !value.trim()) return;
    const val = value.trim();

    setLocalOptionsPool((prev: any) => ({ 
      ...prev, 
      [group]: Array.from(new Set([...(prev[group] || []), val]))
    }));

    toggleOption(group, val);

    if (attrDocId) {
      try {
        await updateDoc(doc(db, "atributos_globales", attrDocId), {
          opciones: arrayUnion(val)
        });
      } catch (e) {
        console.error("Error al actualizar opciones globales en Firestore:", e);
      }
    }
  };

  // --- GUARDADO FINAL ---
  const handleSubmit = async () => {
    if (!productName || !category || images.length === 0) {
      alert("Faltan datos obligatorios (Nombre, Categoría e Imagen).");
      return;
    }
    setIsUploading(true);
    try {
      const uploadedUrls = [];
      
      // Subir todas las imágenes nuevas a Storage
      for (const img of images) {
        if (img.file) {
          const storageRef = ref(storage, `productos/${Date.now()}_${img.file.name}`);
          const uploadResult = await uploadBytes(storageRef, img.file);
          const url = await getDownloadURL(uploadResult.ref);
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(img.url);
        }
      }

      const data = {
        nombre: productName,
        descripcion: description,
        categoria: category,
        imagenUrl: uploadedUrls[0], // Compatibilidad con el campo antiguo
        imagenes: uploadedUrls, // Nuevo arreglo de galería
        atributos: selectedOptions,
        colores: colors,
        escalasPrecios: priceMatrix,
        updatedAt: serverTimestamp(),
      };
      
      if (productToEdit) {
        await updateDoc(doc(db, "productos", productToEdit.id), data);
      } else {
        await addDoc(collection(db, "productos"), { 
          ...data, 
          createdAt: serverTimestamp(), 
          activo: true 
        });
      }
      onClose();
    } catch (e) { 
      console.error(e); 
      alert("Error al guardar el producto.");
    } finally { 
      setIsUploading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] w-full max-w-5xl my-auto rounded-[2.5rem] border border-white/10 relative shadow-2xl animate-in zoom-in duration-300">
        
        {/* SUB-MODALES IN SITU (Sin cambios) */}
        {showInSituCat && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center rounded-[2.5rem] p-6 animate-in fade-in duration-300">
            <div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] border border-white/10 shadow-2xl space-y-6 text-center">
              <div className="bg-primary/10 w-fit p-4 rounded-2xl text-primary mx-auto"><Layers /></div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-white">Nueva Categoría</h3>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ej: Gorras" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 outline-none focus:border-primary text-white text-center" />
              <div className="flex gap-4">
                <button onClick={() => setShowInSituCat(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Cancelar</button>
                <button onClick={handleCreateCategoryInSitu} className="flex-1 bg-primary py-4 rounded-xl text-[10px] font-black uppercase text-white">Crear</button>
              </div>
            </div>
          </div>
        )}

        {showInSituAttr && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center rounded-[2.5rem] p-6 animate-in fade-in duration-300">
            <div className="bg-[#262626] w-full max-w-sm p-10 rounded-[2rem] border border-white/10 shadow-2xl space-y-6 text-center">
              <div className="bg-accent/10 w-fit p-4 rounded-2xl text-accent mx-auto"><Tag /></div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-white">Nuevo Grupo</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Asociado a: {category}</p>
              <input value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} placeholder="Ej: Tipo de Visera" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 outline-none focus:border-accent text-white text-center" />
              <div className="flex gap-4">
                <button onClick={() => setShowInSituAttr(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Cancelar</button>
                <button onClick={handleCreateAttrInSitu} className="flex-1 bg-accent py-4 rounded-xl text-[10px] font-black uppercase text-black font-black">Vincular</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER PRINCIPAL */}
        <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md p-8 border-b border-white/5 flex justify-between items-center z-40">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary">{productToEdit ? <Edit size={24}/> : <PlusCircle size={24}/>}</div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{productToEdit ? "Editar Producto" : "Nuevo Producto"}</h2>
              <p className="text-gray-500 text-sm">Sincronización con catálogo SubliMod.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-gray-400 transition-all"><X size={28} /></button>
        </div>

        <div className="p-8 space-y-12">
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Type size={14}/> Nombre del Producto</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white transition-all" placeholder="Ej: Jarra Cervecera" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Categoría</label>
              <div className="flex gap-2">
                <select value={category} onChange={(e) => {setCategory(e.target.value); setSelectedOptions({});}} className="flex-grow bg-white/[0.03] border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white appearance-none">
                  <option value="" className="text-gray-900 bg-white">Elegir...</option>
                  {availableCategories.map(cat => <option key={cat} value={cat} className="text-gray-900 bg-white font-medium">{cat}</option>)}
                </select>
                <button onClick={() => setShowInSituCat(true)} className="bg-primary/10 text-primary p-4 rounded-2xl hover:bg-primary hover:text-white transition-all"><Plus size={20}/></button>
              </div>
            </div>
            <div className="md:col-span-3 space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Descripción Técnica</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white h-24 no-scrollbar"></textarea>
            </div>
          </section>

          {/* SECCIÓN 2: MULTIMEDIA (GALERÍA MULTIPLE) */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Galería de Imágenes</label>
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-gray-400 border border-white/10 uppercase tracking-widest transition-all">
                + Añadir Fotos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            
            {images.length === 0 ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.02] cursor-pointer group hover:border-primary/50 transition-all">
                <Upload className="w-10 h-10 mb-3 text-gray-600 group-hover:text-primary transition-colors" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Haz clic para cargar imágenes</p>
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-[#121212] p-4 rounded-[2rem] border border-white/5">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover rounded-2xl border border-white/10" />
                    <button 
                      onClick={() => removeImage(idx)} 
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    {idx === 0 && <span className="absolute bottom-2 left-2 bg-primary text-white text-[9px] font-black uppercase px-2 py-1 rounded-md">Principal</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN 3: ATRIBUTOS CONTEXTUALES */}
          <section className="border-t border-white/5 pt-10 space-y-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                <Tag size={16} className="text-primary"/><span className="text-primary font-black uppercase text-[10px] tracking-widest">Atributos del Producto</span>
              </div>
              <button 
                onClick={() => category ? setShowInSituAttr(true) : alert("Selecciona una categoría primero")} 
                className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest"
              >
                + Crear Nuevo Grupo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-10">
                {category && DEFAULT_OPTIONS[category] && Object.keys(DEFAULT_OPTIONS[category]).map((group) => (
                  <ChipField 
                    key={group} title={group} 
                    options={Array.from(new Set([...DEFAULT_OPTIONS[category][group], ...(localOptionsPool[group] || [])]))} 
                    selected={selectedOptions[group] || []}
                    onToggle={(v: string) => toggleOption(group, v)}
                    onAdd={(v: string) => addNewLocalOption(group, v)}
                  />
                ))}

                {category && relevantAttributes.map((attr) => (
                  <ChipField 
                    key={attr.id} title={attr.nombreAtributo} 
                    options={Array.from(new Set([...(attr.opciones || []), ...(localOptionsPool[attr.nombreAtributo] || [])]))} 
                    selected={selectedOptions[attr.nombreAtributo] || []}
                    onToggle={(v: string) => toggleOption(attr.nombreAtributo, v)}
                    onAdd={(v: string) => addNewLocalOption(attr.nombreAtributo, v, attr.id)}
                  />
                ))}
                {!category && <div className="flex items-center gap-3 text-gray-600 bg-white/5 p-6 rounded-2xl border border-white/5"><AlertCircle size={20}/> <p className="text-[10px] font-bold uppercase tracking-widest">Elige una categoría para ver especificaciones.</p></div>}
              </div>

              {/* VARIANTES DE COLOR / DISEÑO */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Colores / Variantes</label>
                  <button onClick={() => setColors([...colors, {name: '', hex: '#2E8982'}])} className="text-primary text-[10px] font-black hover:underline">+ AÑADIR</button>
                </div>
                <div className="grid gap-3 max-h-80 overflow-y-auto no-scrollbar">
                  {colors.map((c, i) => (
                    <div key={i} className="flex gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5 items-center group">
                      <input type="color" value={c.hex} onChange={(e) => {const n=[...colors]; n[i].hex=e.target.value; setColors(n);}} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                      <input type="text" value={c.name} onChange={(e) => {const n=[...colors]; n[i].name=e.target.value; setColors(n);}} placeholder="Nombre (Ej: Rojo)" className="flex-grow bg-transparent text-sm border-b border-white/10 outline-none text-white focus:border-primary transition-all" />
                      <button onClick={() => setColors(colors.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 4: ESCALAS DE PRECIOS POR VOLUMEN */}
          <section className="pt-10 border-t border-white/5 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Hash className="text-accent" size={20}/> Escalas de Precios</h3>
              <button onClick={() => setPriceMatrix([...priceMatrix, {min:1, max:12, price:0}])} className="bg-white/5 px-5 py-2 rounded-xl text-[10px] font-black text-gray-400 border border-white/10 uppercase tracking-widest hover:bg-white/10 transition-all">+ Nueva Escala</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {priceMatrix.map((scale, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 group hover:border-primary/40 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Rango Unidades</span>
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                      <span className="text-[10px] text-gray-500 uppercase">De</span>
                      <input type="number" value={scale.min} onChange={(e) => {const n=[...priceMatrix]; n[index].min=Number(e.target.value); setPriceMatrix(n);}} className="w-14 bg-transparent text-center text-primary font-black outline-none" />
                      <span className="text-[10px] text-gray-500 uppercase">A</span>
                      <input type="number" value={scale.max} onChange={(e) => {const n=[...priceMatrix]; n[index].max=Number(e.target.value); setPriceMatrix(n);}} className="w-14 bg-transparent text-center text-primary font-black outline-none" />
                    </div>
                  </div>
                  <div className="flex-grow flex items-center gap-4 w-full">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Precio Unitario C$</span>
                    <input type="number" value={scale.price} onChange={(e) => {const n=[...priceMatrix]; n[index].price=Number(e.target.value); setPriceMatrix(n);}} className="flex-grow bg-black/40 border border-white/10 rounded-xl p-4 text-accent font-black text-lg outline-none focus:border-accent/50 transition-all" placeholder="0.00" />
                    <button onClick={() => setPriceMatrix(priceMatrix.filter((_, i) => i !== index))} className="p-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTÓN DE ACCIÓN FINAL */}
          <button 
            onClick={handleSubmit} disabled={isUploading} 
            className="w-full bg-primary hover:bg-primary-dark text-white py-7 rounded-[2rem] font-black text-xl tracking-[0.2em] uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/20"
          >
            {isUploading ? <><div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> Sincronizando...</> : (productToEdit ? "Actualizar Producto" : "Publicar Producto")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChipField = ({ title, options, selected, onToggle, onAdd }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleCommit = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      setNewValue("");
    }
    setIsAdding(false);
  };

  const uniqueOptions = Array.from(new Set(options));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{title.replace('_', ' ')}</label>
      <div className="flex flex-wrap gap-2">
        {uniqueOptions.map((opt: any, idx: number) => {
          const isSelected = selected.includes(opt);
          return (
            <button 
              key={`${opt}-${idx}`} 
              type="button"
              onClick={() => onToggle(opt)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isSelected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-gray-400 hover:border-gray-500"}`}
            >
              {isSelected && <Check size={12} className="inline mr-2" />} {opt}
            </button>
          );
        })}
        {isAdding ? (
          <input 
            autoFocus 
            onBlur={handleCommit} 
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()} 
            onChange={(e) => setNewValue(e.target.value)} 
            className="bg-primary/10 border border-primary/50 rounded-xl px-4 py-2 text-xs text-white outline-none w-32 animate-in zoom-in" 
            placeholder="Escribir..." 
          />
        ) : (
          <button type="button" onClick={() => setIsAdding(true)} className="px-4 py-2 rounded-xl text-[10px] font-black bg-accent/5 border border-accent/20 text-accent uppercase tracking-tighter hover:bg-accent hover:text-black transition-all">+ OTRO</button>
        )}
      </div>
    </div>
  );
};

export default ProductForm;