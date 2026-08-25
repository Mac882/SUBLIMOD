"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2, Save, X } from "lucide-react";

export type TechnologyLaptop = {
  id?: string;
  nombre: string;
  marca: string;
  modelo: string;
  sku: string;
  categoria: "Laptops";
  precio: number;
  moneda: "USD" | "NIO";
  precioAnterior: number;
  disponibilidad: "Disponible" | "Reservada" | "Vendida";
  estado: "Nuevo" | "Como nuevo" | "Usado - Excelente" | "Usado - Muy bueno" | "Reacondicionado";
  descripcionEstado: string;
  color: string;
  touchscreen: "Touch" | "No touch" | "";
  procesador: string;
  ram: string;
  almacenamiento: string;
  tipoAlmacenamiento: string;
  grafica: string;
  pantalla: string;
  resolucion: string;
  sistemaOperativo: string;
  bateria: string;
  cargador: string;
  conectividad: string;
  puertos: string;
  pruebasRealizadas: string;
  garantia: boolean;
  garantiaDetalle: string;
  descripcionCorta: string;
  descripcion: string;
  incluye: string[];
  imagenUrl: string;
  imagenes: string[];
  destacado: boolean;
};

const emptyProduct: TechnologyLaptop = {
  nombre: "",
  marca: "",
  modelo: "",
  sku: "",
  categoria: "Laptops",
  precio: 0,
  moneda: "USD",
  precioAnterior: 0,
  disponibilidad: "Disponible",
  estado: "Usado - Excelente",
  descripcionEstado: "",
  color: "",
  touchscreen: "",
  procesador: "",
  ram: "",
  almacenamiento: "",
  tipoAlmacenamiento: "SSD NVMe",
  grafica: "",
  pantalla: "",
  resolucion: "",
  sistemaOperativo: "",
  bateria: "",
  cargador: "Original incluido",
  conectividad: "Wi-Fi, Bluetooth",
  puertos: "",
  pruebasRealizadas: "Equipo probado y funcional.",
  garantia: true,
  garantiaDetalle: "30 días por funcionamiento",
  descripcionCorta: "",
  descripcion: "",
  incluye: ["Laptop", "Cargador"],
  imagenUrl: "",
  imagenes: [],
  destacado: false,
};

