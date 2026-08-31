import Link from "next/link";

export default function TechnologyAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative"><div className="pointer-events-none fixed right-5 top-5 z-50 md:right-8"><Link href="/admin/tecnologia/configuracion" className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#181818]/95 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-xl backdrop-blur hover:border-primary hover:text-primary">⚙ Configuración de inicio</Link></div>{children}</div>;
}
