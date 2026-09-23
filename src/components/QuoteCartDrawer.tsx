"use client";
import React, { useMemo, useState, useEffect } from "react";
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
  const productGroups = useMemo(() => {
    const groups = new Map<string, typeof cartItems>();
    cartItems.forEach((item) => {
      const current = groups.get(item.productId) || [];
      current.push(item);
      groups.set(item.productId, current);
    });
    return Array.from(groups.values()).map((items) => {
      const first = items[0];
      const totalQuantity = items.reduce((sum, item) => sum + item.cantidad, 0);
      const scale = getApplicablePriceScale(first.escalasPrecios, totalQuantity);
      const unitPrice = scale?.price ?? first.precioUnitario;
      const basePrice = Number(first.escalasPrecios?.[0]?.price) || unitPrice;
      const commonAttributes = Object.entries(first.atributos || {}).filter(([key, value]) =>
        items.every((item) => item.atributos?.[key] === value)
      );
      const commonKeys = new Set(commonAttributes.map(([key]) => key));
      const variants = items.map((item) => ({
        item,
        attributes: Object.entries(item.atributos || {}).filter(([key]) => !commonKeys.has(key)),
      }));
      return {
        productId: first.productId, nombre: first.nombre, imagen: first.imagen, items,
        totalQuantity, scale, unitPrice, basePrice,
        savingsPerUnit: Math.max(0, basePrice - unitPrice),
        total: items.reduce((sum, item) => sum + item.total, 0),
        commonAttributes, variants,
      };
    });
  }, [cartItems]);

  const totalQuote = cartItems.reduce((acc, item) => acc + (item.total || 0), 0);

  const handleSendFullQuote = () => {
    if (productGroups.length === 0) return;

    const itemsList = productGroups.map((group, index) => {
      const common = group.commonAttributes.length
        ? group.commonAttributes.map(([key, value]) => `   • ${key}: ${value}`).join("\n") + "\n"
        : "";
      const variants = group.variants.map(({ item, attributes }) => {
        const variantLabel = attributes.length ? attributes.map(([, value]) => value).join(" / ") : "Variante seleccionada";
        return `   • ${variantLabel} ×${item.cantidad}`;
      }).join("\n");
      const scaleLabel = group.scale ? (group.scale.max == null ? `Desde ${group.scale.min} uds` : `${group.scale.min}–${group.scale.max} uds`) : "";
      const discountLine = group.savingsPerUnit > 0 ? `\n   • Ahorro por cantidad: C$ ${group.savingsPerUnit * group.totalQuantity}` : "";
      const link = `${window.location.origin}/producto/${group.productId}`;
      return `*${index + 1}. ${group.nombre.toUpperCase()}* — ${group.totalQuantity} uds
${common}${variants}
   • Precio aplicado: C$ ${group.unitPrice} c/u
   • Subtotal: C$ ${group.total}${scaleLabel ? `\n   • Escala: ${scaleLabel}` : ""}${discountLine}
   • Ver producto: ${link}`;
    }).join("\n\n");

    const message = `¡Hola SubliMod! 👋 Deseo solicitar la cotización de mi carrito.

----------------------------------
*DETALLE DE LOS PRODUCTOS*
----------------------------------

${itemsList}

----------------------------------
💰 *TOTAL ESTIMADO:* C$ ${totalQuote}

El precio por cantidad se calcula sobre el total de unidades de cada producto, combinando sus variantes. Los productos diferentes se calculan por separado.

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
                productGroups.map((group) => (
                  <div key={group.productId} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex gap-3">
                      <img src={group.imagen} alt={group.nombre} className="w-16 h-16 object-cover rounded-xl bg-black/20" />
                      <div className="flex-grow min-w-0">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{group.nombre}</h4>
                        <p className="text-[9px] text-gray-400 mt-1">{group.totalQuantity} unidades · {group.items.length} variante{group.items.length === 1 ? "" : "s"}</p>
                        {group.commonAttributes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {group.commonAttributes.map(([key, value]) => (
                              <span key={key} className="bg-white/5 px-2 py-0.5 rounded-[4px] border border-white/5 text-[8px] uppercase text-gray-400">{key}: {value}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/10 border border-white/5 p-3 space-y-2">
                      {group.variants.map(({ item, attributes }) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-[9px]">
                          <div className="min-w-0">
                            <p className="text-gray-300 font-bold">{attributes.length ? attributes.map(([, value]) => value).join(" / ") : "Variante seleccionada"} ×{item.cantidad}</p>
                            <p className="text-gray-500">C$ {group.unitPrice} c/u · C$ {item.total}</p>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="shrink-0 text-gray-600 hover:text-red-500 transition-colors p-1" aria-label={`Eliminar variante de ${group.nombre}`}><Trash2 size={15} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Precio por cantidad</p><p className="text-xs font-black text-white">C$ {group.unitPrice} <span className="text-[9px] text-gray-500">por unidad</span></p></div>
                        {group.scale && <span className="text-[8px] font-bold uppercase text-primary">{group.scale.max == null ? `Desde ${group.scale.min} uds` : `${group.scale.min}–${group.scale.max} uds`}</span>}
                      </div>
                      {group.savingsPerUnit > 0 && <p className="mt-2 text-[8px] font-bold text-primary">Ahorro estimado: C$ {group.savingsPerUnit * group.totalQuantity}</p>}
                      <p className="mt-2 text-[8px] leading-relaxed text-gray-500">Las variantes de este producto se acumulan para determinar el precio aplicable.</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-3"><span className="text-[9px] font-black uppercase text-gray-500">Subtotal</span><span className="text-sm font-black text-accent">C$ {group.total}</span></div>
                  </div>
                ))
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