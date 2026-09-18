export interface ProductVariantOption {
  id: string;
  nombre: string;
  hex?: string;
  imagenUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProductVariantGroup {
  id: string;
  nombre: string;
  tipo?: "select" | "color";
  requerido?: boolean;
  opciones: ProductVariantOption[];
}

export interface ProductVariantCombination {
  id: string;
  opciones: Record<string, string>;
  nombre?: string;
  imagenUrl?: string;
  imagenes?: string[];
  precio?: number | null;
  activo?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProductVariantsConfig {
  habilitado: boolean;
  grupos: ProductVariantGroup[];
  combinaciones: ProductVariantCombination[];
}

export const EMPTY_PRODUCT_VARIANTS: ProductVariantsConfig = {
  habilitado: false,
  grupos: [],
  combinaciones: [],
};

export const getVariantCombinationKey = (options: Record<string, string>) =>
  Object.keys(options)
    .sort()
    .map((key) => `${key}:${options[key]}`)
    .join("|");