type Props = {
  productToEdit?: TechnologyLaptop | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function TechnologyProductForm({ productToEdit, onClose, onSaved }: Props) {
  const [form, setForm] = useState<TechnologyLaptop>(productToEdit ?? emptyProduct);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(productToEdit ?? emptyProduct);
    setNewImages([]);
    setError("");
  }, [productToEdit]);

  const set = <K extends keyof TechnologyLaptop>(key: K, value: TechnologyLaptop[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    setNewImages((current) => [...current, ...Array.from(files)]);
  };

  const removeExistingImage = (url: string) => {
    const remaining = form.imagenes.filter((item) => item !== url);
    set("imagenes", remaining);
    if (form.imagenUrl === url) set("imagenUrl", remaining[0] ?? "");
  };

  const removePendingImage = (index: number) => {
    setNewImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.marca.trim() || !form.modelo.trim() || form.precio <= 0) {
      setError("Completa nombre, marca, modelo y un precio válido.");
      return;
    }

    setSaving(true);
    try {
      const uploaded: string[] = [];
      for (const file of newImages) {
        const storageRef = ref(storage, `tecnologia/laptops/${Date.now()}_${file.name}`);
        const result = await uploadBytes(storageRef, file);
        uploaded.push(await getDownloadURL(result.ref));
      }

      const allImages = [...form.imagenes, ...uploaded];
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        sku: form.sku.trim(),
        color: form.color.trim(),
        precio: Number(form.precio),
        precioAnterior: Number(form.precioAnterior || 0),
        imagenUrl: form.imagenUrl || allImages[0] || "",
        imagenes: allImages,
        updatedAt: serverTimestamp(),
      };

      if (form.id) {
        await updateDoc(doc(db, "tecnologia_productos", form.id), payload);
      } else {
        await addDoc(collection(db, "tecnologia_productos"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la laptop. Revisa Firebase y vuelve a intentarlo.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-primary";
  const labelClass = "mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500";
  const optionCard = (selected: boolean) => `rounded-2xl border px-4 py-3 transition ${selected ? "border-primary bg-primary/10 text-white" : "border-white/10 bg-black/20 text-gray-400 hover:border-white/20"}`;

  return (
    <div className="fixed inset-0 z-[400] overflow-y-auto bg-black/90 p-4 backdrop-blur-md">
      <form onSubmit={handleSave} className="mx-auto my-8 max-w-6xl rounded-[2rem] border border-white/10 bg-[#171717] p-5 shadow-2xl md:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">SubliMod / Tecnología</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">{form.id ? "Editar laptop" : "Nueva laptop"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-white/5 p-3 text-gray-400 hover:text-white"><X /></button>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-300">{error}</div>}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["nombre", "Nombre comercial"], ["marca", "Marca"], ["modelo", "Modelo"], ["sku", "SKU"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className={labelClass}>{label}</span>
              <input className={inputClass} value={String(form[key as keyof TechnologyLaptop] ?? "")} onChange={(e) => set(key as keyof TechnologyLaptop, e.target.value as never)} />
            </label>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-primary">Precio y disponibilidad</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <label><span className={labelClass}>Precio</span><input type="number" min="0" step="0.01" className={inputClass} value={form.precio} onChange={(e) => set("precio", Number(e.target.value))} /></label>
            <label><span className={labelClass}>Moneda</span><select className={inputClass} value={form.moneda} onChange={(e) => set("moneda", e.target.value as TechnologyLaptop["moneda"])}><option value="USD">USD</option><option value="NIO">NIO</option></select></label>
            <label><span className={labelClass}>Precio anterior</span><input type="number" min="0" step="0.01" className={inputClass} value={form.precioAnterior} onChange={(e) => set("precioAnterior", Number(e.target.value))} /></label>
            <label><span className={labelClass}>Disponibilidad</span><select className={inputClass} value={form.disponibilidad} onChange={(e) => set("disponibilidad", e.target.value as TechnologyLaptop["disponibilidad"])}><option>Disponible</option><option>Reservada</option><option>Vendida</option></select></label>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-primary">Estado del equipo</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label><span className={labelClass}>Estado</span><select className={inputClass} value={form.estado} onChange={(e) => set("estado", e.target.value as TechnologyLaptop["estado"])}><option>Nuevo</option><option>Como nuevo</option><option>Usado - Excelente</option><option>Usado - Muy bueno</option><option>Reacondicionado</option></select></label>
            <label><span className={labelClass}>Color</span><input className={inputClass} value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej. Negro" /></label>
            <label><span className={labelClass}>Detalles físicos</span><input className={inputClass} value={form.descripcionEstado} onChange={(e) => set("descripcionEstado", e.target.value)} placeholder="Ej. Leves marcas de uso en la tapa" /></label>
          </div>

          <div className="mt-5">
            <span className={labelClass}>Pantalla táctil</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => set("touchscreen", "Touch")} className={optionCard(form.touchscreen === "Touch")}>
                <span className="block text-sm font-black uppercase tracking-widest">✋ Touch</span>
                <span className="mt-1 block text-[10px] text-gray-500">Pantalla táctil</span>
              </button>
              <button type="button" onClick={() => set("touchscreen", "No touch")} className={optionCard(form.touchscreen === "No touch")}>
                <span className="block text-sm font-black uppercase tracking-widest">○ No touch</span>
                <span className="mt-1 block text-[10px] text-gray-500">Pantalla no táctil</span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-primary">Especificaciones</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {([
              ["procesador", "Procesador"], ["ram", "RAM"], ["almacenamiento", "Almacenamiento"], ["tipoAlmacenamiento", "Tipo de almacenamiento"], ["grafica", "Gráficos"], ["pantalla", "Pantalla"], ["resolucion", "Resolución"], ["sistemaOperativo", "Sistema operativo"], ["bateria", "Batería"], ["cargador", "Cargador"], ["conectividad", "Conectividad"], ["puertos", "Puertos"],
            ] as const).map(([key, label]) => (
              <label key={key}><span className={labelClass}>{label}</span><input className={inputClass} value={form[key]} onChange={(e) => set(key, e.target.value)} /></label>
            ))}
          </div>
          <label className="mt-5 block"><span className={labelClass}>Pruebas realizadas</span><textarea className={`${inputClass} min-h-24`} value={form.pruebasRealizadas} onChange={(e) => set("pruebasRealizadas", e.target.value)} /></label>
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-primary">Garantía y contenido</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-4"><input type="checkbox" checked={form.garantia} onChange={(e) => set("garantia", e.target.checked)} /><span className="text-xs font-bold text-white">Incluye garantía</span></label>
            <label><span className={labelClass}>Detalle de garantía</span><input className={inputClass} value={form.garantiaDetalle} onChange={(e) => set("garantiaDetalle", e.target.value)} /></label>
          </div>
          <label className="mt-5 block"><span className={labelClass}>Incluye (separado por comas)</span><input className={inputClass} value={form.incluye.join(", ")} onChange={(e) => set("incluye", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-primary">Descripción comercial</h3>
          <label className="block"><span className={labelClass}>Descripción corta</span><input className={inputClass} value={form.descripcionCorta} onChange={(e) => set("descripcionCorta", e.target.value)} /></label>
          <label className="mt-5 block"><span className={labelClass}>Descripción completa</span><textarea className={`${inputClass} min-h-32`} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} /></label>
        </section>

        <section className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Galería</h3><p className="mt-1 text-[11px] text-gray-500">La primera imagen será la portada si no eliges otra.</p></div>
            <label className="cursor-pointer rounded-2xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"><ImagePlus size={16} className="mr-2 inline" /> Agregar imágenes<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} /></label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {form.imagenes.map((url) => <div key={url} className="relative overflow-hidden rounded-2xl border border-white/10"><img src={url} alt="" className="aspect-square w-full object-cover" /><button type="button" onClick={() => removeExistingImage(url)} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"><X size={14} /></button></div>)}
            {newImages.map((file, index) => <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-primary/40 bg-black/20 p-3"><p className="truncate text-[10px] font-bold text-gray-300">{file.name}</p><button type="button" onClick={() => removePendingImage(index)} className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-[9px] font-black uppercase text-gray-400">Quitar</button></div>)}
          </div>
        </section>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/5 pt-6 md:flex-row md:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white">Cancelar</button>
          <button disabled={saving} className="rounded-2xl bg-primary px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 disabled:opacity-50">{saving ? <><Loader2 className="mr-2 inline animate-spin" size={16} /> Guardando</> : <><Save className="mr-2 inline" size={16} /> Guardar laptop</>}</button>
        </div>
      </form>
    </div>
  );
}
