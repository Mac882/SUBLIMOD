"use client";
import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase"; // Importamos auth
import { signOut } from "firebase/auth"; // Para cerrar sesión
import { useRouter } from "next/navigation";
import { 
  collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, 
  setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp 
} from "firebase/firestore";
import { 
  LayoutDashboard, Package, Layers, Settings, Plus, Menu,
  Edit, Trash2, TrendingUp, ShoppingBag, Truck, Eye,
  MessageSquare, Save, X, CheckCircle, Tag, Hash, Info, Search, Filter, Check, XCircle, AlertTriangle, LogOut
} from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import CategoryManager from "@/components/admin/CategoryManager";
import AuthGuard from "@/components/admin/AuthGuard"; // El protector que creamos

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // --- DATA STATES ---
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [atributosGlobales, setAtributosGlobales] = useState<any[]>([]);
  
  // --- CONFIGURACIÓN COMPLETA PARA "NOSOTROS" Y CONTACTO ---
  const [config, setConfig] = useState({ 
    whatsapp: "", 
    envios: "",
    address: "",
    aboutImageUrl: "",
    aboutTitle: "",
    aboutParagraph1: "",
    aboutParagraph2: "",
    mapsUrl: "",
    mapsEmbedUrl: ""
  });
  
  // --- UI STATES ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any>(null);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState(0);
  
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [newAttrData, setNewAttrData] = useState({ nombre: "", categoria: "" });
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState(false);

  // --- MODAL DE CONFIRMACIÓN ---
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: string, action: () => void } | null>(null);

  // --- FILTROS ---
  const [productCategoryFilter, setProductCategoryFilter] = useState("TODAS");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("TODAS");
  const [attrSearchQuery, setAttrSearchQuery] = useState("");

  // --- REAL-TIME LISTENERS ---
  useEffect(() => {
    const unsubProd = onSnapshot(query(collection(db, "productos"), orderBy("createdAt", "desc")), (snap) => {
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCat = onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAttr = onSnapshot(query(collection(db, "atributos_globales"), orderBy("nombreAtributo", "asc")), (snap) => {
      setAtributosGlobales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (snap) => {
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
      setLoading(false);
    });
    return () => { unsubProd(); unsubCat(); unsubAttr(); unsubConfig(); };
  }, []);

  // --- LOGICA DE CERRAR SESIÓN ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  // --- LOGICA DE FILTRADO ---
  const uniqueProductCategories = useMemo(() => {
    const set = new Set<string>();
    productos.forEach(p => { if(p.categoria) set.add(p.categoria.toUpperCase()); });
    return ["TODAS", ...Array.from(set).sort()];
  }, [productos]);

  const filteredProductsTable = useMemo(() => {
    return productos.filter(p => 
      productCategoryFilter === "TODAS" || 
      p.categoria?.toUpperCase() === productCategoryFilter.toUpperCase()
    );
  }, [productos, productCategoryFilter]);

  const attributeCategories = useMemo(() => {
    const set = new Set<string>();
    atributosGlobales.forEach((attr) => { if (attr.categoriaAsociada) set.add(attr.categoriaAsociada.trim()); });
    return ["TODAS", ...Array.from(set)];
  }, [atributosGlobales]);

  const groupedAttributes = useMemo(() => {
    const filtered = atributosGlobales.filter((attr) => {
      const matchesCategory = selectedCategoryFilter === "TODAS" || (attr.categoriaAsociada?.toUpperCase() === selectedCategoryFilter.toUpperCase());
      const matchesSearch = attr.nombreAtributo?.toLowerCase().includes(attrSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    const acc: Record<string, any[]> = {};
    filtered.forEach((attr) => {
      const key = attr.categoriaAsociada ? attr.categoriaAsociada.toUpperCase() : "GENERAL";
      if (!acc[key]) acc[key] = [];
      acc[key].push(attr);
    });
    return acc;
  }, [atributosGlobales, selectedCategoryFilter, attrSearchQuery]);

  const previewImagesList = selectedProductForPreview 
    ? (selectedProductForPreview.imagenes?.length > 0 
        ? selectedProductForPreview.imagenes 
        : (selectedProductForPreview.imagenUrl ? [selectedProductForPreview.imagenUrl] : []))
    : [];

  // --- ACTIONS ---
  const handleEditFromPreview = (prod: any) => {
    setSelectedProductForPreview(null);
    setSelectedProductToEdit(prod);
    setShowProductModal(true);
  };

  const triggerDelete = (id: string, type: string, action: () => void) => {
    setItemToDelete({ id, type, action });
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await itemToDelete.action();
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  const handleSelectCategoryFromManager = (catName: string) => {
    setProductCategoryFilter(catName.toUpperCase());
    setActiveTab("productos");
  };

  const handleAddAttributeGroup = async () => {
    if (!newAttrData.nombre || !newAttrData.categoria) return;
    if (editingAttrId) {
      await updateDoc(doc(db, "atributos_globales", editingAttrId), {
        nombreAtributo: newAttrData.nombre,
        categoriaAsociada: newAttrData.categoria
      });
      setEditingAttrId(null);
    } else {
      await addDoc(collection(db, "atributos_globales"), { 
        nombreAtributo: newAttrData.nombre, 
        categoriaAsociada: newAttrData.categoria,
        opciones: [], 
        createdAt: serverTimestamp() 
      });
    }
    setNewAttrData({ nombre: "", categoria: "" });
    setShowAttrModal(false);
  };

  const handleEditAttr = (attr: any) => {
    setNewAttrData({ nombre: attr.nombreAtributo, categoria: attr.categoriaAsociada });
    setEditingAttrId(attr.id);
    setShowAttrModal(true);
  };

  const handleAddOptionToAttr = async (attrId: string, option: string) => {
    if (!option) return;
    await updateDoc(doc(db, "atributos_globales", attrId), { opciones: arrayUnion(option.trim()) });
  };

  const handleRemoveOptionFromAttr = async (attrId: string, option: string) => {
    await updateDoc(doc(db, "atributos_globales", attrId), { opciones: arrayRemove(option) });
  };

  const handleSaveConfig = async () => {
    setSaveStatus(true);
    await setDoc(doc(db, "configuracion", "general"), config, { merge: true });
    setTimeout(() => setSaveStatus(false), 3000);
  };

  const NavLinks = () => (
    <nav className="flex-grow px-4 space-y-2 mt-4">
      {[
        { id: "resumen", icon: <LayoutDashboard size={20} />, label: "Resumen" },
        { id: "productos", icon: <Package size={20} />, label: "Productos" },
        { id: "categorias", icon: <Layers size={20} />, label: "Categorías" },
        { id: "atributos", icon: <Tag size={20} />, label: "Atributos / Unidades" },
        { id: "configuracion", icon: <Settings size={20} />, label: "Configuración" }
      ].map((item) => (
        <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white/5 text-gray-500"}`}>
          {item.icon} <span className="font-bold text-sm tracking-tight">{item.label}</span>
        </button>
      ))}

      {/* BOTÓN CERRAR SESIÓN (NUEVO) */}
      <button 
        onClick={handleLogout} 
        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all mt-10"
      >
        <LogOut size={20} /> 
        <span className="font-bold text-sm tracking-tight uppercase">Cerrar Sesión</span>
      </button>
    </nav>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#121212] text-gray-200 flex flex-col md:flex-row font-sans">
        
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-[#1E1E1E] border-r border-white/5 flex-col sticky top-0 h-screen shrink-0">
          <div className="p-8">
            <h2 className="text-accent font-black text-2xl italic tracking-tighter flex items-center gap-2 uppercase">SubliMod <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white not-italic font-bold tracking-widest">Admin</span></h2>
          </div>
          <NavLinks />
          <div className="p-8 border-t border-white/5 text-[10px] text-gray-600 font-bold uppercase tracking-widest">v1.1.0 SECURE</div>
        </aside>

        {/* HEADER MÓVIL */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#1E1E1E] border-b border-white/5 sticky top-0 z-[100]">
          <h2 className="text-accent font-black text-xl italic tracking-tighter uppercase">SubliMod</h2>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary"><Menu size={24} /></button>
        </header>

        {/* MENU MÓVIL DRAWER */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[200] flex animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <nav className="relative w-72 bg-[#1E1E1E] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="p-8 flex justify-between items-center border-b border-white/5">
                <h2 className="text-accent font-black text-xl italic uppercase tracking-widest">Menú</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <NavLinks />
            </nav>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-grow p-5 md:p-10 overflow-y-auto">
          
          {activeTab === "resumen" && (
            <section className="space-y-10 animate-in fade-in duration-500">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <StatCard icon={<ShoppingBag className="text-primary"/>} label="Productos" value={productos.length} trend="Sincronizado" />
                <StatCard icon={<Tag className="text-accent"/>} label="Atributos" value={atributosGlobales.length} trend="Globales" />
                <StatCard icon={<TrendingUp className="text-green-500"/>} label="Sistema" value="Real-time" />
              </div>
            </section>
          )}

          {activeTab === "productos" && (
            <div className="space-y-10 animate-in fade-in">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Productos</h1>
                <button onClick={() => {setSelectedProductToEdit(null); setShowProductModal(true);}} className="w-full sm:w-auto bg-accent text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-transform">
                  <Plus size={18} /> Nuevo Producto
                </button>
              </header>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#1E1E1E] p-3 rounded-2xl border border-white/5">
                <Filter size={14} className="text-primary shrink-0 ml-2" />
                {uniqueProductCategories.map((cat) => (
                  <button key={cat} onClick={() => setProductCategoryFilter(cat)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${productCategoryFilter === cat ? "bg-primary border-primary text-white" : "bg-white/5 border-transparent text-gray-500"}`}>{cat}</button>
                ))}
              </div>

              <div className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-x-auto shadow-2xl">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-white/[0.02] text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <tr><th className="px-8 py-6">Producto</th><th className="px-8 py-6">Categoría</th><th className="px-8 py-6 text-center">Precio Base</th><th className="px-8 py-6 text-right">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProductsTable.map((prod) => (
                      <tr key={prod.id} className="hover:bg-white/[0.02] group transition-colors">
                        <td className="px-8 py-6 flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedProductForPreview(prod); setActivePreviewImage(0); }}>
                          <img src={prod.imagenUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" /> 
                          <span className="font-bold text-white uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{prod.nombre}</span>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">{prod.categoria}</td>
                        <td className="px-8 py-6 text-accent font-black text-center italic">C$ {prod.escalasPrecios?.[0]?.price}</td>
                        <td className="px-8 py-6 text-right space-x-2">
                          <button onClick={() => {setSelectedProductToEdit(prod); setShowProductModal(true);}} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors" title="Editar"><Edit size={18}/></button>
                          <button onClick={() => triggerDelete(prod.id, "Producto", async () => await deleteDoc(doc(db,"productos",prod.id)))} className="p-2.5 bg-red-500/10 rounded-xl text-red-500/60 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "categorias" && <CategoryManager onSelectCategory={handleSelectCategoryFromManager} triggerDelete={triggerDelete} />}

          {activeTab === "atributos" && (
            <section className="space-y-8 animate-in fade-in">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Atributos</h1>
                <button onClick={() => {setEditingAttrId(null); setNewAttrData({nombre:"", categoria:""}); setShowAttrModal(true);}} className="w-full md:w-auto bg-primary text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest shadow-xl">
                  <Plus size={18} /> Nuevo Grupo
                </button>
              </header>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1E1E1E] p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                  <Filter size={16} className="text-primary ml-2" />
                  {attributeCategories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategoryFilter(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedCategoryFilter === cat ? "bg-primary text-white" : "bg-white/5 text-gray-500"}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                {Object.entries(groupedAttributes).map(([catName, items]) => (
                  <div key={catName} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <span className="bg-primary/20 text-primary p-2 rounded-xl border border-primary/20"><Tag size={16} /></span>
                      <h2 className="text-lg font-black uppercase tracking-wider text-white">{catName}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((attr) => (
                        <div key={attr.id} className="bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-white/5 relative shadow-xl hover:border-white/10 transition-all flex flex-col justify-between group">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-3 py-1 rounded-full border border-primary/20">{attr.categoriaAsociada}</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditAttr(attr)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit size={16}/></button>
                                <button onClick={() => triggerDelete(attr.id, "Grupo de Atributos", async () => await deleteDoc(doc(db,"atributos_globales",attr.id)))} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold uppercase mb-6 tracking-tight">{attr.nombreAtributo}</h3>
                            <div className="flex flex-wrap gap-2 mb-8">
                              {attr.opciones?.map((opt: string) => (
                                <span key={opt} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-400 flex items-center gap-2">{opt}<button onClick={() => handleRemoveOptionFromAttr(attr.id, opt)}><X size={10}/></button></span>
                              ))}
                            </div>
                          </div>
                          <input type="text" placeholder="Añadir opción..." onKeyDown={(e) => { if(e.key === 'Enter') { handleAddOptionToAttr(attr.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }}} className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs outline-none focus:border-accent text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "configuracion" && (
            <section className="max-w-3xl space-y-10 animate-in fade-in pb-16">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Configuración</h1>
              <div className="bg-[#1E1E1E] p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative">
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase">WhatsApp (+505)</label>
                  <input value={config.whatsapp || ""} onChange={(e) => setConfig({...config, whatsapp: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Dirección Exacta</label>
                  <input value={config.address || ""} onChange={(e) => setConfig({...config, address: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" placeholder="Puente CentroAmérica 75 vrs al oeste." />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Cobertura y Envíos</label>
                  <input value={config.envios || ""} onChange={(e) => setConfig({...config, envios: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" placeholder="Envíos vía Cargo Trans o Interlocal." />
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent">Sección "Sobre Nosotros"</h3>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Imagen Principal (Taller)</label>
                    {config.aboutImageUrl && (
                      <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-white/10 mb-3 group">
                        <img src={config.aboutImageUrl} alt="Previsualización" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setConfig({...config, aboutImageUrl: ""})} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar imagen"><X size={14} /></button>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shrink-0">
                        <Plus size={16} /> Subir Imagen
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => { setConfig({ ...config, aboutImageUrl: reader.result as string }); };
                              reader.readAsDataURL(file);
                            }
                        }}/>
                      </label>
                      <input value={config.aboutImageUrl || ""} onChange={(e) => setConfig({...config, aboutImageUrl: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 outline-none text-white focus:border-primary text-xs font-bold" placeholder="o pega una URL directa (https://...)" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Título Principal</label>
                    <input value={config.aboutTitle || ""} onChange={(e) => setConfig({...config, aboutTitle: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" placeholder="Donde el arte se une con la precisión" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Párrafo 1 (Destacado)</label>
                    <textarea value={config.aboutParagraph1 || ""} onChange={(e) => setConfig({...config, aboutParagraph1: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-medium h-28 no-scrollbar" placeholder="En SubliMod combinamos la pasión por el diseño..." />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Párrafo 2 (Secundario)</label>
                    <textarea value={config.aboutParagraph2 || ""} onChange={(e) => setConfig({...config, aboutParagraph2: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-medium h-28 no-scrollbar" placeholder="Cada taza, camiseta o accesorio se diseña..." />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent">Configuración de Google Maps</h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Link de Ubicación ("Abrir en Google Maps")</label>
                    <input value={config.mapsUrl || ""} onChange={(e) => setConfig({...config, mapsUrl: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" placeholder="https://maps.app.goo.gl/..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase">URL de Embed del Mapa (Iframe)</label>
                    <input value={config.mapsEmbedUrl || ""} onChange={(e) => setConfig({...config, mapsEmbedUrl: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 outline-none text-white focus:border-primary font-bold" placeholder="https://www.google.com/maps/embed?pb=..." />
                  </div>
                </div>

                <button onClick={handleSaveConfig} className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all uppercase tracking-widest">{saveStatus ? "¡Guardado!" : <><Save size={24} /> Guardar Cambios</>}</button>
              </div>
            </section>
          )}

          {/* MODAL CONFIRMACIÓN ELIMINAR */}
          {showConfirmDelete && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
              <div className="bg-[#1A1A1A] w-full max-w-sm p-10 rounded-[2.5rem] border border-white/10 text-center shadow-2xl animate-in zoom-in duration-300">
                <div className="bg-red-500/10 w-fit p-4 rounded-full mx-auto mb-6 text-red-500"><AlertTriangle size={32}/></div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">¿Estás seguro?</h3>
                <p className="text-gray-500 text-sm mb-10 leading-relaxed font-medium uppercase tracking-tight">Deseas eliminar este {itemToDelete?.type}. Esta acción es irreversible.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-white tracking-widest">Cancelar</button>
                  <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 py-4 rounded-2xl text-xs font-black uppercase text-white shadow-xl">Sí, Eliminar</button>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW PRODUCTO MODAL */}
          {selectedProductForPreview && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[250] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-[#1A1A1A] w-full max-w-5xl my-auto rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative flex flex-col md:flex-row">
                <button onClick={() => setSelectedProductForPreview(null)} className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white z-50"><X size={24}/></button>
                <div className="bg-[#121212] p-10 flex flex-col items-center justify-center border-r border-white/5 md:w-1/2 min-h-[300px]">
                  {previewImagesList.length > 0 && <img src={previewImagesList[activePreviewImage]} className="w-full h-auto max-h-[50vh] object-contain rounded-3xl drop-shadow-2xl mb-6 transition-all" alt="" />}
                  {previewImagesList.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 w-full max-w-md no-scrollbar justify-center">
                      {previewImagesList.map((img: string, idx: number) => (
                        <button key={idx} onClick={() => setActivePreviewImage(idx)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activePreviewImage === idx ? 'border-primary scale-110' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'}`}><img src={img} className="w-full h-full object-cover" alt="" /></button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-10 space-y-8 md:w-1/2 max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col">
                  <div>
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">{selectedProductForPreview.categoria}</span>
                    <h2 className="text-3xl font-black text-white mt-4 tracking-tighter uppercase leading-none">{selectedProductForPreview.nombre}</h2>
                    <p className="text-gray-500 text-sm mt-4 leading-relaxed italic">{selectedProductForPreview.descripcion || "Sin descripción técnica configurada."}</p>
                  </div>
                  <div className="space-y-6 flex-grow">
                    {selectedProductForPreview.atributos && Object.keys(selectedProductForPreview.atributos).length > 0 && (
                      <div className="space-y-4 border-t border-white/5 pt-6">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Tag size={14}/> Especificaciones</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedProductForPreview.atributos).map(([key, vals]: any) => (
                            <div key={key}>
                              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">{key}</p>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(vals) ? vals.map(v => (<span key={v} className="bg-white/5 text-gray-400 text-[10px] px-2 py-1 rounded-md border border-white/5">{v}</span>)) : (<span className="bg-white/5 text-gray-400 text-[10px] px-2 py-1 rounded-md border border-white/5">{vals}</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProductForPreview.colores && selectedProductForPreview.colores.length > 0 && (
                      <div className="space-y-4 border-t border-white/5 pt-6">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Variantes de Color</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedProductForPreview.colores.map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 p-1.5 pr-3 rounded-xl border border-white/5">
                              <div className="w-5 h-5 rounded-md border border-black/20 shadow-inner" style={{ backgroundColor: c.hex }}></div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProductForPreview.escalasPrecios && selectedProductForPreview.escalasPrecios.length > 0 && (
                      <div className="space-y-4 border-t border-white/5 pt-6">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Hash size={14}/> Escalas de Precio</h4>
                        <div className="space-y-2">
                          {selectedProductForPreview.escalasPrecios.map((escala: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">De {escala.min} a {escala.max} uds.</span>
                              <span className="text-sm font-black text-accent">C$ {escala.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-white/5 mt-auto">
                    <button onClick={() => handleEditFromPreview(selectedProductForPreview)} className="flex-1 bg-white/5 hover:bg-primary hover:text-white py-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-primary"><Edit size={16}/> Editar</button>
                    <button onClick={() => { const id = selectedProductForPreview.id; setSelectedProductForPreview(null); triggerDelete(id, "Producto", async () => await deleteDoc(doc(db,"productos",id))); }} className="px-6 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"><Trash2 size={20}/></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showProductModal && <ProductForm onClose={() => {setShowProductModal(false); setSelectedProductToEdit(null);}} productToEdit={selectedProductToEdit} availableCategories={categorias.map(c => c.nombre)} globalAttributes={atributosGlobales}/>}

          {showAttrModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
              <div className="bg-[#1E1E1E] w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
                <h2 className="text-xl font-black uppercase text-accent text-center">{editingAttrId ? "Editar" : "Nuevo"} Grupo</h2>
                <div className="space-y-4">
                  <input value={newAttrData.nombre} onChange={(e) => setNewAttrData({...newAttrData, nombre: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-accent" placeholder="Ej: Material" />
                  <select value={newAttrData.categoria} onChange={(e) => setNewAttrData({...newAttrData, categoria: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold appearance-none outline-none focus:border-accent">
                    <option value="">Asociar a...</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowAttrModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-500">Cancelar</button>
                  <button onClick={handleAddAttributeGroup} className="flex-1 bg-accent py-4 rounded-2xl text-xs font-black text-black">Guardar</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

const StatCard = ({ icon, label, value, trend }: any) => (
  <div className="bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-white/5 shadow-xl transition-all group hover:border-white/10">
    <div className="bg-white/5 w-fit p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110">{icon}</div>
    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter uppercase">{value}</h3>
    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">{trend}</span>
  </div>
);