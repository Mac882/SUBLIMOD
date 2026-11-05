import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUnitPriceByQuantity } from '@/lib/pricing';

export interface CartItem {
  id: string;
  productId: string;
  /** Agrupa escalas solo entre selecciones que comparten la misma regla de precio. */
  clavePrecio?: string;
  precioPorCombinacion?: boolean;
  nombre: string;
  imagen: string;
  atributos: Record<string, string>;
  color: any;
  cantidad: number;
  escalasPrecios?: Array<{ min: number; max?: number | null; price: number }>;
  precioUnitario: number;
  total: number;
}

const repriceItems = (items: CartItem[]): CartItem[] => {
  const quantitiesByPriceKey = items.reduce<Record<string, number>>((totals, item) => {
    const key = item.clavePrecio || item.productId;
    totals[key] = (totals[key] || 0) + Math.max(0, Number(item.cantidad) || 0);
    return totals;
  }, {});
  const scalesByPriceKey = items.reduce<Record<string, CartItem["escalasPrecios"]>>((result, item) => {
    const key = item.clavePrecio || item.productId;
    if (item.escalasPrecios?.length && !result[key]) result[key] = item.escalasPrecios;
    return result;
  }, {});

  return items.map((item) => {
    const key = item.clavePrecio || item.productId;
    const productQuantity = quantitiesByPriceKey[key] || item.cantidad || 1;
    const scales = item.escalasPrecios?.length ? item.escalasPrecios : scalesByPriceKey[key];
    const unitPrice = scales?.length ? getUnitPriceByQuantity(scales, productQuantity) : Number(item.precioUnitario) || 0;
    return { ...item, escalasPrecios: scales, precioUnitario: unitPrice, total: unitPrice * item.cantidad };
  });
};

interface CartState { items: CartItem[]; addItem: (item: CartItem) => void; removeItem: (id: string) => void; }

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (newItem) => set((state) => ({ items: repriceItems([...state.items, newItem]) })),
      removeItem: (id) => set((state) => ({ items: repriceItems(state.items.filter((i) => i.id !== id)) })),
    }),
    {
      name: 'sublimod_quote_store',
      version: 3,
      migrate: (persistedState: any) => {
        const items = Array.isArray(persistedState?.items) ? persistedState.items : [];
        return { ...persistedState, items: repriceItems(items) };
      },
    }
  )
);
