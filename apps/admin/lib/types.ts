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
  bannerImage?: string | null;
  content?: string | null;
  active?: boolean;
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
  /** Supplier/API SKU. Set by imports; null for products created in the admin. */
  externalSku?: string | null;
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
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string | null;
  keywords?: string;
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
  productSku?: string | null;
  productImage?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  quantity?: string | null;
  message?: string | null;
  status: InquiryStatus;
  source?: string;
  organic?: boolean;
  provider?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  createdAt: string;
}

export type LeadSource =
  | "organic"
  | "paid"
  | "social"
  | "referral"
  | "email"
  | "direct";

export interface LeadSourceReport {
  total: number;
  organic: number;
  other: number;
  bySource: { source: LeadSource; count: number }[];
  byProvider: { provider: string; count: number }[];
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

export type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "SUPER_ADMIN";

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

export type SourceKind = "REST" | "FILE_FEED" | "ASI_CENTRAL";
export type SourceAuthType =
  | "NONE"
  | "API_KEY"
  | "BASIC"
  | "BEARER"
  | "OAUTH2_CLIENT_CREDENTIALS"
  | "ASI_MEMBER_AUTH";
export type SourceImportFormat = "JSON" | "XML" | "CSV";
export type SourceImportRunStatus =
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED";
export type SourceImportTrigger = "SCHEDULE" | "MANUAL";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  baseUrl?: string | null;
  authType: SourceAuthType;
  defaultMarkupPct: number;
  notes: string;
  active: boolean;
  productCount?: number;
  importCount?: number;
  authConfigured?: boolean;
  imports?: SourceImportSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface SourceImportSummary {
  id: string;
  name: string;
  format: SourceImportFormat;
  cron: string;
  active: boolean;
  lastRunAt?: string | null;
  lastStatus?: SourceImportRunStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceImport extends SourceImportSummary {
  sourceId: string;
  endpoint?: string | null;
  httpMethod: string;
  headers: Record<string, string>;
  body?: string | null;
  recordsPath: string;
  mapping: Record<string, unknown>;
  markup: Record<string, unknown>;
  autoDeactivateMissing: boolean;
}

export interface SourceImportRun {
  id: string;
  importId: string;
  status: SourceImportRunStatus;
  triggeredBy: SourceImportTrigger;
  startedAt: string;
  finishedAt?: string | null;
  total: number;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { record: number; externalId?: string; error: string }[];
}

export interface SourceProductLinkEntry {
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

export type SupplierOrigin = "MANUAL" | "FEED";

/** A real-world supplier company behind a Source. */
export interface Supplier {
  id: string;
  sourceId: string;
  origin: SupplierOrigin;
  externalId: string;
  name: string;
  phone?: string | null;
  altPhone?: string | null;
  tollFree?: string | null;
  website?: string | null;
  active: boolean;
  productCount?: number;
  source?: { id: string; name: string; kind?: SourceKind };
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  total: number;
  items: Supplier[];
}

export interface SupplierProductsResponse {
  total: number;
  items: SourceProductLinkEntry[];
}

/* ---- Editable storefront pages (CMS). --------------------------------- */

export interface Page<C = Record<string, unknown>> {
  id: string;
  slug: string;
  title: string;
  content: C;
  metaTitle: string;
  metaDescription: string;
  ogImage?: string | null;
  keywords: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlide {
  tag: string;
  heading: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  gradient: string;
  image: string;
}

/** A product chosen for the home "Most Popular" tab. Stored in Home page
 * content; the storefront re-fetches live product data by `slug`. */
export interface PopularProductRef {
  id: string;
  slug: string;
  name: string;
  sku: string;
  image?: string;
}

export interface HomeContent {
  hero: { autoPlayMs: number; slides: HeroSlide[] };
  content?: { heading: string; body: string };
  /** Curated product list for the home "Most Popular" tab. When empty, the
   * storefront falls back to the newest active products. */
  popularProducts?: PopularProductRef[];
}

/** Privacy Policy / Terms & Conditions — a single rich-text body. */
export interface LegalContent {
  body: string;
}

export interface AboutContent {
  hero: { title: string; highlight: string; intro: string };
  stats: { value: string; label: string }[];
  valuesHeading: string;
  valuesSubtitle: string;
  values: { title: string; description: string; icon?: string }[];
  timelineHeading: string;
  timelineSubtitle: string;
  milestones: { year: string; title: string; description: string }[];
  teamHeading: string;
  teamSubtitle: string;
  team: { name: string; role: string; initials: string; color: string }[];
}

export interface ContactContent {
  hero: { title: string; highlight: string; intro: string };
  info: { title: string; description: string; detail: string; icon?: string }[];
  formHeading: string;
  formSubheading: string;
  faqHeading: string;
  faqSubheading: string;
  faq: { question: string; answer: string }[];
}
