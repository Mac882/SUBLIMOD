"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, MessageCircle, ShoppingCart, Check, Minus, Plus, Truck, ShieldCheck, Info } from "lucide-react";
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

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.whatsapp) {
          setWhatsappNumber(data.whatsapp.trim());
        }
      }
    });
    return () => unsubConfig();
  }, []);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToQuote, setAddedToQuote] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const imagesList = useMemo(() => {
    return product.imagenes?.length > 0 
      ? product.imagenes 
      : (product.imagenUrl ? [product.imagenUrl] : []);
  }, [product]);

  useEffect(() => {
    if (product.atributos) {
      const defaults: Record<string, string> = {};
      Object.entries(product.atributos).forEach(([key, options]: any) => {
        if (options && options.length > 0) {
          defaults[key] = options[0];
        }
      });
      setSelectedAttributes(defaults);
    }
    if (product.colores && product.colores.length > 0) {
      setSelectedColor(product.colores[0]);
    }
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!product.escalasPrecios || product.escalasPrecios.length === 0) return 0;
    const escala = product.escalasPrecios.find(
      (e: any) => quantity >= e.min && quantity <= e.max
    );
    return escala ? escala.price : product.escalasPrecios[product.escalasPrecios.length - 1].price;
  }, [quantity, product.escalasPrecios]);

  const totalPrice = unitPrice * quantity;

  const handleDirectOrder = () => {
    const attrString = Object.entries(selectedAttributes)
      .map(([key, val]) => `• *${key}:* ${val}`)
      .join("\n");

    const message = `¡Hola SubliMod! Me interesa este producto:

- *Producto:* ${product.nombre}
- *Cantidad:* ${quantity} unidades
${attrString}
- *Variante/Color:* ${selectedColor?.name || "N/A"}

- *Precio Unitario:* C$ ${unitPrice}
- *Total Estimado:* C$ ${totalPrice}

_Enlace del producto:_ ${window.location.origin}/producto/${product.id}
Quedo a la espera de su respuesta para coordinar el diseño.`;

    const url = `https://wa.me/505${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleAddToQuote = () => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      nombre: product.nombre,
      imagen: product.imagenUrl,
      atributos: selectedAttributes,
      color: selectedColor,
      cantidad: quantity,
      precioUnitario: unitPrice,
      total: totalPrice
    });

    setAddedToQuote(true);
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] w-full max-w-5xl my-auto rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-50 p-3 bg-black/20 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          <div className="bg-[#121212] p-8 lg:p-12 flex flex-col items-center justify-center space-y-6">
            
            {imagesList.length > 0 && (
              <div className="relative w-full aspect-square max-w-[380px]">
                <img 
                  src={imagesList[activeImageIndex]} 
                  alt={product.nombre} 
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all" 
                />
              </div>
            )}
            
            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto w-full max-w-[380px] no-scrollbar justify-center">
                {imagesList.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary scale-110' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Calidad SubliMod</span>
            </div>

          </div>

          <div className="p-8 lg:p-12 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                  {product.categoria}
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                {product.nombre}
              </h2>
              <p className="text-gray-500 text-sm mt-4 leading-relaxed italic">
                {product.descripcion || "Personalización premium diseñada para capturar tus mejores momentos."}
              </p>
            </div>

            <div className="space-y-8">
              {product.atributos && Object.entries(product.atributos).map(([key, options]: any) => (
                <div key={key} className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{key}</label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt: string) => {
                      const isSelected = selectedAttributes[key] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: opt }))}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            isSelected 
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                              : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {product.colores && product.colores.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Variante de Diseño</label>
                  <div className="flex flex-wrap gap-3">
                    {product.colores.map((color: any) => {
                      const isSelected = selectedColor?.name === color.name;
                      return (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color)}
                          className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl border transition-all ${
                            isSelected ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-xl shadow-inner border border-black/20" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-white" : "text-gray-500"}`}>
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#121212] p-8 rounded-[2rem] border border-white/5 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-3 w-full md:w-auto">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center md:text-left">Cantidad</label>
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-1">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-xl font-black text-primary w-12 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Estimado</label>
                  <div className="text-4xl font-black text-accent tracking-tighter leading-none">
                    C$ {totalPrice}
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 block">
                    C$ {unitPrice} por unidad
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleDirectOrder}
                  className="bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <MessageCircle size={20} /> Personalizar y Pedir
                </button>
                
                <button
                  onClick={handleAddToQuote}
                  className={`py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${
                    addedToQuote 
                      ? "bg-green-500/10 border-green-500 text-green-500" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {addedToQuote ? (
                    <> <Check size={20} /> ¡Añadido! </>
                  ) : (
                    <> <ShoppingCart size={20} /> Añadir a Cotización </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 border-t border-white/5 pt-8">
              <div className="flex items-center gap-3 text-gray-500">
                <Truck size={18} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Envíos Cargo Trans / Interlocal</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <Info size={18} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Jinotega, Nicaragua</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;