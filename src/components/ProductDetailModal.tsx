"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Info, Maximize2, MessageCircle, Minus, Plus,
  ShieldCheck, Shirt, ShoppingCart, Truck, X,
} from "lucide-react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";
import { ProductVariantCombination, ProductVariantGroup } from "@/types/productVariants";
import { getApplicablePriceScale, getUnitPriceByQuantity } from "@/lib/pricing";

interface ProductDetailModalProps { product: any; onClose: () => void; }

type ProductAttribute = { atributoId: string; valores: string[]; definition?: any };
type ProductMediaThumbnail =
  | { id: string; image: string; type: "gallery"; label: string }
  | { id: string; image: string; type: "variant"; combination: ProductVariantCombination; label: string };

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

const shirtCustomizationLocations = ["Pecho", "Espalda", "Mangas"];

const getVariantImage = (
  combination: ProductVariantCombination,
  groups: ProductVariantGroup[],
) => {
  if (combination.imagenUrl) return combination.imagenUrl;

  for (const group of groups) {
    const option = group.opciones.find((item) => item.id === combination.opciones[group.id]);
    if (option?.imagenUrl) return option.imagenUrl;
  }

  return "";
};

const ProductDetailModal = ({ product, onClose }: ProductDetailModalProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState("86153695");
  const [attributeDefinitions, setAttributeDefinitions] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addedToQuote, setAddedToQuote] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewingGalleryImage, setIsViewingGalleryImage] = useState(true);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isPricingInfoOpen, setIsPricingInfoOpen] = useState(false);
  const [shirtLocations, setShirtLocations] = useState<string[]>([]);
  const [shirtCustomLocation, setShirtCustomLocation] = useState("");
  const zoomTouchStartX = useRef<number | null>(null);
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

  const normalizedProductCategory = String(product.categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const isShirtProduct = normalizedProductCategory.includes("camiseta");
  const canBrowsePersonalizedShirts = normalizedProductCategory === "camiseta" || normalizedProductCategory === "camisetas";

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
    setIsViewingGalleryImage(true);
    setIsImageZoomed(false);
    setShirtLocations([]);
    setShirtCustomLocation("");
    const defaults: Record<string, string> = {};
    productAttributes.forEach((attribute) => { if (attribute.valores.length) defaults[attribute.atributoId] = attribute.valores[0]; });
    setSelectedAttributes(defaults);
    setSelectedColor(Array.isArray(product.colores) && product.colores.length ? product.colores[0] : null);
  }, [product, productAttributes]);

  const variantConfig = useMemo(() => product.variantes?.habilitado ? product.variantes : null, [product]);
  const variantGroups = useMemo<ProductVariantGroup[]>(() => Array.isArray(variantConfig?.grupos) ? variantConfig.grupos : [], [variantConfig]);
  const variantCombinations = useMemo<ProductVariantCombination[]>(() => Array.isArray(variantConfig?.combinaciones) ? variantConfig.combinaciones.filter((combo: ProductVariantCombination) => combo.activo !== false) : [], [variantConfig]);
  const selectedCombination = useMemo(() => {
    if (!variantGroups.length || !variantCombinations.length) return null;
    return variantCombinations.find(combo => variantGroups.every(group => {
      if (group.requerido === false && !selectedVariantOptions[group.id]) return true;
      return Boolean(selectedVariantOptions[group.id]) && combo.opciones[group.id] === selectedVariantOptions[group.id];
    })) || null;
  }, [variantGroups, variantCombinations, selectedVariantOptions]);
  const usesCombinationPrice = Boolean(
    variantConfig?.preciosPorCombinacion && Number.isFinite(selectedCombination?.precioUnitario),
  );
  const priceScales = useMemo(() => usesCombinationPrice
    ? [{ min: 1, max: null, price: Number(selectedCombination?.precioUnitario) }]
    : (Array.isArray(product.escalasPrecios) ? product.escalasPrecios : []),
  [product.escalasPrecios, selectedCombination?.precioUnitario, usesCombinationPrice]);
  const unitPrice = useMemo(
    () => getUnitPriceByQuantity(priceScales, quantity),
    [priceScales, quantity],
  );
  const activePriceScale = useMemo(
    () => getApplicablePriceScale(priceScales, quantity),
    [priceScales, quantity],
  );
  const hasQuantityScales = !usesCombinationPrice && priceScales.length > 1;

  const availableVariantOptions = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    variantGroups.forEach(group => {
      result[group.id] = new Set(group.opciones.map(option => option.id));
    });

    variantGroups.forEach(group => {
      if (!group.dependeDe) return;
      const parentValue = selectedVariantOptions[group.dependeDe];
      if (!parentValue) return;
      const compatible = group.opciones
        .filter(option => !option.disponiblePara?.length || option.disponiblePara.includes(parentValue))
        .map(option => option.id);
      result[group.id] = new Set(compatible);
    });

    return result;
  }, [variantGroups, selectedVariantOptions]);

  const selectedVariantImage = useMemo(() => {
    if (!selectedCombination) return null;
    return getVariantImage(selectedCombination, variantGroups) || null;
  }, [selectedCombination, variantGroups]);
  const mediaThumbnails = useMemo<ProductMediaThumbnail[]>(() => {
    const galleryItems = imagesList.map((image: string, index: number) => ({
      id: `gallery-${index}`,
      image,
      type: "gallery" as const,
      label: `Imagen ${index + 1} de la galería`,
    }));
    const variantItems = variantCombinations
      .map((combination) => ({
        id: `variant-${combination.id}`,
        image: getVariantImage(combination, variantGroups),
        type: "variant" as const,
        combination,
        label: combination.nombre || "Variante del producto",
      }))
      .filter((item) => Boolean(item.image));

    return [...galleryItems, ...variantItems];
  }, [imagesList, variantCombinations, variantGroups]);
  const activeGalleryImage = imagesList[activeImageIndex] || imagesList[0] || "";
  const visibleImage = isViewingGalleryImage
    ? activeGalleryImage
    : selectedVariantImage || activeGalleryImage;
  const activeMediaIndex = useMemo(() => {
    if (isViewingGalleryImage) {
      return mediaThumbnails.findIndex((item) => item.id === `gallery-${activeImageIndex}`);
    }
    return mediaThumbnails.findIndex((item) => item.type === "variant" && item.combination.id === selectedCombination?.id);
  }, [activeImageIndex, isViewingGalleryImage, mediaThumbnails, selectedCombination]);
  const variantPrice = unitPrice;
  const totalPrice = variantPrice * quantity;

  const selectMediaThumbnail = (item: ProductMediaThumbnail) => {
    if (item.type === "gallery") {
      setActiveImageIndex(Number(item.id.replace("gallery-", "")));
      setIsViewingGalleryImage(true);
      return;
    }
    setIsViewingGalleryImage(false);
    setSelectedVariantOptions({ ...item.combination.opciones });
  };

  const navigateZoomedMedia = (direction: -1 | 1) => {
    if (!mediaThumbnails.length) return;
    const currentIndex = activeMediaIndex >= 0 ? activeMediaIndex : 0;
    const nextIndex = (currentIndex + direction + mediaThumbnails.length) % mediaThumbnails.length;
    selectMediaThumbnail(mediaThumbnails[nextIndex]);
  };

  const handleZoomTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    zoomTouchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleZoomTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = zoomTouchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    zoomTouchStartX.current = null;
    if (startX == null || endX == null || Math.abs(endX - startX) < 48) return;
    navigateZoomedMedia(endX < startX ? 1 : -1);
  };

  useEffect(() => {
    if (!variantGroups.length) { setSelectedVariantOptions({}); return; }
    const defaults: Record<string, string> = {};
    const ordered = [...variantGroups];
    let changed = true;
    while (changed) {
      changed = false;
      ordered.forEach(group => {
        if (group.requerido === false || defaults[group.id]) return;
        const parentValue = group.dependeDe ? defaults[group.dependeDe] : undefined;
        const first = group.opciones.find(option =>
          option.nombre.trim() &&
          (!group.dependeDe || !parentValue || !option.disponiblePara?.length || option.disponiblePara.includes(parentValue))
        );
        if (first) { defaults[group.id] = first.id; changed = true; }
      });
    }
    setSelectedVariantOptions(defaults);
  }, [variantGroups]);

  const getSelectedVariantLines = () => variantGroups.map(group => { const option = group.opciones.find(item => item.id === selectedVariantOptions[group.id]); return option ? `• *${group.nombre}:* ${option.nombre}` : null; }).filter(Boolean).join("\n");

  const handleDirectOrder = () => {
    if (variantGroups.some(group => group.requerido !== false && !selectedVariantOptions[group.id])) return alert("Selecciona todas las características requeridas.");
    if (variantGroups.length && !selectedCombination) return alert("La combinación seleccionada no está disponible.");
    if (isShirtProduct && shirtLocations.length === 0) return alert("Elige una o más ubicaciones para tu diseño.");
    if (isShirtProduct && shirtLocations.includes("Otra zona") && !shirtCustomLocation.trim()) return alert("Escribe dónde quieres colocar el diseño adicional.");
    const attrString = productAttributes
      .map((attribute) => `• *${attribute.definition?.nombreAtributo || "Atributo"}:* ${selectedAttributes[attribute.atributoId] || "N/A"}`)
      .join("\n");
    const selectedCustomizationLocations = shirtLocations
      .map((location) => location === "Otra zona" ? shirtCustomLocation.trim() : location)
      .filter(Boolean)
      .join(", ");
    const customizationLine = isShirtProduct ? `\n- *Quiero personalizarla en:* ${selectedCustomizationLocations}` : "";
    const message = "¡Hola SubliMod! Me interesa este producto:\n\n- *Producto:* " + product.nombre + "\n- *Cantidad:* " + quantity + " unidades\n" + getSelectedVariantLines() + (attrString ? "\n" + attrString : "") + (!variantGroups.length ? "\n- *Variante/Color:* " + (selectedColor?.name || "N/A") : "") + customizationLine + "\n\n- *Precio Unitario:* C$ " + variantPrice + "\n- *Total Estimado:* C$ " + totalPrice + "\n\n_Enlace del producto:_ " + window.location.origin + "/producto/" + product.id + "\nQuedo a la espera de su respuesta para coordinar el diseño.";
    window.open(`https://wa.me/505${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAddToQuote = () => {
    if (variantGroups.some(group => group.requerido !== false && !selectedVariantOptions[group.id])) return alert("Selecciona todas las características requeridas.");
    const readableAttributes = Object.fromEntries(
      productAttributes.map(attribute => [
        attribute.definition?.nombreAtributo || attribute.atributoId,
        selectedAttributes[attribute.atributoId] || "N/A",
      ])
    );
    const variantAttributes = {
      ...readableAttributes,
      ...Object.fromEntries(
        variantGroups
          .map(group => {
            const option = group.opciones.find(item => item.id === selectedVariantOptions[group.id]);
            return option ? [group.nombre, option.nombre] : null;
          })
          .filter(Boolean) as [string, string][]
      ),
    };
    addItem({ id: `${product.id}-${Date.now()}`, productId: product.id, clavePrecio: usesCombinationPrice && selectedCombination ? `${product.id}-${selectedCombination.id}` : product.id, precioPorCombinacion: usesCombinationPrice, nombre: product.nombre, imagen: selectedVariantImage || product.imagenUrl, atributos: variantAttributes, color: selectedColor, cantidad: quantity, escalasPrecios: priceScales, precioUnitario: variantPrice, total: totalPrice });
    setAddedToQuote(true);
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#263532]/75 p-0 backdrop-blur-lg sm:p-3 lg:p-6">
      <div className="relative flex h-dvh w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-none border border-white/70 bg-[#FBFAF7] shadow-2xl shadow-[#263532]/25 animate-in zoom-in duration-300 sm:h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-[2rem] lg:h-[min(920px,calc(100dvh-3rem))] lg:max-h-[calc(100dvh-3rem)] lg:rounded-[2.5rem]">
        <div className="flex shrink-0 items-center justify-between gap-2 bg-gradient-to-r from-[#426963] to-[#557A74] px-3 py-3 text-white sm:gap-3 sm:px-4 lg:hidden">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-white/90 transition hover:bg-white/10"><ArrowLeft size={20}/><span className="text-xs font-black uppercase tracking-widest">Volver</span></button>
          <div className="min-w-0 flex-1 text-center"><span className="block truncate text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD77C]">{product.categoria}</span><span className="block truncate text-xs font-black uppercase text-white">{product.nombre}</span></div>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/10 text-white" aria-label="Cerrar detalle"><X size={20}/></button>
        </div>
        <button type="button" onClick={onClose} className="absolute right-5 top-5 z-50 hidden rounded-full border border-[#E3E4E1] bg-white p-3 text-secondary shadow-md transition hover:bg-[#FFF1C8] lg:block" aria-label="Cerrar detalle"><X size={22}/></button>
        <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 content-start items-start overflow-y-auto lg:grid-cols-[.92fr_1.08fr] lg:items-stretch lg:overflow-hidden">
          <div className="relative flex h-fit min-w-0 shrink-0 flex-col items-center justify-start gap-4 overflow-visible bg-[radial-gradient(circle_at_50%_12%,rgba(255,215,124,.14),transparent_31%),linear-gradient(155deg,#668780_0%,#55756F_58%,#47655F_100%)] p-3 sm:p-6 lg:h-auto lg:min-h-0 lg:shrink lg:justify-center lg:overflow-y-auto lg:overscroll-contain lg:p-8 xl:p-10">
            <div className="flex w-full max-w-[500px] items-center justify-between gap-3 pb-1"><span className="text-[9px] font-black uppercase tracking-[.22em] text-white/70">SubliMod · Hecho para personalizar</span><span className="rounded-full bg-[#FFD77C] px-3 py-1 text-[9px] font-black uppercase tracking-wide text-[#3D413F]">Vista del producto</span></div>
            {visibleImage && <button type="button" onClick={() => setIsImageZoomed(true)} className="group relative aspect-[4/3] w-full max-w-[500px] shrink-0 cursor-zoom-in overflow-hidden rounded-[1.5rem] border border-white/70 bg-[#FAF9F5] shadow-xl shadow-[#344E49]/20 sm:aspect-square sm:rounded-[2rem]"><img src={visibleImage} alt={product.nombre} className="h-full w-full object-contain p-3 sm:p-6"/><span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-[#426963] px-3 py-2 text-[9px] font-black uppercase text-white shadow-md transition group-hover:bg-primary sm:bottom-4 sm:right-4"><Maximize2 size={13}/> Ampliar</span></button>}
            {mediaThumbnails.length > 1 && <div className="flex w-full max-w-[500px] shrink-0 gap-3 overflow-x-auto justify-start px-1 pb-2 lg:justify-center" aria-label="Galería y variantes del producto">{mediaThumbnails.map((item) => {
              const galleryIndex = item.type === "gallery" ? Number(item.id.replace("gallery-", "")) : -1;
              const isActive = item.type === "gallery"
                ? isViewingGalleryImage && activeImageIndex === galleryIndex
                : !isViewingGalleryImage && selectedCombination?.id === item.combination?.id;
              return <button type="button" key={item.id} onClick={() => selectMediaThumbnail(item)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-transform ${isActive ? "scale-110 border-[#FFD77C] ring-2 ring-[#FFD77C]/30" : "border-white/40 opacity-75 hover:opacity-100"}`} aria-label={item.type === "variant" ? `Seleccionar ${item.label}` : `Ver ${item.label}`} aria-current={isActive ? "true" : undefined}><img src={item.image} alt="" className="h-full w-full object-cover"/></button>;
            })}</div>}
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/95 px-5 py-2.5 shadow-sm"><ShieldCheck size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase tracking-wide text-secondary">Calidad SubliMod</span></div>
          </div>
          <div className="h-fit min-w-0 space-y-6 overflow-visible overscroll-contain bg-[#FBFAF7] p-4 sm:p-7 lg:h-auto lg:min-h-0 lg:overflow-y-auto lg:space-y-7 lg:p-9 xl:p-10">
            <div className="rounded-[1.75rem] border border-[#E8E5DC] bg-white p-5 shadow-sm sm:p-6"><div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-[#FFF1C8] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#565042]">{product.categoria}</span><span className="text-[9px] font-bold uppercase tracking-[.18em] text-primary">Producto personalizable</span></div><h2 className="text-3xl font-black uppercase tracking-tighter text-secondary lg:text-4xl">{product.nombre}</h2>{product.descripcion && <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.descripcion}</p>}</div>
            {canBrowsePersonalizedShirts && <div className="flex flex-col gap-3 rounded-2xl border border-[#D7E4DF] bg-[#F0F5F2] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-black text-[#365D56]">¿Buscas camisetas con diseños?</p><p className="mt-1 text-[11px] leading-relaxed text-[#64736E]">Explora la categoría de camisetas personalizadas.</p></div><Link href="/catalogo?filtro=Camisetas%20personalizadas" onClick={onClose} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4F7972] px-4 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-[#426963]">Ver camisetas personalizadas <ArrowRight size={15}/></Link></div>}
            <div className="space-y-8">
              {variantGroups.map((group) => <div key={group.id} className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{group.nombre}</label><div className="flex flex-wrap gap-2">{group.opciones.map((option) => {
                const selected = selectedVariantOptions[group.id] === option.id;
                const available = availableVariantOptions[group.id]?.has(option.id) ?? true;
                return <button type="button" key={option.id} disabled={!available} onClick={() => {
                  setIsViewingGalleryImage(false);
                  setSelectedVariantOptions(previous => {
                    const next = { ...previous, [group.id]: option.id };
                    variantGroups.forEach(child => {
                      if (child.dependeDe !== group.id) return;
                      const firstCompatible = child.opciones.find(childOption => !childOption.disponiblePara?.length || childOption.disponiblePara.includes(option.id));
                      if (firstCompatible) next[child.id] = firstCompatible.id;
                      else delete next[child.id];
                    });
                    return next;
                  });
                }} className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all ${selected ? "border-primary bg-primary text-white shadow-lg" : available ? "border-gray-200 bg-white text-gray-600" : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"}`}>{group.tipo === "color" && <span className="h-4 w-4 rounded-full border" style={{backgroundColor: option.hex || "#ddd"}}/>}{selected && <Check size={14}/>} {option.nombre}</button>;
              })}</div></div>)}
              {productAttributes.length > 0 && <div className="space-y-4 rounded-2xl border border-primary/10 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Características del producto</label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {productAttributes.map((attribute) => (
                    <div key={attribute.atributoId} className="rounded-xl bg-[#F8FAFA] px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{attribute.definition?.nombreAtributo || "Atributo"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {attribute.valores.map((value) => (
                          <span key={value} className="rounded-lg border border-primary/10 bg-white px-3 py-1.5 text-xs font-bold text-secondary">{value}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>}
              {Array.isArray(product.colores) && product.colores.length > 0 && <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Variante de Diseño</label><div className="flex flex-wrap gap-3">{product.colores.map((color: any) => { const selected = selectedColor?.name === color.name; return <button type="button" key={color.name} onClick={() => setSelectedColor(color)} className={`flex items-center gap-3 rounded-2xl border p-1.5 pr-4 ${selected ? "border-primary bg-primary/10" : "border-gray-200 bg-white"}`}><div className="h-8 w-8 rounded-xl border" style={{backgroundColor: color.hex}}/><span className="text-[10px] font-bold uppercase">{color.name}</span></button>; })}</div></div>}
            </div>
            {isShirtProduct && (
              <section
                className="relative overflow-hidden rounded-[1.75rem] border border-[#D1E1DC] bg-[linear-gradient(135deg,#E7F2EF_0%,#F8F8F1_57%,#FFF0C6_100%)] p-5 shadow-sm sm:p-6"
                aria-labelledby="shirt-customization-title"
              >
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/35 blur-2xl" />
                <div className="relative">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#246D67] text-white shadow-md shadow-[#174A46]/15"><Shirt size={21} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#246D67] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white">Paso 1</span>
                        <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#64736E]">Personaliza tu camiseta</span>
                      </div>
                      <h3 id="shirt-customization-title" className="mt-2 text-lg font-black leading-tight text-[#254C48]">¿Dónde quieres colocar tu diseño?</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#586C67]">Puedes marcar varias zonas. Si buscas otro lugar, elige “Otra zona” y descríbelo.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Elige una o más ubicaciones para el diseño">
                    {[...shirtCustomizationLocations, "Otra zona"].map((location) => {
                      const selected = shirtLocations.includes(location);
                      return (
                        <button
                          type="button"
                          key={location}
                          aria-pressed={selected}
                          onClick={() => setShirtLocations((current) => selected ? current.filter((item) => item !== location) : [...current, location])}
                          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-black uppercase tracking-wide transition-all ${selected ? "border-[#4F7972] bg-[#4F7972] text-white shadow-md shadow-[#344E49]/15" : "border-white bg-white/85 text-[#405A55] hover:border-[#8BB7AE] hover:bg-white"}`}
                        >
                          {selected && <Check size={13} />}
                          {location}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-[10px] font-bold text-[#48615C]" aria-live="polite">
                    {shirtLocations.length > 0 ? `${shirtLocations.length} ${shirtLocations.length === 1 ? "ubicación seleccionada" : "ubicaciones seleccionadas"}` : "Aún no has elegido. Puedes seleccionar una o varias zonas."}
                  </p>

                  {shirtLocations.includes("Otra zona") && (
                    <label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-[#48615C]">
                      ¿Qué otra zona?
                      <input
                        autoComplete="off"
                        value={shirtCustomLocation}
                        onChange={(event) => setShirtCustomLocation(event.target.value)}
                        placeholder="Ej. hombro, bolsillo o toda la camiseta"
                        className="mt-1.5 w-full rounded-xl border border-[#D0DED9] bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-secondary outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </label>
                  )}

                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/75 bg-white/65 px-3 py-2.5">
                    <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-[10px] leading-relaxed text-[#53655F]">Al pulsar “Personalizar y pedir”, todas las zonas seleccionadas se enviarán por WhatsApp.</p>
                  </div>
                </div>
              </section>
            )}
            <div className="-mx-4 space-y-6 border-t border-[#E5E2D8] bg-[#FBFAF7] p-4 sm:mx-0 sm:rounded-[2rem] sm:border sm:bg-white sm:p-5 sm:shadow-sm lg:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Cantidad</label>
                  <div className="flex h-12 w-full items-center rounded-xl border border-gray-200 bg-[#F8FAFA] p-1 sm:w-36">
                    <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-white" aria-label="Disminuir cantidad"><Minus size={18}/></button>
                    <span className="flex-1 text-center text-lg font-black text-primary">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((current) => current + 1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-white" aria-label="Aumentar cantidad"><Plus size={18}/></button>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Total estimado</label>
                  <div className="mt-0.5 text-3xl font-black leading-none text-primary sm:text-4xl">C$ {totalPrice}</div>
                  <span className="mt-1 block text-[10px] font-bold uppercase text-gray-500">C$ {variantPrice} por unidad{usesCombinationPrice ? " · precio de la selección" : ""}</span>
                </div>
              </div>
              {hasQuantityScales && (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Precios por cantidad</p>
                        <button
                          type="button"
                          onClick={() => setIsPricingInfoOpen(true)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-white text-primary transition-colors hover:bg-primary hover:text-white"
                          aria-label="Información sobre precios por cantidad"
                          title="¿Cómo funcionan los precios por cantidad?"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-gray-500">A mayor cantidad, puedes acceder a un precio por unidad más conveniente.</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {priceScales.map((scale: any, index: number) => {
                      const isActive = Boolean(activePriceScale && Number(activePriceScale.min) === Number(scale.min) && (activePriceScale.max ?? null) === (scale.max ?? null) && Number(activePriceScale.price) === Number(scale.price));
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                            isActive
                              ? "border-primary bg-white shadow-sm"
                              : "border-primary/10 bg-white/60"
                          }`}
                        >
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                              {scale.max == null ? `Desde ${scale.min} unidades` : `${scale.min}–${scale.max} unidades`}
                            </p>
                            {isActive && (
                              <p className="mt-0.5 text-[8px] font-bold uppercase text-primary">Precio aplicable</p>
                            )}
                          </div>
                          <span className="text-sm font-black text-secondary">C$ {Number(scale.price) || 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleDirectOrder} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-black uppercase leading-tight tracking-widest text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"><MessageCircle size={18} className="shrink-0"/> <span>Personalizar y pedir</span></button>
                <button type="button" onClick={handleAddToQuote} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[11px] font-black uppercase leading-tight tracking-widest transition-colors ${addedToQuote ? "border-green-500 bg-green-500/10 text-green-500" : "border-gray-200 bg-white text-secondary hover:border-primary/30"}`}>{addedToQuote ? <><Check size={18} className="shrink-0"/> <span>¡Añadido!</span></> : <><ShoppingCart size={18} className="shrink-0"/> <span>Añadir a cotización</span></>}</button>
              </div>
            </div>
            <div className="flex flex-col gap-6 border-t border-primary/10 pt-8 md:flex-row"><div className="flex items-center gap-3 text-gray-600"><Truck size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase">Envíos Cargo Trans / Interlocal</span></div><div className="flex items-center gap-3 text-gray-600"><Info size={18} className="text-primary"/><span className="text-[10px] font-bold uppercase">Jinotega, Nicaragua</span></div></div>
          </div>
        </div>
        {isPricingInfoOpen && (
          <div
            className="fixed inset-0 z-[280] flex items-center justify-center bg-secondary/55 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-info-title"
            onClick={() => setIsPricingInfoOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#F8FAFA] p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Info size={20} />
                  </div>
                  <h3 id="pricing-info-title" className="text-lg font-black text-secondary">¿Cómo funcionan los precios por cantidad?</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPricingInfoOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary shadow-sm transition-colors hover:bg-gray-100"
                  aria-label="Cerrar información"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-600">
                <p>
                  Los precios por cantidad se calculan sobre el <strong className="text-secondary">total de unidades del mismo producto</strong>.
                </p>
                <p>
                  Puedes combinar diferentes variantes disponibles, como <strong className="text-secondary">colores o tallas</strong>, y todas las unidades se acumulan para determinar el precio aplicable.
                </p>
                <p>
                  Los productos diferentes se calculan de forma independiente.
                </p>
              </div>
              <div className="mt-5 rounded-xl border border-primary/10 bg-primary/5 p-3 text-[10px] font-bold uppercase leading-relaxed tracking-wide text-primary">
                Ejemplo: 3 unidades en una variante + 3 unidades en otra variante del mismo producto = 6 unidades para determinar el precio por cantidad.
              </div>
              <button
                type="button"
                onClick={() => setIsPricingInfoOpen(false)}
                className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
        {isImageZoomed && visibleImage && <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-auto bg-secondary/80 p-4 backdrop-blur-lg" onClick={(event) => { if (event.target === event.currentTarget) setIsImageZoomed(false); }} onTouchStart={handleZoomTouchStart} onTouchEnd={handleZoomTouchEnd}><button type="button" onClick={(event) => { event.stopPropagation(); setIsImageZoomed(false); }} className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary shadow-xl" aria-label="Cerrar imagen ampliada"><X size={24}/></button><button type="button" disabled={mediaThumbnails.length < 2} onClick={(event) => { event.stopPropagation(); navigateZoomedMedia(-1); }} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-secondary shadow-xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 sm:left-6" aria-label="Ver imagen anterior"><ChevronLeft size={26}/></button><button type="button" disabled={mediaThumbnails.length < 2} onClick={(event) => { event.stopPropagation(); navigateZoomedMedia(1); }} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-secondary shadow-xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 sm:right-6" aria-label="Ver imagen siguiente"><ChevronRight size={26}/></button><img src={visibleImage} alt={product.nombre} className="max-h-[90dvh] max-w-[95vw] rounded-2xl object-contain"/></div>}
      </div>
    </div>
  );
};

export default ProductDetailModal;
