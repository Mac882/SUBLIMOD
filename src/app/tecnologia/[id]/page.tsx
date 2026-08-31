"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams } from "next/navigation";
import type { TechnologyCategory, TechnologyProduct } from "@/lib/technology/types";
import { technologyCategoriesCollection, technologyProductsCollection } from "@/lib/technology/repository";

export default function TecnologiaProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<TechnologyProduct | null>(null);
  const [category, setCategory] = useState<TechnologyCategory | null>(null);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, technologyProductsCollection, id), (snapshot) => setProduct(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<TechnologyProduct, "id">) } : null));
  }, [id]);

  useEffect(() => {
    if (!product?.categoryId) return;
    return onSnapshot(doc(db, technologyCategoriesCollection, product.categoryId), (snapshot) => setCategory(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<TechnologyCategory, "id">) } : null));
  }, [product?.categoryId]);

  if (!product) return <main><Navbar /><p>Producto no encontrado.</p><Link href="/tecnologia">Volver a tecnología</Link><Footer /></main>;

  return <main><Navbar /><section><Link href="/tecnologia">Volver a tecnología</Link><p>{category?.name || "Tecnología"}</p><h1>{product.name}</h1><p>{product.brand} · {product.model}</p><p>{product.currency === "USD" ? "$" : "C$"} {Number(product.price).toLocaleString()}</p>{product.shortDescription && <p>{product.shortDescription}</p>}</section><section><h2>Especificaciones</h2>{category?.specificationFields?.map((field) => { const value = product.specifications?.[field.id]; if (value === undefined || value === "") return null; return <div key={field.id}><strong>{field.label}</strong><span>{String(value)}</span></div>; })}</section><section>{product.description && <><h2>Descripción</h2><p>{product.description}</p></>}{product.warranty && <p>Garantía: {product.warrantyDetail}</p>}{product.tests && <p>Pruebas: {product.tests}</p>}</section><Footer /></main>;
}
