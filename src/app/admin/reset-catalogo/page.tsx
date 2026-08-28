"use client";
import { useState } from "react";
import AuthGuard from "@/components/admin/AuthGuard";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { AlertTriangle, Trash2, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const COLLECTIONS = ["productos", "atributos_globales", "categorias"];

async function deleteFirestoreCollection(name: string) {
  const snap = await getDocs(collection(db, name));
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 450).forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
  return snap.size;
}

async function deleteStorageFolder(path: string) {
  const result = await listAll(ref(storage, path));
  await Promise.all(result.items.map(item => deleteObject(item)));
  await Promise.all(result.prefixes.map(prefix => deleteStorageFolder(prefix.fullPath)));
  return result.items.length;
}

export default function ResetCatalogoPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const resetCatalog = async () => {
    if (busy) return;
    setBusy(true); setDone(false); setMessage("");
    try {
      const counts = await Promise.all(COLLECTIONS.map(deleteFirestoreCollection));
      const storageCounts = await Promise.all([deleteStorageFolder("productos"), deleteStorageFolder("categorias")]);
      setDone(true);
      setMessage(`Catálogo eliminado: ${counts[0]} productos, ${counts[1]} atributos, ${counts[2]} categorías y ${storageCounts[0] + storageCounts[1]} imágenes.`);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo completar el reinicio. Revisa las reglas de Firebase y vuelve a intentarlo.");
    } finally { setBusy(false); }
  };

  return <AuthGuard><main className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6"><div className="w-full max-w-xl bg-[#1E1E1E] rounded-[2.5rem] border border-red-500/20 p-10 shadow-2xl space-y-8"><Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase"><ArrowLeft size={16}/> Volver al Admin</Link><div className="text-center space-y-4"><div className="bg-red-500/10 text-red-500 w-fit mx-auto p-5 rounded-full"><AlertTriangle size={42}/></div><h1 className="text-3xl font-black uppercase">Reiniciar Catálogo</h1><p className="text-gray-500 text-sm leading-relaxed">Esta operación eliminará permanentemente las colecciones <b>productos</b>, <b>atributos_globales</b> y <b>categorias</b>, además de las imágenes almacenadas en las carpetas correspondientes. No elimina la configuración general ni las cuentas de acceso.</p></div>{done ? <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl p-5 flex gap-3 items-start"><CheckCircle className="shrink-0"/><span>{message}</span></div> : <button onClick={resetCatalog} disabled={busy} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">{busy ? <><Loader2 className="animate-spin"/> Eliminando...</> : <><Trash2/> Eliminar catálogo actual</>}</button>}{message && !done && <p className="text-red-400 text-xs text-center">{message}</p>}</div></main></AuthGuard>;
}
