"use client";
import React, { useState, useEffect } from "react";
import { ShoppingBag, ShoppingCart, X, Trash2, MessageCircle, Package } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useCartStore } from "@/store/useCartStore";
import { getApplicablePriceScale } from "@/lib/pricing";

const QuoteCartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("86153695");
  
  // Conexión a Zustand
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

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

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openSublimodCart", handleOpen);
    return () => window.removeEventListener("openSublimodCart", handleOpen);
  }, []);

  const productQuantities = cartItems.reduce<Record<string, number>>((totals, item) => { totals[item.productId] = (totals[item.productId] || 0) + item.cantidad; return totals; }, {});
  const totalQuote = cartItems.reduce((acc, item) => acc + (item.total || 0), 0);

  const handleSendFullQuote = () => {
    if (cartItems.length === 0) return;

    let itemsList = "";
    const productSummaries = new Map<string, { nombre: string; cantidad: number; escala: any; precio: number; basePrice: number }>();

    cartItems.forEach((item) => {
      const productQuantity = productQuantities[item.productId] || item.cantidad;
      const scale = getApplicablePriceScale(item.escalasPrecios, productQuantity);
      const baseScale = Array.isArray(item.escalasPrecios) && item.escalasPrecios.length
        ? item.escalasPrecios[0]
        : null;

      if (!productSummaries.has(item.productId)) {
        productSummaries.set(item.productId, {
          nombre: item.nombre,
          cantidad: productQuantity,
          escala: scale,
          precio: item.precioUnitario,
          basePrice: Number(baseScale?.price) || item.precioUnitario,
        });
      }
    });

    cartItems.forEach((item, idx) => {
      const attrString = item.atributos
        ? Object.entries(item.atributos)
            .map(([k, v]) => `   • ${k}: ${v}`)
            .join("\n")
        : "";
      const legacyColor = item.color?.name ? `\n   • Variante: ${item.color.name}` : "";
      const productLink = `${window.location.origin}/producto/${item.productId}`;

      itemsList += `
*${idx + 1}. ${item.nombre.toUpperCase()}* — ${item.cantidad} uds
${attrString}${legacyColor}
   • Precio por unidad: C$ ${item.precioUnitario}
   • Subtotal de esta variante: C$ ${item.total}
   • Ver producto: ${productLink}
`;
    });

    const summaries = Array.from(productSummaries.values())
      .map((summary) => {
        const discount = Math.max(0, summary.basePrice - summary.precio);
        const savings = discount * summary.cantidad;
        if (!summary.escala || discount <= 0) {
          return `• ${summary.nombre}: ${summary.cantidad} unidades — C$ ${summary.precio}/unidad`;
        }
        const scaleLabel = summary.escala.max == null
          ? `desde ${summary.escala.min} unidades`
          : `${summary.escala.min}–${summary.escala.max} unidades`;
        return `• ${summary.nombre}: ${summary.cantidad} unidades en total, combinando sus variantes.
  Escala aplicada: ${scaleLabel} → C$ ${summary.precio}/unidad.
  Ahorro estimado por cantidad: C$ ${savings}.`;
      })
      .join("\n");

    const message = `¡Hola SubliMod! 👋 Deseo solicitar la cotización de mi carrito:

----------------------------------
*DETALLE DE LOS PRODUCTOS*
----------------------------------
${itemsList}
----------------------------------
*PRECIO POR CANTIDAD*
----------------------------------
${summaries}

----------------------------------
💰 *TOTAL ESTIMADO:* C$ ${totalQuote}

Los precios por cantidad se calculan sobre el total de unidades del mismo producto, aunque correspondan a diferentes variantes. Los productos diferentes se calculan por separado.

Jinotega, Nicaragua.`;

    window.open(`https://wa.me/505${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <a
        href={`https://wa.me/505${whatsappNumber}?text=${encodeURIComponent("¡Hola SubliMod! 👋 Tengo una consulta técnica.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center border-4 border-white/10"
        title="Consultar por WhatsApp"
      >
        <MessageCircle size={32} fill="currentColor" />
      </a>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex justify-end animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] w-full max-w-md h-full border-l border-white/10 flex flex-col justify-between p-6 shadow-2xl relative animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2.5 rounded-xl text-primary"><ShoppingBag size={20} /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><ShoppingCart className="text-accent" size={24} /> Mi Cotización</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">SubliMod Jinotega</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"><X size={24} /></button>
            </div>

            <div className="flex-grow overflow-y-auto my-6 space-y-4 no-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="p-10 bg-white/5 rounded-[3rem] border border-dashed border-white/10"><Package size={60} className="text-gray-600" /></div>
                  <p className="text-sm font-black uppercase tracking-widest text-gray-500">Carrito vacío</p>
                </div>
              ) : (
                cartItems.map((item) => {
                  const productQuantity = productQuantities[item.productId] || item.cantidad;
                  const scale = getApplicablePriceScale(item.escalasPrecios, productQuantity);
                  return (
                  <div key={item.id} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex gap-4 relative group">
                    <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover rounded-xl bg-black/20" />
                    <div className="flex-grow">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{item.nombre}</h4>
                      <div className="text-[9px] text-gray-500 mt-1">
                        <p className="mb-1 text-primary font-bold">Cant: {item.cantidad} uds | C$ {item.precioUnitario} c/u</p><p className="mb-1 text-[8px] font-black uppercase text-gray-400">Total de este producto: {productQuantity} uds{scale ? ` · Escala ${scale.max == null ? `desde ${scale.min}` : `${scale.min}–${scale.max}`}` : ""}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.atributos && Object.entries(item.atributos).map(([k, v]: any) => (
                            <span key={k} className="bg-white/5 px-2 py-0.5 rounded-[4px] border border-white/5 uppercase">{k}: {v}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs font-black text-accent mt-2">C$ {item.total}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                  </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/5 pt-6 space-y-6">
              <div className="flex justify-between items-end">
                <div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Estimado</span><span className="text-3xl font-black text-white tracking-tighter">C$ {totalQuote}</span></div>
              </div>
              <button
                disabled={cartItems.length === 0}
                onClick={handleSendFullQuote}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <MessageCircle size={18} /> Solicitar Cotización
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default QuoteCartDrawer;