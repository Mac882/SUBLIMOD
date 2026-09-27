export interface ProductPriceScale {
  min: number;
  max?: number | null;
  price: number;
}

export const normalizePriceScales = (scales: unknown): ProductPriceScale[] => {
  if (!Array.isArray(scales)) return [];
  return scales
    .map((scale: any) => ({
      min: scale?.min == null || scale?.min === "" ? null : Math.max(1, Number(scale.min) || 1),
      max: scale?.max == null || scale?.max === "" ? null : Math.max(1, Number(scale.max) || 1),
      price: Math.max(0, Number(scale?.price) || 0),
    }))
    .sort((a, b) => a.min - b.min);
};

export const getApplicablePriceScale = (
  scales: unknown,
  quantity: number,
): ProductPriceScale | null => {
  const normalized = normalizePriceScales(scales);
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

  return (
    normalized.find(
      (scale) =>
        safeQuantity >= scale.min &&
        (scale.max == null || safeQuantity <= scale.max),
    ) ||
    [...normalized].reverse().find((scale) => safeQuantity >= scale.min) ||
    normalized[0] ||
    null
  );
};

export const getUnitPriceByQuantity = (
  scales: unknown,
  quantity: number,
): number => {
  return getApplicablePriceScale(scales, quantity)?.price ?? 0;
};

export const getPriceScaleLabel = (scale: ProductPriceScale | null): string => {
  if (!scale) return "";
  return scale.max == null
    ? `Desde ${scale.min} unidades`
    : `${scale.min}–${scale.max} unidades`;
};

export const validatePriceScales = (scales: unknown): string | null => {
  const normalized = normalizePriceScales(scales);
  if (!normalized.length) return "Debes configurar al menos una escala de precio.";

  if (normalized[0].min !== 1) {
    return "La primera escala debe comenzar en 1 unidad.";
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];

    if (current.min == null) {
      return `La escala ${index + 1} necesita definir la cantidad "Desde".`;
    }

    if (current.max != null && current.max < current.min) {
      return `La escala ${index + 1} tiene un rango inválido.`;
    }

    if (current.price < 0) {
      return `La escala ${index + 1} tiene un precio inválido.`;
    }

    const next = normalized[index + 1];
    if (current.max == null && next) {
      return "Una escala abierta (sin máximo) debe ser la última.";
    }

    if (next && current.max == null) {
      return `La escala ${index + 1} necesita definir "Hasta" porque existe una escala posterior.`;
    }

    if (next && next.min == null) {
      return `La escala ${index + 2} necesita definir la cantidad "Desde".`;
    }

    if (next && current.max != null && next.min !== current.max + 1) {
      return `Las escalas ${index + 1} y ${index + 2} deben ser consecutivas, sin saltos ni solapamientos.`;
    }
  }

  return null;
};
