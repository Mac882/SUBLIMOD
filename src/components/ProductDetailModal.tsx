"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowLeft, MessageCircle, ShoppingCart, Check, Minus, Plus, Truck, ShieldCheck, Info, Maximize2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useCartStore } from "@/store/useCartStore";

interface ProductDetailModalProps {
  product: any;
  onClose: () => void;
}

const ProductDetailModal = ({ product, onClose }: ProductDetailModalProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState("86153695");
  const addItem = useCartStore((state) => state.addItem);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToQuote, setAddedToQuote] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.whatsapp) setWhatsappNumber(data.whatsapp.trim());
      }
    });
    return () => unsubConfig();
  }, []);

  const imagesList = useMemo(() => {
    return product.imagenes?.length > 0 ? product.imagenes : (product.imagenUrl ? [product.imagenUrl] : []);
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsImageZoomed(false);
    if (product.atributos) {
      const defaults: Record<string, string> = {};
      Object.entries(product.atributos).forEach(([key, options]: any) => {
        if (options && options.length > 0) defaults[key] = options[0];
      });
      setSelectedAttributes(defaults);
    } else setSelectedAttributes({});
    setSelectedColor(product.colores?.length ? product.colores[0] : null);
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!product.escalasPrecios || product.escalasPrecios.length === 0) return 0;
    const escala = product.escalasPrecios.find((e: any) => quantity >= e.min && quantity <= e.max);
    return escala ? escala.price : product.escalasPrecios[product.escalasPrecios.length - 1].price;
  }, [quantity, product.escalasPrecios]);

  const totalPrice = unitPrice * quantity;

  const handleDirectOrder = () => {
    const attrString = Object.entries(selectedAttributes).map(([key, val]) => `• *${key}:* ${val}`).join("\n");
    const message = `¡Hola SubliMod! Me interesa este producto:\n\n- *Producto:* ${product.nombre}\n- *Cantidad:* ${quantity} unidades\n${attrString}\n- *Variante/Color:* ${selectedColor?.name || "N/A"}\n\n- *Precio Unitario:* C$ ${unitPrice}\n- *Total Estimado:* C$ ${totalPrice}\n\n_Enlace del producto:_ ${window.location.origin}/producto/${product.id}\nQuedo a la espera de su respuesta para coordinar el diseño.`;
    window.open(`https://wa.me/505${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAddToQuote = () => {
    addItem({ id: `${product.id}-${Date.now()}`, productId: product.id, nombre: product.nombre, imagen: product.imagenUrl, atributos: selectedAttributes, color: selectedColor, cantidad: quantity, precioUnitario: unitPrice, total: totalPrice });
    setAddedToQuote(true);
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-secondary/35 backdrop-blur-md z-[100] flex items-center justify-center p-0 lg:p-6 overflow-hidden">
      <div className="bg-[#F8FAFA] w-full max-w-5xl h-dvh lg:h-auto lg:max-h-[90vh] lg:my-auto rounded-none lg:rounded-[2.5rem] border border-white shadow-2xl overflow-hidden relative animate-in zoom-in duration-300 flex flex-col">
        <div className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-[#F8FAFA] border-b border-primary/10">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl text-secondary hover:bg-white transition-colors"><ArrowLeft size={20} /><span className="text-xs font-black uppercase tracking-widest">Volver</span></button>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] truncate px-2">Detalle del producto</span>
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl bg-white text-secondary hover:bg-gray-100 transition-colors"><X size={20} /></button>
        </div>

        <button onClick={onClose} className="hidden lg:block absolute top-5 right-5 z-50 p-3 bg-white/80 hover:bg-white rounded-full text-secondary shadow-md transition-all" aria-label="Cerrar detalle"><X size={22} /></button>

        <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="bg-[#EEF4F3] p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center space-y-6 border-b lg:border-b-0 lg:border-r border-primary/10">
            {imagesList.length > 0 && (
              <button type="button" onClick={() => setIsImageZoomed(true)} className="relative w-full aspect-square max-w-[400px] cursor-zoom-in group rounded-3xl overflow-hidden bg-white/60 border border-white shadow-sm" aria-label="Ampliar imagen del producto">
                <img src={imagesList[activeImageIndex]} alt={product.nombre} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]" />
                <span className="absolute bottom-4 right-4 bg-white/90 text-secondary px-3 py-2 rounded-xl shadow-md text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"><Maximize2 size={13} /> Ampliar</span>
              </button>
            )}
            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto w-full max-w-[400px] no-scrollbar justify-center">
                {imagesList.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-primary scale-110 shadow-md" : "border-white hover:border-primary/30 opacity-70 hover:opacity-100"}`} aria-label={`Ver imagen ${idx + 1}`}><img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" /></button>
                ))}
              </div>
            )}
            <div className="bg-white px-5 py-2.5 rounded-2xl border border-primary/10 flex items-center gap-2 shadow-sm"><ShieldCheck size={18} className="text-primary" /><span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Calidad SubliMod</span></div>
          </div>

          <div className="p-6 sm:p-8 lg:p-12 space-y-10 lg:max-h-[90vh] lg:overflow-y-auto no-scrollbar bg-[#F8FAFA]">
            <div>
              <div className="flex items-center gap-2 mb-3"><span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">{product.categoria}</span></div>
              <h2 className="text-3xl lg:text-4xl font-black text-secondary uppercase tracking-tighter leading-tight">{product.nombre}</h2>
              {product.descripcion && <p className="text-gray-600 text-sm mt-4 leading-relaxed italic">{product.descripcion}</p>}
            </div>

            <div className="space-y-8">
              {product.atributos && Object.entries(product.atributos).map(([key, options]: any) => (
                <div key={key} className="space-y-4"><label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{key}</label><div className="flex flex-wrap gap-2">{options.map((opt: string) => { const isSelected = selectedAttributes[key] === opt; return <button key={opt} onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: opt }))} className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white border-gray-200 text-gray-600 hover:border-primary/30"}`}>{isSelected && <Check size={14} />}{opt}</button>; })}</div></div>
              ))}

              {product.colores?.length > 0 && <div className="space-y-4"><label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Variante de Diseño</label><div className="flex flex-wrap gap-3">{product.colores.map((color: any) => { const isSelected = selectedColor?.name === color.name; return <button key={color.name} onClick={() => setSelectedColor(color)} className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl border transition-all ${isSelected ? "border-primary bg-primary/10" : "border-gray-200 bg-white"}`}><div className="w-8 h-8 rounded-xl shadow-inner border border-black/10" style={{ backgroundColor: color.hex }} /><span className={`text-[10px] font-bold uppercase ${isSelected ? "text-secondary" : "text-gray-500"}`}>{color.name}</span></button>; })}</div></div>}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-primary/10 space-y-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-3 w-full md:w-auto"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center md:text-left">Cantidad</label><div className="flex items-center justify-between bg-[#F8FAFA] border border-gray-200 rounded-2xl p-1"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-gray-500 hover:text-secondary" aria-label="Disminuir"><Minus size={20} /></button><span className="text-xl font-black text-primary w-12 text-center">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-3 text-gray-500 hover:text-secondary" aria-label="Aumentar"><Plus size={20} /></button></div></div>
                <div className="text-center md:text-right"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Estimado</label><div className="text-4xl font-black text-accent tracking-tighter leading-none">C$ {totalPrice}</div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 block">C$ {unitPrice} por unidad</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={handleDirectOrder} className="bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95"><MessageCircle size={20} /> Personalizar y Pedir</button><button onClick={handleAddToQuote} className={`py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${addedToQuote ? "bg-green-500/10 border-green-500 text-green-500" : "bg-white border-gray-200 text-secondary hover:bg-gray-50"}`}>{addedToQuote ? <><Check size={20} /> ¡Añadido!</> : <><ShoppingCart size={20} /> Añadir a Cotización</>}</button></div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 border-t border-primary/10 pt-8"><div className="flex items-center gap-3 text-gray-600"><Truck size={18} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest">Envíos Cargo Trans / Interlocal</span></div><div className="flex items-center gap-3 text-gray-600"><Info size={18} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest">Jinotega, Nicaragua</span></div></div>
          </div>
        </div>
      </div>

      {isImageZoomed && imagesList.length > 0 && (
        <div className="fixed inset-0 z-[300] bg-secondary/80 backdrop-blur-lg flex items-center justify-center p-4" onClick={() => setIsImageZoomed(false)} role="dialog" aria-modal="true" aria-label="Imagen ampliada">
          <button type="button" onClick={() => setIsImageZoomed(false)} className="absolute top-5 right-5 z-10 w-12 h-12 rounded-full bg-white text-secondary shadow-xl flex items-center justify-center hover:bg-gray-100" aria-label="Cerrar imagen"><X size={24} /></button>
          <img src={imagesList[activeImageIndex]} alt={product.nombre} className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ProductDetailModal;