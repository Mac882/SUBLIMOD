export interface CatalogCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string | null;
}

export interface GlobalAttribute {
  id: string;
  nombreAtributo: string;
  categoriaId: string;
  opciones: string[];
}

export interface ProductAttributeSelection {
  atributoId: string;
  valores: string[];
}

export const getCategoryName = (categories: CatalogCategory[], categoryId?: string) =>
  categories.find((category) => category.id === categoryId)?.nombre || "Sin categoría";

export const getAttributeName = (attributes: GlobalAttribute[], attributeId: string) =>
  attributes.find((attribute) => attribute.id === attributeId)?.nombreAtributo || "Atributo";
