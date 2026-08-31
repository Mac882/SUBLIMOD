"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { db, storage } from "@/lib/firebase";

type HomeConfig = {
  homeHeroTitle: string;
  homeHeroDescription: string;
  homeHeroImageUrl: string;
  homeHeroImagePath: string;
  homeTechnologyTitle: string;
  homeTechnologyDescription: string;
};

const DEFAULTS: HomeConfig = {
  homeHeroTitle: "Personaliza tus momentos",
  homeHeroDescription:
    "Productos sublimables de calidad para convertir tus ideas en piezas únicas, con color, detalle y ese toque que hace la diferencia.",
  homeHeroImageUrl: "",
  homeHeroImagePath: "",
  homeTechnologyTitle: "Laptops seleccionadas para trabajar, crear y avanzar",
  homeTechnologyDescription:
    "Una segunda línea de productos pensada para acompañarte en el trabajo, el estudio y tus proyectos.",
};

export default function HomeSettings() {
  const [config, setConfig] = useState<HomeConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, "configuracion", "general"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setConfig((current) => ({ ...current, ...DEFAULTS, ...data }));
    });
  }, []);

  const saveText = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "configuracion", "general"),
        {
          homeHeroTitle: config.homeHeroTitle.trim(),
          homeHeroDescription: config.homeHeroDescription.trim(),
          homeTechnologyTitle: config.homeTechnologyTitle.trim(),
          homeTechnologyDescription: config.homeTechnologyDescription.trim(),
        },
        { merge: true }
      );
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const uploadHeroImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      if (config.homeHeroImagePath) {
        try {
          await deleteObject(ref(storage, config.homeHeroImagePath));
        } catch (error) {
          console.warn("No se pudo eliminar la imagen anterior del Home", error);
        }
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `configuracion/home/hero/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const next = {
        ...config,
        homeHeroImageUrl: url,
        homeHeroImagePath: path,
      };

      await setDoc(doc(db, "configuracion", "general"), next, { merge: true });
      setConfig(next);
    } catch (error) {
      console.error("Error al subir imagen del Home", error);
      alert("No se pudo subir la imagen. Verifica la configuración de Firebase Storage.");
    } finally {
      setUploading(false);
    }
  };

  const removeHeroImage = async () => {
    if (!config.homeHeroImageUrl && !config.homeHeroImagePath) return;

    setUploading(true);
    try {
      if (config.homeHeroImagePath) {
        try {
          await deleteObject(ref(storage, config.homeHeroImagePath));
        } catch (error) {
          console.warn("No se pudo eliminar el archivo del Storage", error);
        }
      }

      const next = {
        ...config,
        homeHeroImageUrl: "",
        homeHeroImagePath: "",
      };
      await setDoc(doc(db, "configuracion", "general"), next, { merge: true });
      setConfig(next);
    } catch (error) {
      console.error("Error al eliminar imagen del Home", error);
      alert("No se pudo eliminar la imagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-8 border-t border-white/5 pt-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Home</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Contenido principal</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Administra únicamente el contenido que cambia en la portada. La imagen se gestiona con subir, cambiar o eliminar.
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Imagen principal</label>
        {config.homeHeroImageUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            <div className="aspect-[16/7] w-full bg-[#151515]">
              <img src={config.homeHeroImageUrl} alt="Vista previa del Home" className="h-full w-full object-contain" />
            </div>
            <button
              type="button"
              onClick={removeHeroImage}
              disabled={uploading}
              className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        ) : (
          <div className="flex min-h-44 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
            <div>
              <ImagePlus className="mx-auto text-primary" size={34} />
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-gray-400">Sin imagen principal</p>
            </div>
          </div>
        )}
        <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary-dark ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? "Procesando..." : config.homeHeroImageUrl ? "Cambiar imagen" : "Subir imagen"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={uploadHeroImage} />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Título del Home</label>
          <input value={config.homeHeroTitle} onChange={(e) => setConfig({ ...config, homeHeroTitle: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-bold text-white outline-none focus:border-primary" />
        </div>
        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Descripción del Home</label>
          <textarea value={config.homeHeroDescription} onChange={(e) => setConfig({ ...config, homeHeroDescription: e.target.value })} className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-medium leading-6 text-white outline-none focus:border-primary" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Título de Tecnología</label>
          <input value={config.homeTechnologyTitle} onChange={(e) => setConfig({ ...config, homeTechnologyTitle: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-bold text-white outline-none focus:border-primary" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Descripción de Tecnología</label>
          <textarea value={config.homeTechnologyDescription} onChange={(e) => setConfig({ ...config, homeTechnologyDescription: e.target.value })} className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-medium leading-6 text-white outline-none focus:border-primary" />
        </div>
      </div>

      <button type="button" onClick={saveText} disabled={saving} className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary-dark disabled:opacity-60">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saved ? "Guardado" : "Guardar contenido del Home"}
      </button>
    </section>
  );
}
