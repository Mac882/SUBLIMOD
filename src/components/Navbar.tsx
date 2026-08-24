"use client";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // --- LÓGICA DE SINCRONIZACIÓN DEL CONTADOR ---
  const updateCount = () => {
    const saved = localStorage.getItem("sublimod_quote");
    if (saved) {
      const items = JSON.parse(saved);
      setCartCount(items.length);
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("cartUpdated", updateCount);
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("cartUpdated", updateCount);
      clearInterval(interval);
    };
  }, []);

  const openDrawer = () => {
    window.dispatchEvent(new Event("openSublimodCart"));
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Contacto", href: "https://wa.me/50586153695", target: "_blank" },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO */}
          <Link href="/" className="flex flex-col group">
            <span className="text-2xl font-black text-primary italic leading-none transition-transform group-hover:scale-105">
              SubliMod
            </span>
            <span className="text-[9px] text-secondary font-black tracking-[0.2em] uppercase opacity-70">
              Donde tu visión toma forma
            </span>
          </Link>

          {/* DESKTOP NAV + CART */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  target={link.target}
                  rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                  className="text-secondary hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* BOTÓN CARRITO DESKTOP */}
            <button
              onClick={openDrawer}
              className="bg-[#1A1A1A] hover:bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-3 transition-all active:scale-95 border border-white/10 group shadow-lg"
            >
              <div className="relative">
                <ShoppingBag size={18} className="text-primary group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#1A1A1A]">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mi Cotización</span>
            </button>
          </div>

          {/* MOBILE CONTROLS (CART + MENU) */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={openDrawer} className="relative p-2 bg-gray-50 rounded-xl">
              <ShoppingBag size={24} className="text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary p-2 bg-gray-50 rounded-xl"
              aria-label="Menú"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300 shadow-xl">
          <div className="px-4 pt-4 pb-8 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target={link.target}
                className="block px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-secondary hover:bg-gray-50 rounded-2xl"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;