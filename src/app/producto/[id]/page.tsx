"use client";
import { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MessageCircle, Minus, Plus, ChevronLeft, Truck, ShieldCheck, Check, Users, User } from "lucide-react";
import Link from "next/link";
import ProductDetailModal from "@/components/ProductDetailModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  // 1. DESEMPAQUETADO Y SANITIZACIÓN (Next.js 15+)
  const resolvedParams = use(params);
  const rawId = resolvedParams.id || "";
  const id = rawId.split("/")[0];

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DE MODO Y SELECCIÓN
  const [orderMode, setOrderMode] = useState<"simple" | "lote">("simple");
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  
  // ESTADOS DE CANTIDAD
  const [globalQuantity, setGlobalQuantity] = useState(1); // Para modo simple
  const [selectedSize, setSelectedSize] = useState(""); // Talla única en modo simple
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({}); // Matriz para modo lote

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "productos", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);

          if (data.colores?.length > 0) setSelectedColor(data.colores[0]);

          if (data.atributos) {
            const defaults: Record<string, string> = {};
            const initialSizes: Record<string, number> = {};
            
            Object.entries(data.atributos).forEach(([key, values]: any) => {
              const isSizeAttr = key.toLowerCase() === "tallas" || key.toLowerCase() === "talla";
              
              if (isSizeAttr && values.length > 0) {
                setSelectedSize(values[0]); // Talla por defecto para modo simple
                values.forEach((v: string) => initialSizes[v] = 0);
                initialSizes[values[0]] = 1; // 1 unidad en la primera talla para modo lote
              } else if (values.length > 0) {
                defaults[key] = values[0];
              }
            });
            setSelectedAttributes(defaults);
            setSizeQuantities(initialSizes);
          }
        }
      } catch (error) {
        console.error("Error al consultar Firestore:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // DETECTAR SI TIENE TALLAS
  const hasSizes = product?.atributos && (product.atributos["Tallas"] || product.atributos["tallas"] || product.atributos["Talla"]);

  // CÁLCULO DE UNIDADES TOTALES SEGÚN EL MODO
  const totalUnits = (hasSizes && orderMode === "lote")
    ? Object.values(sizeQuantities).reduce((acc, curr) => acc + curr, 0)
    : globalQuantity;

  // ESCALA DE PRECIOS
  const getUnitPrice = () => {
    if (!product?.escalasPrecios) return 0;
    const escala = product.escalasPrecios.find((e: any) => totalUnits >= e.min && totalUnits <= e.max);
    return escala ? escala.price : product.escalasPrecios[0]?.price || 0;
  };

  const unitPrice = getUnitPrice();
  const totalPrice = unitPrice * totalUnits;

  // WHATSAPP
  const handleWhatsAppOrder = () => {
    const specs = Object.entries(selectedAttributes).map(([k, v]) => `• *${k}:* ${v}`).join("\n");
    
    let orderDetail = "";
    if (hasSizes) {
      if (orderMode === "simple") {
        orderDetail = `• *Talla seleccionada:* ${selectedSize}\n• *Cantidad:* ${globalQuantity} uds`;
      } else {
        const breakdown = Object.entries(sizeQuantities).filter(([_, q]) => q > 0).map(([s, q]) => `  - Talla ${s}: ${q} uds`).join("\n");
        orderDetail = `*Desglose de Lote:*\n${breakdown}\n• *Total Unidades:* ${totalUnits} uds`;
      }
    } else {
      orderDetail = `• *Cantidad:* ${globalQuantity} uds`;
    }

    const message = `¡Hola SubliMod! 👋 Me interesa cotizar este pedido (${orderMode === "lote" ? "POR LOTE" : "INDIVIDUAL"}):

- *Producto:* ${product.nombre}
- *Categoría:* ${product.categoria}

${orderDetail}
*Especificaciones:*
${specs}
- *Color/Variante:* ${selectedColor?.name || "N/A"}

- *Precio Unitario (Escala):* C$ ${unitPrice}
- *Total Estimado:* C$ ${totalPrice}

_Enlace:_ ${window.location.origin}/producto/${id}`;

    window.open(`https://wa.me/50588888888?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Producto no encontrado.</div>;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/catalogo" className="inline-flex items-center text-gray-400 hover:text-primary mb-8 font-bold text-[10px] uppercase tracking-widest gap-2">
          <ChevronLeft size={14} /> Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* IMAGEN */}
          <div className="relative animate-in fade-in duration-700">
            <div className="max-h-[400px] aspect-square rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-xl flex items-center justify-center p-6">
              <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* CONFIGURADOR */}
          <div className="flex flex-col">
            <span className="text-primary font-black uppercase text-[10px] tracking-[0.2em] mb-2">{product.categoria}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-secondary mb-4 uppercase">{product.nombre}</h1>
            <p className="text-secondary/60 text-sm italic mb-8 border-b pb-8">{product.descripcion}</p>

            {/* TABS DE MODO (Solo si hay tallas) */}
            {hasSizes && (
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setOrderMode("simple")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === "simple" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                >
                  <User size={14}/> Individual
                </button>
                <button 
                  onClick={() => setOrderMode("lote")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === "lote" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
                >
                  <Users size={14}/> Por Lote / Eventos
                </button>
              </div>
            )}

            {/* SECCIÓN DE TALLAS DINÁMICA */}
            {hasSizes && (
              <div className="mb-8 animate-in fade-in zoom-in duration-300">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  {orderMode === "simple" ? "Selecciona tu Talla" : "Distribución del Lote"}
                </label>
                
                {orderMode === "simple" ? (
                  <div className="flex flex-wrap gap-2">
                    {(product.atributos["Tallas"] || product.atributos["Talla"] || product.atributos["tallas"]).map((t: string) => (
                      <button 
                        key={t} onClick={() => setSelectedSize(t)}
                        className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all ${selectedSize === t ? "border-primary bg-primary/10 text-primary" : "bg-white border-gray-100 text-gray-400"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.keys(sizeQuantities).map(size => (
                      <div key={size} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="font-black text-secondary text-xs uppercase">Talla {size}</span>
                        <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                          <button onClick={() => setSizeQuantities(p => ({...p, [size]: Math.max(0, p[size]-1)}))} className="p-1.5 text-gray-400 hover:text-primary"><Minus size={14}/></button>
                          <span className="w-6 text-center font-bold text-xs">{sizeQuantities[size]}</span>
                          <button onClick={() => setSizeQuantities(p => ({...p, [size]: p[size]+1}))} className="p-1.5 text-gray-400 hover:text-primary"><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ATRIBUTOS Y COLORES */}
            <div className="space-y-8 mb-8">
              {Object.entries(product.atributos).map(([key, values]: any) => {
                if (key.toLowerCase().includes("talla")) return null;
                return (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{key}</label>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v: string) => (
                        <button
                          key={v} onClick={() => setSelectedAttributes(p => ({...p, [key]: v}))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedAttributes[key] === v ? "border-primary bg-primary/10 text-primary" : "bg-white border-gray-100 text-gray-400"}`}
                        >
                          {selectedAttributes[key] === v && <Check size={12} className="inline mr-1"/>} {v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {product.colores?.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Variante de Color</label>
                  <div className="flex flex-wrap gap-3">
                    {product.colores.map((c: any) => (
                      <button 
                        key={c.name} onClick={() => setSelectedColor(c)}
                        className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all ${selectedColor?.name === c.name ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-white text-gray-400"}`}
                      >
                        <div className="w-5 h-5 rounded-md border shadow-inner" style={{ backgroundColor: c.hex }}></div>
                        <span className="text-[10px] font-bold uppercase">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CALCULADORA FINAL */}
            <div className="bg-secondary text-white p-6 rounded-[2rem] shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Unidades Totales</p>
                  <p className="text-2xl font-black text-accent tracking-tighter">{totalUnits} uds</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Precio Unitario</p>
                  <p className="text-xl font-bold">C$ {unitPrice}</p>
                </div>
              </div>
              
              {orderMode === "simple" && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">Ajustar Cantidad</span>
                  <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                    <button onClick={() => setGlobalQuantity(Math.max(1, globalQuantity - 1))} className="p-2 hover:text-accent"><Minus size={16}/></button>
                    <span className="w-10 text-center font-bold">{globalQuantity}</span>
                    <button onClick={() => setGlobalQuantity(globalQuantity + 1)} className="p-2 hover:text-accent"><Plus size={16}/></button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-black uppercase text-accent tracking-widest">Total Estimado</span>
                <span className="text-3xl font-black tracking-tighter">C$ {totalPrice}</span>
              </div>

              <button 
                onClick={handleWhatsAppOrder}
                disabled={totalUnits === 0}
                className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all uppercase tracking-widest shadow-lg ${totalUnits === 0 ? "bg-gray-700" : "bg-primary hover:bg-primary-dark shadow-primary/20 active:scale-95"}`}
              >
                <MessageCircle size={20} /> Personalizar y Pedir
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}