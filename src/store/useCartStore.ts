import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  nombre: string;
  imagen: string;
  atributos: Record<string, string>;
  color: any;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (newItem) => set((state) => ({ 
        items: [...state.items, newItem] 
      })),
      removeItem: (id) => set((state) => ({ 
        items: state.items.filter((i) => i.id !== id) 
      })),
    }),
    {
      name: 'sublimod_quote_store', 
    }
  )
);