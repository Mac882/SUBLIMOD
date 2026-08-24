import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[#616160] text-white pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        {/* Columna 1: Brand */}
        <div>
          <h3 className="text-2xl font-bold italic text-accent mb-4">SubliMod</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Transformamos productos cotidianos en piezas únicas con tecnología de punta en sublimación y vinilado. Calidad que perdura.
          </p>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Jinotega, Nicaragua
          </span>
        </div>

        {/* Columna 2: Links */}
        <div>
          <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-accent/80">Enlaces</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="/" className="hover:text-accent transition-colors">Inicio</Link></li>
            <li><Link href="/catalogo" className="hover:text-accent transition-colors">Catálogo</Link></li>
            <li><Link href="#nosotros" className="hover:text-accent transition-colors">Nosotros</Link></li>
            <li><Link href="https://wa.me/50500000000" className="hover:text-accent transition-colors">Contacto</Link></li>
          </ul>
        </div>

        {/* Columna 3: Envíos */}
        <div>
          <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-accent/80">Logística</h4>
          <p className="text-sm text-gray-300 mb-4">
            Realizamos envíos diarios a través de:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 px-3 py-1 rounded text-xs">Cargo Trans</span>
            <span className="bg-white/10 px-3 py-1 rounded text-xs">Interlocal</span>
            <span className="bg-white/10 px-3 py-1 rounded text-xs">Entregas Locales</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} SubliMod. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;