"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { Award, Heart, Truck, MapPin, MessageCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function NosotrosPage() {
  const [configData, setConfigData] = useState({
    whatsapp: "86153695",
    address: "Puente CentroAmérica 75 vrs al oeste.",
    envios: "Envíos vía Cargo Trans o Interlocal.",
    aboutImageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
    aboutTitle: "Donde el arte se une con la precisión",
    aboutParagraph1: "En SubliMod combinamos la pasión por el diseño con tecnología en sublimación y corte de vinil para crear piezas únicas. No somos una gran corporación; somos un taller independiente impulsado por la precisión técnica, herramientas digitales y el cuidado de cada detalle.",
    aboutParagraph2: "Cada taza, camiseta o accesorio se diseña y produce localmente desde Jinotega con la mejor calidad de color y acabado posible, asegurando que tu visión tome forma exactamente como la imaginaste.",
    mapsUrl: "https://maps.app.goo.gl/sRSB2XoBsmARQ7Qz9",
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3896.228!2d-85.99!3d13.09!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA1JzI0LjAiTiA8NcKwNTknMjQuMCJX!5e0!3m2!1ses!2sni!4v1"
  });

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfigData(prev => ({
          ...prev,
          whatsapp: data.whatsapp ? data.whatsapp.trim() : prev.whatsapp,
          address: data.address || prev.address,
          envios: data.envios || prev.envios,
          aboutImageUrl: data.aboutImageUrl || prev.aboutImageUrl,
          aboutTitle: data.aboutTitle || prev.aboutTitle,
          aboutParagraph1: data.aboutParagraph1 || prev.aboutParagraph1,
          aboutParagraph2: data.aboutParagraph2 || prev.aboutParagraph2,
          mapsUrl: data.mapsUrl || prev.mapsUrl,
          mapsEmbedUrl: data.mapsEmbedUrl || prev.mapsEmbedUrl
        }));
      }
    });
    return () => unsubConfig();
  }, []);

  const pilares = [
    { icon: <Award className="text-primary" size={28} />, titulo: "Calidad Garantizada", desc: "Insumos premium de alta durabilidad." },
    { icon: <Heart className="text-primary" size={28} />, titulo: "Atención Personalizada", desc: "Asesoría creativa en cada diseño." },
    { icon: <Truck className="text-primary" size={28} />, titulo: "Envíos Rápidos", desc: "Cobertura nacional desde Jinotega." },
  ];

  return (
    <main className="min-h-screen bg-white text-secondary flex flex-col justify-between">
      <Navbar />

      <section className="py-20 px-6 overflow-hidden flex-grow">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative">
              <div className="aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-gray-50 bg-gray-100 flex items-center justify-center p-3 sm:p-5">
                <img
                  src={configData.aboutImageUrl}
                  alt="Taller Creativo SubliMod"
                  className="max-w-full max-h-full w-full h-full object-contain object-center transition-opacity duration-300"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-2xl border border-white/10 hidden sm:block">
                <p className="text-accent font-black text-2xl uppercase tracking-tighter leading-none">
                  Diseño <br /> <span className="text-white text-lg font-medium italic">Independiente</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 flex items-center gap-2">
                <div className="h-px w-8 bg-primary"></div> Sobre SubliMod
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-secondary mb-8 tracking-tighter uppercase leading-[1.1] pt-2">
                {configData.aboutTitle}
              </h1>
              <div className="space-y-6 text-secondary/80 text-lg leading-relaxed mb-10 font-medium italic">
                <p>{configData.aboutParagraph1}</p>
                <p className="not-italic text-base text-secondary/60">{configData.aboutParagraph2}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                {pilares.map((pilar, index) => (
                  <div key={index} className="flex flex-col items-start group">
                    <div className="mb-4 p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">{pilar.icon}</div>
                    <h4 className="font-black text-secondary text-xs uppercase tracking-widest mb-1">{pilar.titulo}</h4>
                    <p className="text-xs text-secondary/50 font-bold uppercase tracking-tighter">{pilar.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch">
            <div className="lg:col-span-1 bg-[#1A1A1A] p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} className="text-white" /></div>
              <div className="space-y-10 relative z-10">
                <h3 className="text-white font-black text-3xl uppercase tracking-tighter">Jinotega <br /><span className="text-primary">Nicaragua</span></h3>
                <div className="space-y-8">
                  <div className="flex gap-5 items-start"><div className="bg-primary/20 p-3 rounded-xl"><MapPin className="text-primary" size={20} /></div><div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Dirección Exacta</p><p className="text-white text-sm font-bold leading-relaxed uppercase">{configData.address}</p></div></div>
                  <div className="flex gap-5 items-start"><div className="bg-primary/20 p-3 rounded-xl"><MessageCircle className="text-primary" size={20} /></div><div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Atención Directa</p><a href={`https://wa.me/505${configData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-accent text-xl font-black hover:underline transition-all">+505 {configData.whatsapp}</a></div></div>
                  <div className="flex gap-5 items-start"><div className="bg-primary/20 p-3 rounded-xl"><Truck className="text-primary" size={20} /></div><div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Cobertura</p><p className="text-white text-sm font-bold uppercase">{configData.envios}</p></div></div>
                </div>
              </div>
              <a href={configData.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group relative z-10">Abrir en Google Maps <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></a>
            </div>

            <div className="lg:col-span-2 min-h-[450px] rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-gray-50 relative group bg-gray-100">
              <iframe src={configData.mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación SubliMod" className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"></iframe>
            </div>
          </div>
        </div>
      </section>

      <QuoteCartDrawer />
      <Footer />
    </main>
  );
}