"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  ArrowRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Laptop,
  Layers3,
  LogOut,
  Menu,
  Package,
  Settings,
  Tag,
  X,
} from "lucide-react";

type Item = Record<string, any> & { id: string };

const NAV = [
  { label: "Productos", icon: Package },
  { label: "Categorías", icon: Layers3 },
  { label: "Atributos / Unidades", icon: Tag },
  { label: "Configuración", icon: Settings },
];

function clickLegacyTab(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find((node) => {
    const text = node.textContent?.replace(/\s+/g, " ").trim().toLowerCase();
    return text === label.toLowerCase();
  }) as HTMLButtonElement | undefined;
  button?.click();
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
      onSnapshot(query(collection(db, "productos"), orderBy("createdAt", "desc")), (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "categorias"), orderBy("nombre", "asc")), (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "atributos_globales"), orderBy("nombreAtributo", "asc")), (snap) => setAttributes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "tecnologia_productos"), orderBy("createdAt", "desc")), (snap) => setLaptops(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsub.forEach((stop) => stop());
  }, [isMainAdmin]);

  useEffect(() => {
    if (pathname !== "/admin") {
      setDashboardOpen(false);
      setMobileOpen(false);
    }
  }, [pathname]);

  const availableLaptops = useMemo(
    () => laptops.filter((item) => String(item.disponibilidad || "").toLowerCase().includes("dispon")).length,
    [laptops]
  );
  const activeCategories = useMemo(() => categories.filter((item) => item.activa !== false).length, [categories]);

  if (!isMainAdmin) return <>{children}</>;

  const goDashboard = () => {
    setDashboardOpen(true);
    setMobileOpen(false);
    clickLegacyTab("Resumen");
  };

  const goTab = (label: string) => {
    setDashboardOpen(false);
    setMobileOpen(false);
    window.setTimeout(() => clickLegacyTab(label), 0);
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
    <aside className={`${mobile ? "w-[290px]" : collapsed ? "w-[82px]" : "w-[286px]"} flex h-full flex-col border-r border-white/10 bg-[#191919] shadow-2xl transition-all duration-300`}>
      <div className={`${collapsed && !mobile ? "px-3" : "px-6"} flex items-center justify-between border-b border-white/5 py-6`}>
        <button onClick={goDashboard} className="flex min-w-0 items-center gap-3 text-left" title="Ir al Dashboard">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Boxes size={22} /></div>
          {(!collapsed || mobile) && <div className="min-w-0"><div className="truncate text-lg font-black italic uppercase tracking-tight text-accent">SubliMod <span className="rounded bg-white/10 px-2 py-1 text-[9px] not-italic text-white">ADMIN</span></div><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">Centro de control</p></div>}
        </button>
        {mobile ? <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"><X size={20} /></button> : <button onClick={() => setCollapsed((value) => !value)} className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white" title={collapsed ? "Expandir menú" : "Contraer menú"}>{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        <button onClick={goDashboard} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition ${dashboardOpen ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`} title="Dashboard">
          <LayoutDashboard size={20} className="shrink-0" />{(!collapsed || mobile) && <span className="text-sm font-bold">Dashboard</span>}
        </button>
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
    {children}
    <div className="pointer-events-none fixed inset-0 z-[1000]">
      <div className="pointer-events-auto fixed left-0 top-0 hidden h-screen md:block"><Sidebar /></div>
      <div className="pointer-events-auto fixed left-0 top-0 md:hidden"><button onClick={() => setMobileOpen(true)} className="m-4 rounded-2xl border border-white/10 bg-[#191919] p-3 text-primary shadow-xl" aria-label="Abrir menú administrativo"><Menu size={23} /></button></div>
      {mobileOpen && <div className="pointer-events-auto fixed inset-0 flex md:hidden"><div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><div className="relative h-full"><Sidebar mobile /></div></div>}

      {dashboardOpen && <main className="pointer-events-auto fixed inset-0 overflow-y-auto bg-[#121212] text-gray-200" style={{ left: collapsed ? 82 : 286 }}>
        <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-10">
          <header><p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Centro de control</p><h1 className="text-3xl font-black tracking-tight md:text-5xl">Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">Una vista práctica del estado del catálogo y la sección de tecnología.</p></header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, hint, icon: Icon }) => <div key={label} className="rounded-[1.75rem] border border-white/5 bg-[#1E1E1E] p-5"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-primary"><Icon size={21} /></div><p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p><p className="mt-1 text-4xl font-black text-white">{value}</p><p className="mt-2 text-xs font-semibold text-gray-600">{hint}</p></div>)}</div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7"><div className="mb-5"><h2 className="text-lg font-black uppercase tracking-tight">Actividad reciente</h2><p className="mt-1 text-xs text-gray-600">Últimos productos registrados.</p></div><div className="divide-y divide-white/5">{products.slice(0, 5).map((product) => <button key={product.id} onClick={() => goTab("Productos")} className="flex w-full items-center gap-4 py-4 text-left hover:bg-white/[0.02]"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/5">{product.imagenUrl && <img src={product.imagenUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black uppercase text-white">{product.nombre || "Sin nombre"}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-gray-600">{product.categoria || "Sin categoría"}</p></div><ArrowRight size={16} className="text-gray-600" /></button>)}{products.length === 0 && <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-gray-600">No hay productos registrados</div>}</div></section>
            <section className="rounded-[2rem] border border-white/5 bg-[#1E1E1E] p-5 md:p-7"><div className="mb-5"><h2 className="text-lg font-black uppercase tracking-tight">Accesos rápidos</h2><p className="mt-1 text-xs text-gray-600">Las tareas principales de administración.</p></div><div className="space-y-3"><button onClick={goTechnology} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Laptop className="text-primary" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Tecnología · Laptops</p><p className="mt-1 text-[10px] text-gray-600">{laptops.length} registradas</p></div><ArrowRight size={16} className="text-gray-600"/></button><button onClick={() => goTab("Productos")} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Package className="text-accent" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Administrar catálogo</p><p className="mt-1 text-[10px] text-gray-600">Productos y categorías</p></div><ArrowRight size={16} className="text-gray-600"/></button><button onClick={() => goTab("Configuración")} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left hover:border-primary/30"><Settings className="text-gray-500" size={20}/><div className="flex-1"><p className="text-xs font-black uppercase">Configuración</p><p className="mt-1 text-[10px] text-gray-600">Datos generales del sitio</p></div><ArrowRight size={16} className="text-gray-600"/></button></div></section>
          </div>
        </div>
      </main>}
    </div>
  </>;
}
