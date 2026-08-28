"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ArrowRight, Boxes, ChevronLeft, ChevronRight, LayoutDashboard, Laptop, Layers3, LogOut, Menu, Package, Settings, Tag, X } from "lucide-react";

type Item = Record<string, any> & { id: string };
const NAV = [
  { label: "Productos", icon: Package },
  { label: "Categorías", icon: Layers3 },
  { label: "Atributos / Unidades", icon: Tag },
  { label: "Configuración", icon: Settings },
];

function clickLegacyTab(label: string) {
  const root = document.querySelector("[data-admin-legacy]");
  const button = Array.from(root?.querySelectorAll("button") ?? []).find((node) => node.textContent?.replace(/\s+/g, " ").trim().toLowerCase() === label.toLowerCase()) as HTMLButtonElement | undefined;
  if (button) {
    button.click();
    return true;
  }
  return false;
}

function activateLegacyTab(label: string) {
  let attempts = 0;
  const retry = () => {
    if (clickLegacyTab(label)) return;
    attempts += 1;
    if (attempts < 12) window.setTimeout(retry, 50);
  };
  window.setTimeout(retry, 0);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMainAdmin = pathname === "/admin";
  const [dashboardOpen, setDashboardOpen] = useState(isMainAdmin);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Item[]>([]);
  const [attributes, setAttributes] = useState<Item[]>([]);
  const [laptops, setLaptops] = useState<Item[]>([]);

  useEffect(() => {
    if (!isMainAdmin) return;
    setDashboardOpen(true);
    const unsub = [
      onSnapshot(query(collection(db, "productos"), orderBy("createdAt", "desc")), snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "atributos_globales"), orderBy("nombreAtributo", "asc")), snap => setAttributes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc")), snap => setLaptops(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsub.forEach(stop => stop());
  }, [isMainAdmin]);

  useEffect(() => {
    if (pathname !== "/admin") {
      setDashboardOpen(false);
      setMobileOpen(false);
    }
  }, [pathname]);

  const availableLaptops = useMemo(() => laptops.filter(item => String(item.disponibilidad || "").toLowerCase().includes("dispon")).length, [laptops]);
  const activeCategories = useMemo(() => categories.filter(item => item.activa !== false).length, [categories]);

  if (!isMainAdmin) return <>{children}</>;

  const goDashboard = () => {
    setDashboardOpen(true);
    setMobileOpen(false);
  };
  const goTab = (label: string) => {
    setDashboardOpen(false);
    setMobileOpen(false);
    activateLegacyTab(label);
  };
  const goTechnology = () => {
    setDashboardOpen(false);
    setMobileOpen(false);
    router.push("/admin/tecnologia");
  };
  const logout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "w-[min(86vw,300px)]" : collapsed ? "w-[82px]" : "w-[286px]"} flex h-full flex-col border-r border-white/10 bg-[#191919] shadow-2xl transition-[width] duration-300`}>
      <div className={`${collapsed && !mobile ? "px-3" : "px-6"} flex items-center justify-between border-b border-white/5 py-6`}>
        <button onClick={goDashboard} className="flex min-w-0 items-center gap-3 text-left" title="Ir al Dashboard">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Boxes size={22} /></div>
          {(!collapsed || mobile) && <div className="min-w-0"><div className="truncate text-lg font-black italic uppercase tracking-tight text-accent">SubliMod <span className="rounded bg-white/10 px-2 py-1 text-[9px] not-italic text-white">ADMIN</span></div><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">Centro de control</p></div>}
        </button>
        {mobile ? <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Cerrar menú"><X size={20} /></button> : <button onClick={() => setCollapsed(value => !value)} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white" title={collapsed ? "Expandir menú" : "Contraer menú"}>{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>}
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        <button onClick={goDashboard} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition ${dashboardOpen ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`} title="Dashboard"><LayoutDashboard size={20} className="shrink-0" />{(!collapsed || mobile) && <span className="text-sm font-bold">Dashboard</span>}</button>
        <div className="my-4 border-t border-white/5" />
        {NAV.map(({ label, icon: Icon }) => <button key={label} onClick={() => goTab(label)} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-gray-400 transition hover:bg-white/5 hover:text-white" title={label}><Icon size={20} className="shrink-0" />{(!collapsed || mobile) && <span className="text-sm font-bold">{label}</span>}</button>)}
        <button onClick={goTechnology} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-gray-400 transition hover:bg-white/5 hover:text-white" title="Tecnología · Laptops"><Laptop size={20} className="shrink-0" />{(!collapsed || mobile) && <span className="text-sm font-bold">Tecnología · Laptops</span>}</button>
      </nav>
      <div className="border-t border-white/5 p-3"><button onClick={logout} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-red-400 transition hover:bg-red-500/10 hover:text-red-300" title="Cerrar sesión"><LogOut size={20} className="shrink-0" />{(!collapsed || mobile) && <span className="text-sm font-bold">Cerrar sesión</span>}</button></div>
    </aside>
  );

  const cards = [
    { label: "Productos publicados", value: products.length, hint: "Catálogo actual", icon: Package },
    { label: "Categorías activas", value: activeCategories, hint: "Estructura del catálogo", icon: Layers3 },
    { label: "Atributos globales", value: attributes.length, hint: "Opciones reutilizables", icon: Tag },
    { label: "Laptops", value: laptops.length, hint: `${availableLaptops} disponibles`, icon: Laptop },
  ];

  return <>
    {!dashboardOpen && <div data-admin-legacy="visible" className="admin-legacy-content" style={{ "--admin-sidebar-width": collapsed ? "82px" : "286px" } as React.CSSProperties}>{children}</div>}
    <style>{`
      .admin-legacy-content { min-height: 100vh !important; width: calc(100% - var(--admin-sidebar-width)) !important; margin-left: var(--admin-sidebar-width) !important; transition: width 300ms ease, margin-left 300ms ease; }
      .admin-legacy-content > div { min-height: 100vh !important; width: 100% !important; display: block !important; }
      .admin-legacy-content > div > aside { display: none !important; }
      .admin-legacy-content > div > header { display: none !important; }
      .admin-legacy-content > div > main { min-height: 100vh !important; width: 100% !important; margin: 0 !important; }
      .admin-legacy-content > div > main > section:first-child { display: none !important; }
      @media (max-width: 767px) {
        .admin-legacy-content { width: 100% !important; margin-left: 0 !important; padding-top: 72px !important; }
        .admin-legacy-content > div > main { padding: 1rem !important; }
        .admin-legacy-content main header > button,
        .admin-legacy-content main section > header > button { width: auto !important; min-width: 0 !important; max-width: 100% !important; padding: 0.75rem 1.1rem !important; border-radius: 0.9rem !important; gap: 0.45rem !important; font-size: 9px !important; line-height: 1.15 !important; }
        .admin-legacy-content main header > button svg,
        .admin-legacy-content main section > header > button svg { width: 16px !important; height: 16px !important; }
        .admin-legacy-content main header { gap: 0.75rem !important; }
      }
      .admin-mobile-toolbar { display: none; }
      @media (max-width: 767px) {
        .admin-mobile-toolbar { display: flex; }
        .admin-dashboard-main { padding-top: 72px !important; }
      }
    `}</style>
    <div className="pointer-events-none fixed inset-0 z-[1000]">
      <div className="pointer-events-auto fixed left-0 top-0 hidden h-screen md:block"><Sidebar /></div>
      <div className="admin-mobile-toolbar pointer-events-auto fixed left-0 right-0 top-0 z-[1100] h-[68px] items-center gap-3 border-b border-white/5 bg-[#151515]/95 px-4 shadow-lg backdrop-blur-md">
        <button onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#1E1E1E] text-primary shadow-lg" aria-label="Abrir menú administrativo"><Menu size={22} /></button>
        <button onClick={goDashboard} className="min-w-0 text-left"><span className="block truncate text-base font-black italic uppercase tracking-tight text-accent">SubliMod <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] not-italic text-white">ADMIN</span></span><span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-gray-500">Centro de control</span></button>
      </div>
      {mobileOpen && <div className="pointer-events-auto fixed inset-0 z-[1200] flex md:hidden"><div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-[min(86vw,300px)]"><Sidebar mobile /></div></div>}
      {dashboardOpen && <main className="admin-dashboard-main pointer-events-auto fixed inset-0 overflow-y-auto bg-[#121212] text-gray-200" style={{ "--admin-sidebar-width": collapsed ? "82px" : "286px" } as React.CSSProperties}>
        <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-10">
          <header><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Centro de control</p><h1 className="text-4xl font-black tracking-tight md:text-5xl">Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">Una vista práctica del estado del catálogo y la sección de tecnología.</p></header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, hint, icon: Icon }) => <div key={label} className="rounded-[1.5rem] border border-white/5 bg-[#1E1E1E] p-5"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-primary"><Icon size={21} /></div><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p><p className="mt-1 text-4xl font-black text-white">{value}</p><p className="mt-2 text-xs font-semibold text-gray-600">{hint}</p></div>)}</div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7"><div className="mb-5"><h2 className="text-lg font-black uppercase tracking-tight">Actividad reciente</h2><p className="mt-1 text-xs text-gray-600">Últimos productos registrados.</p></div><div className="divide-y divide-white/5">{products.slice(0, 5).map(product => <button key={product.id} onClick={() => goTab("Productos")} className="flex w-full items-center gap-4 py-4 text-left hover:bg-white/[0.02]"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/5">{product.imagenUrl && <img src={product.imagenUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black uppercase text-white">{product.nombre || "Sin nombre"}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-gray-600">{product.categoria || "Sin categoría"}</p></div><ArrowRight size={16} className="text-gray-600" /></button>)}{products.length === 0 && <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-gray-600">No hay productos registrados</div>}</div></section>
            <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7"><div className="mb-5"><h2 className="text-lg font-black uppercase tracking-tight">Accesos rápidos</h2><p className="mt-1 text-xs text-gray-600">Las tareas principales de administración.</p></div><div className="space-y-3"><button onClick={goTechnology} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Laptop className="text-primary" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Tecnología · Laptops</p><p className="mt-1 text-[10px] text-gray-600">{laptops.length} registradas</p></div><ArrowRight size={16} className="text-gray-600"/></button><button onClick={() => goTab("Productos")} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Package className="text-accent" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Administrar catálogo</p><p className="mt-1 text-[10px] text-gray-600">Productos y categorías</p></div><ArrowRight size={16} className="text-gray-600"/></button><button onClick={() => goTab("Configuración")} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Settings className="text-gray-500" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Configuración</p><p className="mt-1 text-[10px] text-gray-600">Datos generales del sitio</p></div><ArrowRight size={16} className="text-gray-600"/></button></div></section>
          </div>
        </div>
      </main>}
    </div>
  </>;
}
