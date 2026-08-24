"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-secondary flex flex-col justify-between">
      <Navbar />
      
      {/* Hero Section - Escala Moderada y Elegante */}
      <section className="relative py-12 md:py-20 px-4 overflow-hidden bg-primary/5 border-b border-primary/10">
        
        {/* Patrón de puntos sutil de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(#2D8B7B_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Badge superior sutil */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            <span>Sublimación & Vinil de Precisión</span>
          </div>

          {/* Título Principal Proporcionado */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-secondary tracking-tight uppercase leading-tight">
            Personaliza tus momentos <br className="hidden sm:inline" />
            <span className="text-secondary">con </span>
            <span className="text-primary italic lowercase font-black">sublimod</span>
          </h1>

          {/* Subtítulo Neutro */}
          <p className="text-sm md:text-base text-secondary/70 max-w-xl mx-auto font-medium leading-relaxed">
            Calidad excepcional en sublimación y vinilado desde Jinotega. 
            Creamos piezas únicas que cuentan tu historia con precisión técnica.
          </p>

          {/* Botón Principal */}
          <div className="pt-2 flex justify-center">
            <a
              href="/catalogo"
              className="inline-flex items-center gap-3 bg-[#1A1A1A] hover:bg-black text-white font-black py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl text-xs uppercase tracking-widest border border-white/10 hover:border-primary active:scale-95 group"
            >
              Ver Catálogo
              <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

        </div>
      </section>

      {/* Cuadrícula de Categorías Dinámicas */}
      <CategoryGrid />
      
      {/* CARRITO Y DRAWER FLOTANTE DE COTIZACIÓN */}
      <QuoteCartDrawer whatsappNumber="86153695" />

      {/* Pie de Página */}
      <Footer />
    </main>
  );
}