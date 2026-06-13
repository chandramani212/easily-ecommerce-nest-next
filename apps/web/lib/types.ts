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

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
  createdAt?: string;
  updatedAt?: string;
}
