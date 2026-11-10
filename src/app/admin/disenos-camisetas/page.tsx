"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/admin/AuthGuard";
import { createShirtDesign, deleteShirtDesign, subscribeShirtDesigns, updateShirtDesign, type ShirtDesign } from "@/lib/shirtDesigns";

const emptyForm = { name: "", description: "", colors: "", published: true };

function ShirtDesignManager() {
  const [designs, setDesigns] = useState<ShirtDesign[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ShirtDesign | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeShirtDesigns(setDesigns), []);

  const reset = () => { setForm(emptyForm); setEditing(null); setImage(null); };
  const edit = (item: ShirtDesign) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, colors: item.colors.join(", "), published: item.published });
    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setError("");
    if (!form.name.trim() || (!editing && !image)) return setError("Escribe el nombre y carga la imagen final de la camiseta.");
    const data = { name: form.name.trim(), description: form.description.trim(), colors: form.colors.split(",").map((color) => color.trim()).filter(Boolean), published: form.published };
    setSaving(true);
    try {
      if (editing) await updateShirtDesign(editing.id, data, image || undefined);
      else if (image) await createShirtDesign(data, image);
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el diseño.");
    } finally { setSaving(false); }
  };

  return <AuthGuard><main className="min-h-screen bg-[#121212] px-4 py-8 text-gray-200 md:px-8"><div className="mx-auto max-w-6xl">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin/dashboard" className="text-xs font-bold text-primary">← Panel de control</Link><h1 className="mt-3 text-3xl font-black">Diseños de camisetas</h1><p className="mt-2 text-sm text-gray-500">Sube la camiseta ya diseñada y administra cómo aparece en el catálogo.</p></div><Link href="/disenos-camisetas" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold hover:border-primary">Ver catálogo público</Link></div>
    <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-7"><h2 className="text-lg font-black">{editing ? "Editar diseño" : "Agregar diseño"}</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-xs font-bold uppercase text-gray-500">Nombre<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white" placeholder="Ej. Camiseta personalizada" /></label>
      <label className="text-xs font-bold uppercase text-gray-500">Colores disponibles <span className="normal-case">(separados por coma)</span><input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white" placeholder="Negro, blanco, azul" /></label>
      <label className="text-xs font-bold uppercase text-gray-500 md:col-span-2">Descripción<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl bg-black/30 p-3 text-sm text-white" placeholder="Describe brevemente el diseño" /></label>
      <label className="text-xs font-bold uppercase text-gray-500">Imagen final de camiseta<input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl bg-black/30 p-3 text-sm normal-case text-gray-300" />{editing && <span className="mt-1 block text-[10px] normal-case">Deja vacío para mantener la imagen actual.</span>}</label>
      <label className="flex items-center gap-3 self-center text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Publicado en el catálogo</label>
    </div>{error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}<div className="mt-5 flex justify-end gap-3">{editing && <button onClick={reset} className="rounded-xl bg-white/10 px-4 py-3 text-xs font-bold">Cancelar</button>}<button disabled={saving} onClick={() => void save()} className="rounded-xl bg-primary px-5 py-3 text-xs font-black text-white disabled:opacity-50">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar diseño"}</button></div></section>
    <section className="space-y-3">{designs.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-xl bg-black object-cover"/><div className="min-w-48 flex-1"><h2 className="font-black">{item.name}</h2><p className="mt-1 text-xs text-gray-500">{item.colors.join(" · ") || "Sin colores indicados"}</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${item.published ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-gray-400"}`}>{item.published ? "Publicado" : "Oculto"}</span></div><div className="flex gap-2"><button onClick={() => void updateShirtDesign(item.id, { published: !item.published })} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">{item.published ? "Ocultar" : "Publicar"}</button><button onClick={() => edit(item)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">Editar</button><button onClick={() => { if (window.confirm(`¿Eliminar ${item.name}?`)) void deleteShirtDesign(item.id); }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">Eliminar</button></div></article>)}{designs.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">Todavía no hay diseños.</p>}</section>
  </div></main></AuthGuard>;
}

export default function AdminShirtDesignsPage() { return <ShirtDesignManager />; }
