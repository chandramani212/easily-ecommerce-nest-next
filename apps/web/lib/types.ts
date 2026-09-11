export interface ApiTierPrice {
  id?: string;
  minQuantity: number;
  price: string | number;
  type?: "FIXED" | "PERCENTAGE";
  effectivePrice?: string | number;
}

export interface ApiProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductAttribute {
  name: string;
  value: string;
}

export interface ApiRelatedProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: string | number;
  basePrice: string | number;
  images: string[];
  active: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: string | number;
  sellingPrice: string | number;
  images: string[];
  attributes: ApiProductAttribute[] | unknown;
  active: boolean;
  categories: ApiProductCategoryRef[];
  tierPrices: ApiTierPrice[];
  relatedTo?: ApiRelatedProduct[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string | null;
  keywords?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  items: ApiProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Lean card payload from `GET /products/storefront` (attributes: brand/color only). */
export type StorefrontProduct = Pick<
  ApiProduct,
  | "id"
  | "name"
  | "slug"
  | "basePrice"
  | "sellingPrice"
  | "images"
  | "attributes"
  | "createdAt"
>;

export interface StorefrontResponse {
  items: StorefrontProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Category-wide filter options from `GET /products/storefront/facets`. */
export interface StorefrontFacets {
  /** Active products in the category. */
  count: number;
  priceMin: number;
  priceMax: number;
  brands: { value: string; count: number }[];
  /** Individual color names, lowercased. */
  colors: { value: string; count: number }[];
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bannerImage?: string | null;
  content?: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
  createdAt?: string;
  updatedAt?: string;
}
