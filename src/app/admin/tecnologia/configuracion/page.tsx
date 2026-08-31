"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/admin/AuthGuard";
import { defaultTechnologyHomeConfig, saveTechnologyHomeConfig, subscribeTechnologyHomeConfig, type TechnologyHomeConfig } from "@/lib/technology/homeConfig";
import { removeTechnologyHomeImage, uploadTechnologyHomeImage } from "@/lib/technology/imageStorage";
import { defaultTechnologyWhatsappConfig, saveTechnologyWhatsapp, subscribeTechnologyWhatsapp } from "@/lib/technology/whatsapp";

export default function TechnologyHomeSettingsPage() {
  const [config, setConfig] = useState<TechnologyHomeConfig>(defaultTechnologyHomeConfig);
  const [phone, setPhone] = useState(defaultTechnologyWhatsappConfig.phone);
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");

  useEffect(() => subscribeTechnologyHomeConfig(setConfig), []);
  useEffect(() => subscribeTechnologyWhatsapp((next) => setPhone(next.phone)), []);

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
  const savePhone = async () => { setSavingPhone(true); setPhoneMessage(""); try { await saveTechnologyWhatsapp(phone); setPhoneMessage("Número de WhatsApp actualizado correctamente."); } catch (error) { console.error(error); setPhoneMessage("No se pudo guardar el número de WhatsApp."); } finally { setSavingPhone(false); } };

  return <AuthGuard><main className="min-h-screen bg-[#111] p-5 text-white md:p-10"><div className="mx-auto max-w-5xl"><Link href="/admin/tecnologia" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white">← Volver a Tecnología</Link><header className="mt-6"><p className="text-xs font-black uppercase tracking-[0.3em] text-primary">SubliMod / Tecnología</p><h1 className="mt-2 text-3xl font-black uppercase">Configuración de inicio</h1><p className="mt-2 max-w-2xl text-sm text-gray-400">Administra la presentación que verá el cliente al entrar a Tecnología.</p></header>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"><div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start"><div><h2 className="text-lg font-black uppercase">Imagen principal</h2><p className="mt-2 text-sm text-gray-500">Una imagen horizontal que represente la sección. Se almacena en Firebase Storage.</p><div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">{config.imageUrl ? <img src={config.imageUrl} alt="Vista previa de tecnología" className="aspect-[16/7] w-full object-cover" /> : <div className="flex aspect-[16/7] items-center justify-center text-sm text-gray-600">Sin imagen configurada</div>}</div><div className="mt-4 flex flex-wrap gap-3"><label className="cursor-pointer rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase">{uploading ? "Procesando..." : "Subir / reemplazar imagen"}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); e.currentTarget.value = ""; }} /></label>{config.imageUrl && <button type="button" disabled={uploading} onClick={() => void removeImage()} className="rounded-xl bg-red-500/10 px-5 py-3 text-xs font-black uppercase text-red-300">Eliminar imagen</button>}</div></div>
      <div className="space-y-5"><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Etiqueta<input value={config.eyebrow} onChange={(e) => setConfig({ ...config, eyebrow: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Título<input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /></label><label className="block text-xs font-black uppercase tracking-wider text-gray-500">Descripción<textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} className="mt-2 min-h-28 w-full rounded-xl bg-black/30 p-3 text-white" /></label><button type="button" disabled={saving} onClick={() => void save()} className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase disabled:opacity-50">{saving ? "Guardando..." : "Guardar configuración"}</button>{message && <p className="text-sm text-gray-400">{message}</p>}</div></div></section>

    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.2-3.5-8.3Zm-8.4 18.1h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-3.9 1 1-3.8-.2-.3a9.8 9.8 0 1 1 8.3 4.7Zm5.4-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.7-.8-2.8-1.4-3.9-3.2-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2.8.3 1.4.5 1.9.7.8.2 1.5.2 2 .1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" /></svg></span><div><h2 className="text-lg font-black uppercase">WhatsApp de Tecnología</h2><p className="mt-1 text-sm text-gray-500">El botón “Realizar pedido” de las fichas abrirá WhatsApp con este número y el producto consultado.</p></div></div><label className="mt-6 block text-xs font-black uppercase tracking-wider text-gray-500">Número de WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="50586153695" className="mt-2 w-full rounded-xl bg-black/30 p-3 text-white" /><span className="mt-2 block text-xs font-normal normal-case text-gray-500">Usa código de país. Se guardan únicamente los dígitos.</span></label><div className="mt-5 flex flex-wrap items-center gap-4"><button type="button" disabled={savingPhone} onClick={() => void savePhone()} className="rounded-xl bg-[#25D366] px-6 py-3 text-sm font-black uppercase text-white disabled:opacity-50">{savingPhone ? "Guardando..." : "Guardar WhatsApp"}</button>{phoneMessage && <p className="text-sm text-gray-400">{phoneMessage}</p>}</div></section>
  </div></main></AuthGuard>;
}
