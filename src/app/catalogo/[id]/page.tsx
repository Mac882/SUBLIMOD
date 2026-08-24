"use client";
import { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MessageCircle, Minus, Plus, ChevronLeft, Truck, Check } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Configuración
  const [cantidad, setCantidad] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [nota, setNota] = useState("");

  // CONSULTA REAL A FIRESTORE
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "productos", productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);

          // Inicializar atributos por defecto
          if (data.atributos) {
            const defaults: Record<string, string> = {};
            Object.entries(data.atributos).forEach(([key, options]: any) => {
              if (options && options.length > 0) defaults[key] = options[0];
            });
            setSelectedAttributes(defaults);
          }
          if (data.colores && data.colores.length > 0) {
            setSelectedColor(data.colores[0]);
          }
        }
      } catch (e) {
        console.error("Error cargando producto:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Lógica de Escalas de Precio
  const getUnitPrice = () => {
    if (!product?.escalasPrecios || product.escalasPrecios.length === 0) return 0;
    const escala = product.escalasPrecios.find((e: any) => cantidad >= e.min && cantidad <= e.max);
    return escala ? escala.price : product.escalasPrecios[product.escalasPrecios.length - 1].price;
  };

  const unitPrice = getUnitPrice();
  const totalPrice = unitPrice * cantidad;

  const handleWhatsAppOrder = () => {
    const WHATSAPP_NUMBER = "50588888888"; // Reemplaza con tu número real
    const attrString = Object.entries(selectedAttributes)
      .map(([key, val]) => `• *${key}:* ${val}`)
      .join("\n");

    const message = `¡Hola SubliMod! 👋 Me interesa cotizar este producto:

- *Producto:* ${product.nombre}
- *Cantidad:* ${cantidad} unidades
${attrString}
- *Variante/Color:* ${selectedColor?.name || "N/A"}
- *Precio Unitario:* C$ ${unitPrice}
- *Total Estimado:* C$ ${totalPrice}
- *Nota:* ${nota || "Sin notas adicionales"}

_Enlace del producto:_ ${window.location.href}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Cargando producto...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-4">
          <h2 className="text-2xl font-bold">Producto no encontrado</h2>
          <Link href="/catalogo" className="text-primary font-bold underline">Volver al catálogo</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/catalogo" className="inline-flex items-center text-secondary/60 hover:text-primary mb-8 transition-colors text-sm font-medium">
          <ChevronLeft size={18} /> Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* GALERÍA */}
          <div className="relative group">
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                {product.categoria}
              </span>
            </div>
            <div className="rounded-3xl overflow-hidden bg-gray-100 shadow-2xl aspect-square">
              <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* INFORMACIÓN */}
          <div className="flex flex-col space-y-6">
            <div>
              <span className="text-primary font-bold uppercase text-xs tracking-[0.2em]">{product.categoria}</span>
              <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mt-1">{product.nombre}</h1>
              <p className="text-3xl font-black text-accent mt-3">C$ {totalPrice} <span className="text-sm text-gray-400 font-normal">(C$ {unitPrice} c/u)</span></p>
            </div>
            
            <p className="text-secondary/80 leading-relaxed border-l-2 border-accent pl-4 italic">
              {product.descripcion || "Sin descripción disponible."}
            </p>

            {/* ATRIBUTOS */}
            {product.atributos && Object.entries(product.atributos).map(([key, options]: any) => (
              <div key={key} className="space-y-3">
                <label className="block text-xs font-black text-secondary uppercase tracking-wider">{key}</label>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt: string) => {
                    const isSelected = selectedAttributes[key] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: opt }))}
                        className={`py-2.5 px-5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${
                          isSelected ? "border-primary bg-primary/10 text-primary" : "border-gray-100 bg-gray-50 text-secondary"
                        }`}
                      >
                        {isSelected && <Check size={14} />} {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* NOTA */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-secondary uppercase tracking-wider">Detalles adicionales</label>
              <textarea
                placeholder="Ej: 'Quiero que lleve mi nombre Mayke'..."
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm focus:border-primary focus:outline-none min-h-[90px]"
                onChange={(e) => setNota(e.target.value)}
              />
            </div>

            {/* CANTIDAD Y BOTÓN */}
            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-full sm:w-auto">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="p-3 text-secondary hover:text-primary"><Minus size={20} /></button>
                <span className="w-12 text-center font-bold text-secondary text-lg">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)} className="p-3 text-secondary hover:text-primary"><Plus size={20} /></button>
              </div>

              <button
                onClick={handleWhatsAppOrder}
                className="flex-grow w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95"
              >
                <MessageCircle size={22} /> Cotizar por WhatsApp
              </button>
            </div>

            <div className="flex items-center gap-3 text-secondary/60 text-xs bg-gray-50 p-4 rounded-xl">
              <Truck size={16} />
              <span>Envíos desde Jinotega vía Cargo Trans / Interlocal a todo el país.</span>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}