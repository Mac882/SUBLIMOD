"use client";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const WhatsAppWidget = () => {
  const pathname = usePathname();
  
  // No mostrar en rutas administrativas
  if (pathname?.startsWith("/admin")) return null;

  const WHATSAPP_NUMBER = "50500000000";
  const message = encodeURIComponent("¡Hola SubliMod! 👋 Tengo una consulta.");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all"
    >
      <MessageCircle size={32} fill="currentColor" />
    </a>
  );
};

export default WhatsAppWidget;