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
  condition: "Nuevo" | "Como nuevo" | "Usado - Excelente" | "Usado - Muy bueno" | "Reacondicionado";
  physicalCondition: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string | number | boolean>;
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
  includes: [],
  warranty: true,
  warrantyDetail: "",
  tests: "",
  images: [],
  coverImage: "",
  featured: false,
};
