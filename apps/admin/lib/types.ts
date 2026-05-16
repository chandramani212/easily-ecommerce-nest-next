export interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
  createdAt: string;
}

export type TierPriceType = "FIXED" | "PERCENTAGE";

export interface TierPrice {
  id?: string;
  minQuantity: number;
  type: TierPriceType;
  price: string | number;
  /** Server-derived per-unit price (PERCENTAGE tiers resolved off sellingPrice). */
  effectivePrice?: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface RelatedProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: string | number;
  sellingPrice: string | number;
  images: string[];
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: string | number;
  sellingPrice: string | number;
  images: string[];
  active: boolean;
  attributes: ProductAttribute[];
  categories: { id: string; name: string; slug: string }[];
  relatedTo?: RelatedProductSummary[];
  tierPrices: TierPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  uploadedById?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  _count?: { orders: number };
  orders?: Order[];
  createdAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer | null;
  status: OrderStatus;
  subtotal: string | number;
  shipping: string | number;
  tax: string | number;
  total: string | number;
  shippingAddress?: Record<string, unknown> | null;
  items?: OrderItem[];
  _count?: { items: number };
  createdAt: string;
}

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "CLOSED";

export interface Inquiry {
  id: string;
  inquiryType: string;
  productName?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  quantity?: string | null;
  message?: string | null;
  status: InquiryStatus;
  createdAt: string;
}

export type ContactStatus = "NEW" | "READ" | "REPLIED";

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject?: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Settings {
  id: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassSet: boolean;
  smtpFrom: string;
  smtpSecure: boolean;
  notifyTo: string;
}

export type SupplierKind = "REST" | "FILE_FEED";
export type SupplierAuthType =
  | "NONE"
  | "API_KEY"
  | "BASIC"
  | "BEARER"
  | "OAUTH2_CLIENT_CREDENTIALS";
export type SupplierImportFormat = "JSON" | "XML" | "CSV";
export type SupplierImportRunStatus =
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED";
export type SupplierImportTrigger = "SCHEDULE" | "MANUAL";

export interface Supplier {
  id: string;
  name: string;
  kind: SupplierKind;
  baseUrl?: string | null;
  authType: SupplierAuthType;
  defaultMarkupPct: number;
  notes: string;
  active: boolean;
  productCount?: number;
  importCount?: number;
  authConfigured?: boolean;
  imports?: SupplierImportSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierImportSummary {
  id: string;
  name: string;
  format: SupplierImportFormat;
  cron: string;
  active: boolean;
  lastRunAt?: string | null;
  lastStatus?: SupplierImportRunStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierImport extends SupplierImportSummary {
  supplierId: string;
  endpoint?: string | null;
  httpMethod: string;
  headers: Record<string, string>;
  body?: string | null;
  recordsPath: string;
  mapping: Record<string, unknown>;
  markup: Record<string, unknown>;
  autoDeactivateMissing: boolean;
}

export interface SupplierImportRun {
  id: string;
  importId: string;
  status: SupplierImportRunStatus;
  triggeredBy: SupplierImportTrigger;
  startedAt: string;
  finishedAt?: string | null;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { record: number; externalId?: string; error: string }[];
}

export interface SupplierProductLinkEntry {
  externalId: string;
  lastSeenAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    slug: string;
    sellingPrice: string | number;
    basePrice: string | number;
    active: boolean;
    images: string[];
  };
}
