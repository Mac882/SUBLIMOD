"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeTechnologyCategories, subscribeTechnologyProducts } from "@/lib/technology/repository";
import type { TechnologyCategory, TechnologyProduct } from "@/lib/technology/types";

export default function TecnologiaPage() {
  const [categories, setCategories] = useState<TechnologyCategory[]>([]);
  const [products, setProducts] = useState<TechnologyProduct[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => subscribeTechnologyCategories(setCategories), []);
  useEffect(() => subscribeTechnologyProducts(setProducts), []);

  const visibleCategories = useMemo(() => categories.filter((category) => category.visible).sort((a, b) => a.order - b.order), [categories]);
  const filtered = useMemo(() => products.filter((product) => {
    if (product.availability === "Vendida") return false;
    if (categoryId !== "all" && product.categoryId !== categoryId) return false;
    const text = `${product.name} ${product.brand} ${product.model} ${product.sku}`.toLowerCase();
    return text.includes(search.toLowerCase());
  }), [products, categoryId, search]);

  return <main><Navbar /><section><h1>Tecnología</h1><p>Catálogo tecnológico de SubliMod.</p></section><section><nav><button onClick={() => setCategoryId("all")}>Todos</button>{visibleCategories.map((category) => <button key={category.id} onClick={() => setCategoryId(category.id || "")}>{category.name}</button>)}</nav><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." /><div>{filtered.map((product) => <Link href={`/tecnologia/${product.id}`} key={product.id}><article><h2>{product.name}</h2><p>{product.brand} · {product.model}</p><p>{product.currency === "USD" ? "$" : "C$"} {Number(product.price).toLocaleString()}</p></article></Link>)}{filtered.length === 0 && <p>No hay productos tecnológicos disponibles.</p>}</div></section><Footer /></main>;
}
