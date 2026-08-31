"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import CategoryGrid from "@/components/CategoryGrid";
import TechnologyShowcase from "@/components/TechnologyShowcase";
import Footer from "@/components/Footer";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-secondary">
      <Navbar />

      {/* Hero: creativo, luminoso y con el lenguaje visual de la sublimación */}
      <section className="relative isolate overflow-hidden border-b border-primary/10 bg-[#FBFDFC] px-5 py-14 sm:px-6 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#FFD8E8]/55 blur-3xl" />
        <div className="pointer-events-none absolute right-[-90px] top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-100px] left-1/3 h-72 w-72 rounded-full bg-[#FFE7A8]/55 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#2E8982_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm">
              <Sparkles size={14} />
              Sublimación & vinil de precisión
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-[#17263F] sm:text-5xl md:text-6xl lg:text-7xl">
              Personaliza
              <span className="block text-primary">tus momentos</span>
            </h1>

            <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-[#52627A] sm:text-base md:text-lg">
              Productos sublimables de calidad para convertir tus ideas en piezas únicas, con color, detalle y ese toque que hace la diferencia.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalogo"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-dark active:scale-95"
              >
                Ver productos
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#tecnologia-home"
                className="inline-flex items-center gap-3 rounded-full border border-[#17263F]/10 bg-white/80 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#17263F] transition-all hover:border-primary/30 hover:bg-white"
              >
                Conocer tecnología
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:min-h-[430px]">
            <div className="absolute inset-x-8 top-8 h-72 rounded-[3rem] bg-gradient-to-br from-[#DFF7F3] via-white to-[#FFE9B8] blur-sm" />
            <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:absolute lg:inset-0 lg:grid-cols-6 lg:items-center lg:gap-4">
              <div className="col-span-2 overflow-hidden rounded-[2rem] border border-white bg-white shadow-xl shadow-[#17263F]/10 sm:col-span-2 lg:col-span-3 lg:translate-y-3">
                <div className="aspect-[4/3] bg-[#F1F8F7] p-3">
                  <div className="h-full overflow-hidden rounded-[1.4rem] bg-white">
                    <img
                      src="/logo-sublimod.svg"
                      alt="SubliMod"
                      className="h-full w-full object-contain p-8 opacity-90"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-xl shadow-[#17263F]/10 lg:col-span-3 lg:-translate-y-8">
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#FFF1F6] via-[#FFFDF7] to-[#E4F8F4] p-5 text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Tu idea</span>
                    <p className="mt-2 text-2xl font-black uppercase leading-none text-[#17263F] sm:text-3xl">Toma forma</p>
                    <div className="mx-auto mt-5 h-2 w-16 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
              <div className="hidden rounded-[1.5rem] border border-white bg-white/90 p-5 shadow-lg sm:block lg:col-span-2 lg:translate-x-4 lg:translate-y-8">
                <div className="h-12 w-12 rounded-2xl bg-[#FFE4EF]" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#17263F]">Color</p>
                <p className="mt-1 text-xs text-[#65748A]">Diseños que destacan.</p>
              </div>
              <div className="hidden rounded-[1.5rem] border border-white bg-white/90 p-5 shadow-lg sm:block lg:col-span-2 lg:translate-y-12">
                <div className="h-12 w-12 rounded-2xl bg-[#DFF7F3]" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#17263F]">Calidad</p>
                <p className="mt-1 text-xs text-[#65748A]">Hecho para durar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CategoryGrid />
      <TechnologyShowcase />

      <QuoteCartDrawer whatsappNumber="86153695" />
      <Footer />
    </main>
  );
}
