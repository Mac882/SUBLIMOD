"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/admin/AuthGuard";
import { defaultTechnologyHomeConfig, saveTechnologyHomeConfig, subscribeTechnologyHomeConfig, type TechnologyHomeConfig } from "@/lib/technology/homeConfig";
import { removeTechnologyHomeImage, uploadTechnologyHomeImage } from "@/lib/technology/imageStorage";

export default function TechnologyHomeSettingsPage() {
  const [config, setConfig] = useState<TechnologyHomeConfig>(defaultTechnologyHomeConfig);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => subscribeTechnologyHomeConfig(setConfig), []);

  const uploadImage = async (file: File) => {
    setUploading(true); setMessage("");
    try {
      if (config.imageUrl) await removeTechnologyHomeImage(config.imageUrl);
      const imageUrl = await uploadTechnologyHomeImage(file);
      setConfig((current) => ({ ...current, imageUrl }));
      await saveTechnologyHomeConfig({ ...config, imageUrl });
      setMessage("Imagen actualizada correctamente.");
    } catch (error) { console.error(error); setMessage("No se pudo actualizar la imagen."); }
    finally { setUploading(false); }
  };

  const removeImage = async () => {
    if (!config.imageUrl) return;
    setUploading(true); setMessage("");
    try { await removeTechnologyHomeImage(config.imageUrl); const next = { ...config, imageUrl: "" }; setConfig(next); await saveTechnologyHomeConfig(next); setMessage("Imagen eliminada."); }
    catch (error) { console.error(error); setMessage("No se pudo eliminar la imagen."); }
    finally { setUploading(false); }
  };

  const save = async () => { setSaving(true); setMessage(""); try { await saveTechnologyHomeConfig(config); setMessage("Configuración guardada."); } catch (error) { console.error(error); setMessage("No se pudo guardar la configuración."); } finally { setSaving(false); } };

  return <AuthGuard><main className="min-h-screen bg-[#111] p-5 text-white md:p-10"><div className="mx-auto max-w-5xl"><Link href="/admin/tecnologia" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white">← Volver a Tecnología</Link><header className="mt-6"><p className="text-xs font-black uppercase tracking-[0.3em] text-primary">SubliMod / Tecnología</p><h1 className="mt-2 text-3xl font-black uppercase">Configuración de inicio</h1><p className="mt-2 max-w-2xl text-sm text-gray-400">Administra la presentación que verá el cliente al entrar a Tecnología.</p></header>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"><div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start"><div><h2 className="text-lg font-black uppercase">Imagen principal</h2><p className="mt-2 text-sm text-gray-500">Una imagen horizontal que represente la sección. Se almacena en Firebase Storage.</p><div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">{config.imageUrl ? <img src={config.imageUrl} alt="Vista previa de tecnología" className="aspect-[16/7] w-full object-cover" /> : <div className="flex aspect-[16/7] items-center justify-center text-sm text-gray-600">Sin imagen configurada</div>}</div><div className="mt-4 flex flex-wrap gap-3"><label className="cursor-pointer rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase">{uploading ? "Procesando..." : "Subir / reemplazar imagen"}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); e.currentTarget.value = ""; }} /></label>{config.imageUrl && <button type="button" disabled={uploading} onClick={() => void removeImage()} className="rounded-xl bg-red-500/10 px-5 py-3 text-xs font-black uppercase text-red-300">Eliminar imagen</button>}</div></div>
      <div className="space-y-5"><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Etiqueta<input value={config.eyebrow} onChange={(e) => setConfig({ ...config, eyebrow: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Título<input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Descripción<textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} className="mt-2 min-h-28 w-full rounded-xl bg-black/30 p-3 text-white" /></label><button type="button" disabled={saving} onClick={() => void save()} className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase disabled:opacity-50">{saving ? "Guardando..." : "Guardar configuración"}</button>{message && <p className="text-sm text-gray-400">{message}</p>}</div></div></section>
  </div></main></AuthGuard>;
}
