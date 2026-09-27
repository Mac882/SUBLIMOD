"use client";
import { useState } from "react";
import { Menu, X, ShoppingBag, Laptop } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

const FACEBOOK_URL = "https://www.facebook.com/share/19gjHA1pBn/?mibextid=wwXIfr";

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <span
    aria-hidden="true"
    className="flex items-center justify-center rounded-full bg-[#1877F2] text-white font-black leading-none"
    style={{ width: size, height: size, fontSize: Math.round(size * 0.72) }}
  >
    f
  </span>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const cartCount = useCartStore((state) => state.items.length);

  const openDrawer = () => {
    window.dispatchEvent(new Event("openSublimodCart"));
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Tecnología", href: "/tecnologia", icon: true },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Contacto", href: "https://wa.me/50586153695", target: "_blank" },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center group shrink-0" aria-label="SubliMod - Inicio">
            <Image
              src="/logo-sublimod.svg"
              alt="SubliMod"
              width={52}
              height={52}
              priority
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col ml-3">
              <span className="text-2xl font-black text-primary italic leading-none transition-transform group-hover:scale-105">SubliMod</span>
              <span className="text-[9px] text-secondary font-black tracking-[0.2em] uppercase opacity-70">Donde tu visión toma forma</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined} className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest">
                  {link.icon && <Laptop size={13} />}
                  {link.name}
                </Link>
              ))}
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visita nuestra página de Facebook"
                title="Visita nuestra página de Facebook"
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
              >
                <FacebookIcon size={18} />
                Facebook
              </a>
            </div>
            <button onClick={openDrawer} className="bg-[#1A1A1A] hover:bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-3 transition-all active:scale-95 border border-white/10 group shadow-lg">
              <div className="relative"><ShoppingBag size={18} className="text-primary group-hover:scale-110 transition-transform" />{cartCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#1A1A1A]">{cartCount}</span>}</div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mi Cotización</span>
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2 sm:gap-3">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visita nuestra página de Facebook"
              title="Facebook SubliMod"
              className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 hover:bg-blue-50 rounded-xl text-secondary hover:text-[#1877F2] transition-colors"
            >
              <FacebookIcon size={23} />
              <span className="hidden xs:inline text-[9px] font-black uppercase tracking-wider">Facebook</span>
            </a>
            <button onClick={openDrawer} className="relative p-2 bg-gray-50 rounded-xl" aria-label="Mi cotización"><ShoppingBag size={24} className="text-primary" />{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}</button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-secondary p-2 bg-gray-50 rounded-xl" aria-label="Menú">{isOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
      </div>

      {isOpen && <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300 shadow-xl"><div className="px-4 pt-4 pb-8 space-y-2">{navLinks.map((link) => <Link key={link.name} href={link.href} target={link.target} rel={link.target === "_blank" ? "noopener noreferrer" : undefined} className="flex items-center gap-2 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-secondary hover:bg-gray-50 rounded-2xl" onClick={() => setIsOpen(false)}>{link.icon && <Laptop size={16}/>} {link.name}</Link>)}<a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-secondary hover:bg-blue-50 hover:text-[#1877F2] rounded-2xl" onClick={() => setIsOpen(false)}><FacebookIcon size={20}/> Facebook SubliMod</a></div></div>}
    </nav>
  );
};

export default Navbar;
