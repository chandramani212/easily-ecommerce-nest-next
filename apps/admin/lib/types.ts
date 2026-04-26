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
  image?: string | null;
  parentId?: string | null;
  _count?: { products: number };
  createdAt: string;
}

export interface TierPrice {
  id?: string;
  minQuantity: number;
  price: string | number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  basePrice: string | number;
  images: string[];
  active: boolean;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
  tierPrices: TierPrice[];
  createdAt: string;
  updatedAt: string;
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
