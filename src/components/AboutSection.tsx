"use client";
import React from "react";
import { Award, Heart, Truck, MapPin, MessageCircle, ExternalLink } from "lucide-react";

const AboutSection = () => {
  const pilares = [
    {
      icon: <Award className="text-primary" size={28} />,
      titulo: "Calidad Garantizada",
      desc: "Insumos premium de alta durabilidad.",
    },
    {
      icon: <Heart className="text-primary" size={28} />,
      titulo: "Atención Personalizada",
      desc: "Asesoría creativa en cada diseño.",
    },
    {
      icon: <Truck className="text-primary" size={28} />,
      titulo: "Envíos Rápidos",
      desc: "Cobertura nacional desde Jinotega.",
    },
  ];

  return (
    <section id="nosotros" className="py-24 px-6 bg-gray-50/50 scroll-mt-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* 1. COLUMNA DE IMAGEN Y BADGE */}
          <div className="relative">
            <div className="aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img
                src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80"
                alt="Taller de diseño y producción SubliMod"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            
            {/* Badge Flotante Estilizado */}
            <div className="absolute -bottom-8 -right-4 md:-right-8 bg-[#1A1A1A] p-8 rounded-[2.5rem] shadow-2xl border border-white/10 hidden sm:block animate-in slide-in-from-bottom-4 duration-1000">
              <p className="text-accent font-black text-2xl uppercase tracking-tighter leading-none">
                Diseño <br /> <span className="text-white text-lg font-medium italic">Independiente</span>
              </p>
              <div className="h-1 w-12 bg-primary mt-4 rounded-full"></div>
            </div>
          </div>

          {/* 2. COLUMNA DE TEXTO E HISTORIA */}
          <div className="flex flex-col">
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 flex items-center gap-2">
              <div className="h-px w-8 bg-primary"></div> Sobre SubliMod
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-secondary mb-8 tracking-tighter uppercase leading-[0.9]">
              Donde el arte se une con la precisión
            </h2>
            
            <div className="space-y-6 text-secondary/80 text-lg leading-relaxed mb-10 font-medium italic">
              <p>
                En SubliMod combinamos la pasión por el diseño con tecnología en sublimación y corte de vinil para crear piezas únicas. No somos una gran corporación; somos un taller independiente impulsado por la precisión técnica, herramientas digitales y el cuidado de cada detalle.
              </p>
              <p className="not-italic text-base text-secondary/60">
                Cada taza, camiseta o accesorio se diseña y produce localmente desde Jinotega con la mejor calidad de color y acabado posible, asegurando que tu visión tome forma exactamente como la imaginaste.
              </p>
            </div>

            {/* Pilares de Marca */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              {pilares.map((pilar, index) => (
                <div key={index} className="flex flex-col items-start group">
                  <div className="mb-4 p-3 bg-white rounded-2xl shadow-sm group-hover:bg-primary/10 transition-colors">
                    {pilar.icon}
                  </div>
                  <h4 className="font-black text-secondary text-xs uppercase tracking-widest mb-1">{pilar.titulo}</h4>
                  <p className="text-xs text-secondary/50 font-bold uppercase tracking-tighter">{pilar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN DE UBICACIÓN Y MAPA */}
        <div className="mt-32 grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch">
          
          {/* Info de contacto lateral */}
          <div className="lg:col-span-1 bg-[#1A1A1A] p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between border border-white/5">
            <div className="space-y-10">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Visítanos en Jinotega</h3>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <MapPin className="text-primary mt-1" size={24} />
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Dirección</p>
                    <p className="text-white text-sm font-medium leading-relaxed uppercase">Puente CentroAmérica 75 vrs al oeste. Jinotega, Nicaragua.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <MessageCircle className="text-primary mt-1" size={24} />
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">WhatsApp Oficial</p>
                    <a 
                      href="https://wa.me/50586153695" 
                      target="_blank" 
                      className="text-accent text-lg font-black hover:underline transition-all"
                    >
                      +505 86153695
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <Truck className="text-primary mt-1" size={24} />
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Logística</p>
                    <p className="text-white text-sm font-medium uppercase">Envíos a todo el país vía Cargo Trans o Interlocal.</p>
                  </div>
                </div>
              </div>
            </div>

            <a 
              href="https://maps.app.goo.gl/sRSB2XoBsmARQ7Qz9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
            >
              Ver en Google Maps <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

          {/* Mapa Incrustado */}
          <div className="lg:col-span-2 h-[400px] lg:h-auto min-h-[400px] rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white relative group">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3896.228!2d-85.99!3d13.09!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA1JzI0LjAiTiA4NcKwNTknMjQuMCJX!5e0!3m2!1ses!2sni!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
            ></iframe>
            {/* Overlay sutil para el mapa */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-[3.5rem]"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;