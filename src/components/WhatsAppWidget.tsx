"use client";
import { usePathname } from "next/navigation";

const FACEBOOK_URL = "https://www.facebook.com/share/19gjHA1pBn/?mibextid=wwXIfr";

const WhatsAppLogo = ({ size = 26 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 1 1 8.372 4.632m8.373-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.518-8.413" />
  </svg>
);

const FacebookLogo = ({ size = 25 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.017 1.791-4.687 4.533-4.687 1.312 0 2.686.236 2.686.236v2.977h-1.515c-1.491 0-1.956.93-1.956 1.887v2.247h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.099 24 12.073Z" />
  </svg>
);

const WhatsAppWidget = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  const WHATSAPP_NUMBER = "50586153695";
  const message = encodeURIComponent("¡Hola SubliMod! 👋 Tengo una consulta.");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[80] flex flex-col items-end gap-3">
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visitar Facebook de SubliMod"
        title="Facebook SubliMod"
        className="group flex items-center gap-2.5 rounded-full bg-[#1877F2] text-white px-4 py-3 shadow-2xl ring-2 ring-white/80 hover:scale-105 transition-transform"
      >
        <FacebookLogo size={24} />
        <span className="text-xs font-black uppercase tracking-wide">Facebook</span>
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a SubliMod por WhatsApp"
        title="WhatsApp SubliMod"
        className="group flex items-center gap-2.5 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-2xl ring-2 ring-white/80 hover:scale-105 transition-transform"
      >
        <WhatsAppLogo size={25} />
        <span className="text-xs font-black uppercase tracking-wide">WhatsApp</span>
      </a>
    </div>
  );
};

export default WhatsAppWidget;
