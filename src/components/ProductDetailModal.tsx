"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Check, Info, Maximize2, MessageCircle, Minus, Plus,
  ShieldCheck, ShoppingCart, Truck, X,
} from "lucide-react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";

interface ProductDetailModalProps { product: any; onClose: () => void; }

type ProductAttribute = { atributoId: string; valores: string[]; definition?: any };

const normalizeOption = (value: any): string | null => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.nombre === "string") return value.nombre;
    if (typeof value.valor === "string") return value.valor;
    if (typeof value.name === "string") return value.name;
  }
  return null;
};

const normalizeValues = (value: any): string[] => {
  const source = Array.isArray(value) ? value : [value];
  return source.flatMap((item) => {
    if (item && typeof item === "object" && Array.isArray(item.valores)) return normalizeValues(item.valores);
    const normalized = normalizeOption(item);
    return normalized ? [normalized] : [];
  });
};

const ProductDetailModal = ({ product, onClose }: ProductDetailModalProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState("86153695");
  const [attributeDefinitions, setAttributeDefinitions] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToQuote, setAddedToQuote] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (snap) => {
      const whatsapp = snap.exists() ? snap.data().whatsapp : null;
      if (whatsapp) setWhatsappNumber(String(whatsapp).trim());
    });
    const unsubAttrs = onSnapshot(collection(db, "atributos_globales"), (snap) => {
      setAttributeDefinitions(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    return () => { unsubConfig(); unsubAttrs(); };
  }, []);

  const imagesList = useMemo(() => {
    if (Array.isArray(product.imagenes) && product.imagenes.length) return product.imagenes;
    return product.imagenUrl ? [product.imagenUrl] : [];
  }, [product]);

  const productAttributes = useMemo<ProductAttribute[]>(() => {
    if (Array.isArray(product.atributos)) {
      return product.atributos
        .map((attribute: any) => ({
          atributoId: typeof attribute.atributoId === "string" ? attribute.atributoId : "",
          valores: normalizeValues(attribute.valores),
          definition: attributeDefinitions.find((definition) => definition.id === attribute.atributoId),
        }))
        .filter((attribute: ProductAttribute) => attribute.atributoId && attribute.valores.length > 0);
    }

    if (!product.atributos || typeof product.atributos !== "object") return [];

    return Object.entries(product.atributos).flatMap(([key, rawValues]: [string, any]) => {
      if (rawValues && typeof rawValues === "object" && !Array.isArray(rawValues) && rawValues.atributoId) {
        const atributoId = String(rawValues.atributoId);
        return [{
          atributoId,
          valores: normalizeValues(rawValues.valores),
          definition: attributeDefinitions.find((definition) => definition.id === atributoId),
        }];
      }
      return [{
        atributoId: key,
        valores: normalizeValues(rawValues),
        definition: attributeDefinitions.find((definition) => definition.id === key || definition.nombreAtributo === key),
      }];
    }).filter((attribute: ProductAttribute) => attribute.atributoId && attribute.valores.length > 0);
  }, [product, attributeDefinitions]);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsImageZoomed(false);
    const defaults: Record<string, string> = {};
    productAttributes.forEach((attribute) => { if (attribute.valores.length) defaults[attribute.atributoId] = attribute.valores[0]; });
    setSelectedAttributes(defaults);
    setSelectedColor(Array.isArray(product.colores) && product.colores.length ? product.colores[0] : null);
  }, [product, productAttributes]);

  const unitPrice = useMemo(() => {
    if (!Array.isArray(product.escalasPrecios) || !product.escalasPrecios.length) return 0;
    const escala = product.escalasPrecios.find((item: any) => quantity >= item.min && quantity <= item.max);
    return escala ? Number(escala.price) || 0 : Number(product.escalasPrecios[product.escalasPrecios.length - 1].price) || 0;
  }, [quantity, product.escalasPrecios]);

  const totalPrice = unitPrice * quantity;

  const handleDirectOrder = () => {
    const attrString = productAttributes
      .map((attribute) => `• *${attribute.definition?.nombreAtributo || "Atributo"}:* ${selectedAttributes[attribute.atributoId] || "N/A"}`)
      .join("\n");
    const message = `¡Hola SubliMod! Me interesa este producto:\n\n- *Producto:* ${product.nombre}\n- *Cantidad:* ${quantity} unidades\n${attrString}\n- *Variante/Color:* ${selectedColor?.name || "N/A"}\n\n- *Precio Unitario:* C$ ${unitPrice}\n- *Total Estimado:* C$ ${totalPrice}\n\n_Enlace del producto:_ ${window.location.origin}/producto/${product.id}\nQuedo a la espera de su respuesta para coordinar el diseño.`;
    window.open(`https://wa.me/505${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAddToQuote = () => {
    addItem({ id: `${product.id}-${Date.now()}`, productId: product.id, nombre: product.nombre, imagen: product.imagenUrl, atributos: selectedAttributes, color: selectedColor, cantidad: quantity, precioUnitario: unitPrice, total: totalPrice });
    setAddedToQuote(true);
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-secondary/35 p-0 backdrop-blur-md lg:p-6">
      <div className="relative flex h-dvh w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white bg-[#F8FAFA] shadow-2xl animate-in zoom-in duration-300 lg:my-auto lg:h-auto lg:max-h-[90vh] lg:rounded-[2.5rem]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/10 bg-[#F8FAFA] px-4 py-3 lg:hidden">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-secondary"><ArrowLeft size={20}/><span className="text-xs font-black uppercase tracking-widest">Volver</span></button>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Detalle del producto</span>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white" aria-label="Cerrar detalle"><X size={20}/></button>
        </div>
        <button type="button" onClick={onClose} className="absolute right-5 top-5 z-50 hidden rounded-full bg-white/80 p-3 text-secondary shadow-md lg:block" aria-label="Cerrar detalle"><X size={22}/></button>
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <div className="flex flex-col items-center justify-center space-y-6 border-b border-primary/10 bg-[#EEF4F3] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
            {imagesList.length > 0 && <button type="button" onClick={() => setIsImageZoomed(true)} className="group relative aspect-square w-full max-w-[400px] cursor-zoom-in overflow-hidden rounded-3xl border border-white bg-white/60"><img src={imagesList[activeImageIndex]} alt={product.nombre} className="h-full w-full object-contain p-4"/><span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[9px] font-black uppercase text-secondary opacity-0 shadow-md transition-opacity group-hover:opacity-100"><Maximize2 size={13}/> Ampliar</span></button>}
            {imagesList.length > 1 && <div className="flex w-full max-w-[400px] gap-3 overflow-x-auto justify-center">{imagesList.map((image: string, index: number) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImageIndex(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${activeImageIndex === index ? "scale-110 border-primary" : "border-white opacity-70"}`}><img src={image} alt="" className="h-full w-full object-cover"/></button>)}</div>}
            <div className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-white px-5 py-2.5"><ShieldCheck size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase text-secondary">Calidad SubliMod</span></div>
          </div>
          <div className="space-y-10 overflow-visible bg-[#F8FAFA] p-6 sm:p-8 lg:max-h-[90vh] lg:overflow-y-auto lg:p-12">
            <div><div className="mb-3 flex items-center gap-2"><span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase text-primary">{product.categoria}</span></div><h2 className="text-3xl font-black uppercase tracking-tighter text-secondary lg:text-4xl">{product.nombre}</h2>{product.descripcion && <p className="mt-4 text-sm italic leading-relaxed text-gray-600">{product.descripcion}</p>}</div>
            <div className="space-y-8">
              {productAttributes.map((attribute) => <div key={attribute.atributoId} className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{attribute.definition?.nombreAtributo || "Atributo"}</label><div className="flex flex-wrap gap-2">{attribute.valores.map((option) => { const selected = selectedAttributes[attribute.atributoId] === option; return <button type="button" key={option} onClick={() => setSelectedAttributes((previous) => ({...previous, [attribute.atributoId]: option}))} className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all ${selected ? "border-primary bg-primary text-white shadow-lg" : "border-gray-200 bg-white text-gray-600"}`}>{selected && <Check size={14}/>} {option}</button>; })}</div></div>)}
              {Array.isArray(product.colores) && product.colores.length > 0 && <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Variante de Diseño</label><div className="flex flex-wrap gap-3">{product.colores.map((color: any) => { const selected = selectedColor?.name === color.name; return <button type="button" key={color.name} onClick={() => setSelectedColor(color)} className={`flex items-center gap-3 rounded-2xl border p-1.5 pr-4 ${selected ? "border-primary bg-primary/10" : "border-gray-200 bg-white"}`}><div className="h-8 w-8 rounded-xl border" style={{backgroundColor: color.hex}}/><span className="text-[10px] font-bold uppercase">{color.name}</span></button>; })}</div></div>}
            </div>
            <div className="space-y-8 rounded-[2rem] border border-primary/10 bg-white p-6 sm:p-8"><div className="flex flex-col items-center justify-between gap-6 md:flex-row"><div className="w-full space-y-3 md:w-auto"><label className="block text-[10px] font-black uppercase text-gray-500">Cantidad</label><div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-[#F8FAFA] p-1"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3"><Minus size={20}/></button><span className="w-12 text-center text-xl font-black text-primary">{quantity}</span><button type="button" onClick={() => setQuantity((current) => current + 1)} className="p-3"><Plus size={20}/></button></div></div><div className="text-center md:text-right"><label className="block text-[10px] font-black uppercase text-gray-500">Total Estimado</label><div className="text-4xl font-black text-accent">C$ {totalPrice}</div><span className="text-[10px] font-bold uppercase text-gray-500">C$ {unitPrice} por unidad</span></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><button type="button" onClick={handleDirectOrder} className="flex items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-sm font-black uppercase tracking-widest text-white"><MessageCircle size={20}/> Personalizar y Pedir</button><button type="button" onClick={handleAddToQuote} className={`flex items-center justify-center gap-3 rounded-2xl border-2 py-5 text-sm font-black uppercase ${addedToQuote ? "border-green-500 bg-green-500/10 text-green-500" : "border-gray-200 bg-white text-secondary"}`}>{addedToQuote ? <><Check size={20}/> ¡Añadido!</> : <><ShoppingCart size={20}/> Añadir a Cotización</>}</button></div></div>
            <div className="flex flex-col gap-6 border-t border-primary/10 pt-8 md:flex-row"><div className="flex items-center gap-3 text-gray-600"><Truck size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase">Envíos Cargo Trans / Interlocal</span></div><div className="flex items-center gap-3 text-gray-600"><Info size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase">Jinotega, Nicaragua</span></div></div>
          </div>
        </div>
        {isImageZoomed && imagesList.length > 0 && <div className="fixed inset-0 z-[300] flex items-center justify-center bg-secondary/80 p-4 backdrop-blur-lg" onClick={() => setIsImageZoomed(false)}><button type="button" onClick={() => setIsImageZoomed(false)} className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-xl" aria-label="Cerrar imagen ampliada"><X size={24}/></button><img src={imagesList[activeImageIndex]} alt={product.nombre} className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain" onClick={(event) => event.stopPropagation()}/></div>}
      </div>
    </div>
  );
};

export default ProductDetailModal;
