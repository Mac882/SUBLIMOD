"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";
import QuoteCartDrawer from "@/components/QuoteCartDrawer";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const defaultHome = {
  homeHeroTitle: "Personaliza tus momentos",
  homeHeroDescription:
    "Productos sublimables de calidad para convertir tus ideas en piezas únicas, con color, detalle y ese toque que hace la diferencia.",
  homeHeroImageUrl: "",
};

export default function Home() {
  const [home, setHome] = useState(defaultHome);

  useEffect(() => {
    return onSnapshot(doc(db, "configuracion", "general"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setHome((current) => ({ ...current, ...data }));
    });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-secondary">
      <Navbar />

      <section className="relative isolate overflow-hidden border-b border-primary/10 bg-[#FBFDFC] px-5 py-10 sm:px-6 md:py-14 lg:py-16">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#FFD8E8]/45 blur-3xl" />
        <div className="pointer-events-none absolute right-[-90px] top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-100px] left-1/3 h-72 w-72 rounded-full bg-[#FFE7A8]/45 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#2E8982_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm">
              <Sparkles size={14} />
              Sublimación & vinil de precisión
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-[#17263F] sm:text-5xl md:text-6xl lg:text-7xl">
              {home.homeHeroTitle.split(/\s+(?=tus\s+momentos$)/i)[0] || home.homeHeroTitle}
              {home.homeHeroTitle.toLowerCase().includes("tus momentos") && (
                <span className="block text-primary">tus momentos</span>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#52627A] sm:text-base md:text-lg">
              {home.homeHeroDescription}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#catalogo" className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-dark active:scale-95">
                Ver productos <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            {home.homeHeroImageUrl ? (
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-2 shadow-xl shadow-[#17263F]/10 sm:p-3">
                <div className="aspect-[16/9] overflow-hidden rounded-[2rem] bg-[#F1F8F7]">
                  <img src={home.homeHeroImageUrl} alt="Productos SubliMod" className="h-full w-full object-cover object-center" />
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-3 shadow-xl shadow-[#17263F]/10">
                <div className="flex aspect-[16/9] items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#DFF7F3] via-white to-[#FFE9B8] text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">SubliMod</span>
                    <p className="mt-2 text-2xl font-black uppercase leading-none text-[#17263F] sm:text-3xl">Tu idea toma forma</p>
                    <div className="mx-auto mt-5 h-2 w-16 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <CategoryGrid />
      <QuoteCartDrawer whatsappNumber="86153695" />
      <Footer />
    </main>
  );
}
