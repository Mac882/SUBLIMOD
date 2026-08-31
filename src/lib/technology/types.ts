export type TechnologyFieldType = "text" | "number" | "select" | "boolean";

export type TechnologyFieldDefinition = {
  id: string;
  label: string;
  type: TechnologyFieldType;
  options?: string[];
  required?: boolean;
  order: number;
};

export type TechnologyCategory = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  visible: boolean;
  order: number;
  specificationFields: TechnologyFieldDefinition[];
};

export type TechnologyProduct = {
  id?: string;
  categoryId: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  price: number;
  currency: "USD" | "NIO";
  previousPrice: number;
  available: boolean;
  availability: "Disponible" | "Reservada" | "Vendida";
  condition: "Nuevo" | "Usado - Excelente" | "Usado - Bueno";
  physicalCondition: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string | number | boolean>;
  filterValues?: {
    brand?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    os?: string;
    color?: string;
    screenSize?: string;
    resolution?: string;
    refreshRate?: string;
  };
  includes: string[];
  warranty: boolean;
  warrantyDetail: string;
  tests: string;
  images: string[];
  coverImage: string;
  featured: boolean;
};

export const emptyTechnologyProduct: TechnologyProduct = {
  categoryId: "",
  name: "",
  brand: "",
  model: "",
  sku: "",
  price: 0,
  currency: "USD",
  previousPrice: 0,
  available: true,
  availability: "Disponible",
  condition: "Usado - Excelente",
  physicalCondition: "",
  shortDescription: "",
  description: "",
  specifications: {},
  filterValues: {},
  includes: [],
  warranty: true,
  warrantyDetail: "",
  tests: "",
  images: [],
  coverImage: "",
  featured: false,
};
