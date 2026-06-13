import {
  computeSummary,
  customerWithOrders,
  mockAdminUsers,
  mockCategories,
  mockContactMessages,
  mockCustomers,
  mockInquiries,
  mockMediaAssets,
  mockOrders,
  mockProducts,
  mockSettings,
  mockSourceImports,
  mockSourceProductLinks,
  mockSourceRuns,
  mockSources,
} from "./mock-data";
import { DEMO_USER } from "./demo";
import type {
  ContactMessage,
  Customer,
  Inquiry,
  MediaAsset,
  Order,
  Pagination,
  Product,
} from "./types";

function parseUrl(path: string) {
  const [pathname, query = ""] = path.split("?");
  return { pathname: pathname ?? "", params: new URLSearchParams(query) };
}

function paginate<T>(items: T[], params: URLSearchParams): Pagination<T> {
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.max(
    1,
    Math.min(200, parseInt(params.get("pageSize") ?? "20", 10) || 20),
  );
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    total: items.length,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function containsCI(value: string | null | undefined, needle: string): boolean {
  return (value ?? "").toLowerCase().includes(needle.toLowerCase());
}

export function demoRoute<T>(path: string): T {
  const { pathname, params } = parseUrl(path);

  if (pathname === "/auth/me") {
    return DEMO_USER as unknown as T;
  }

  if (pathname === "/stats/summary") {
    return computeSummary() as unknown as T;
  }

  if (pathname === "/categories") {
    return mockCategories as unknown as T;
  }

  if (pathname === "/settings") {
    return mockSettings as unknown as T;
  }

  if (pathname === "/users") {
    return mockAdminUsers as unknown as T;
  }

  if (pathname === "/products") {
    const q = params.get("q");
    const categoryId = params.get("categoryId");
    let items: Product[] = mockProducts;
    if (q) {
      items = items.filter(
        (p) => containsCI(p.name, q) || containsCI(p.sku, q),
      );
    }
    if (categoryId) {
      items = items.filter((p) =>
        p.categories.some((c) => c.id === categoryId),
      );
    }
    return paginate(items, params) as unknown as T;
  }

  if (pathname.startsWith("/products/")) {
    const id = pathname.slice("/products/".length);
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new Error(`Product ${id} not found`);
    return product as unknown as T;
  }

  if (pathname === "/media") {
    const q = params.get("q");
    let items: MediaAsset[] = mockMediaAssets;
    if (q) {
      items = items.filter(
        (m) =>
          containsCI(m.originalName, q) ||
          containsCI(m.filename, q) ||
          containsCI(m.alt ?? "", q),
      );
    }
    return paginate(items, params) as unknown as T;
  }

  if (pathname.startsWith("/media/")) {
    const id = pathname.slice("/media/".length);
    const asset = mockMediaAssets.find((m) => m.id === id);
    if (!asset) throw new Error(`Media asset ${id} not found`);
    return asset as unknown as T;
  }

  if (pathname === "/customers") {
    const q = params.get("q");
    let items: Customer[] = mockCustomers;
    if (q) {
      items = items.filter(
        (c) =>
          containsCI(c.firstName, q) ||
          containsCI(c.lastName, q) ||
          containsCI(c.email, q) ||
          containsCI(c.company ?? "", q),
      );
    }
    return paginate(items, params) as unknown as T;
  }

  if (pathname.startsWith("/customers/")) {
    const id = pathname.slice("/customers/".length);
    const customer = customerWithOrders(id);
    if (!customer) throw new Error(`Customer ${id} not found`);
    return customer as unknown as T;
  }

  if (pathname === "/orders") {
    const q = params.get("q");
    const status = params.get("status");
    let items: Order[] = mockOrders;
    if (status) items = items.filter((o) => o.status === status);
    if (q) {
      items = items.filter(
        (o) =>
          containsCI(o.orderNumber, q) ||
          containsCI(o.customer?.firstName ?? "", q) ||
          containsCI(o.customer?.lastName ?? "", q) ||
          containsCI(o.customer?.email ?? "", q),
      );
    }
    items = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return paginate(items, params) as unknown as T;
  }

  if (pathname.startsWith("/orders/")) {
    const id = pathname.slice("/orders/".length);
    const order = mockOrders.find((o) => o.id === id);
    if (!order) throw new Error(`Order ${id} not found`);
    return order as unknown as T;
  }

  if (pathname === "/inquiries") {
    const q = params.get("q");
    const status = params.get("status");
    let items: Inquiry[] = mockInquiries;
    if (status) items = items.filter((i) => i.status === status);
    if (q) {
      items = items.filter(
        (i) =>
          containsCI(i.name, q) ||
          containsCI(i.email, q) ||
          containsCI(i.message ?? "", q) ||
          containsCI(i.productName ?? "", q),
      );
    }
    return paginate(items, params) as unknown as T;
  }

  if (pathname === "/contact-messages") {
    const q = params.get("q");
    const status = params.get("status");
    let items: ContactMessage[] = mockContactMessages;
    if (status) items = items.filter((m) => m.status === status);
    if (q) {
      items = items.filter(
        (m) =>
          containsCI(m.firstName, q) ||
          containsCI(m.lastName, q) ||
          containsCI(m.email, q) ||
          containsCI(m.subject, q) ||
          containsCI(m.message, q),
      );
    }
    return paginate(items, params) as unknown as T;
  }

  if (pathname === "/sources" || pathname === "/sources/") {
    const search = params.get("search");
    let items = mockSources;
    if (search) {
      items = items.filter(
        (s) => containsCI(s.name, search) || containsCI(s.baseUrl ?? "", search),
      );
    }
    return items as unknown as T;
  }

  if (pathname === "/sources/cron-preview") {
    return { valid: true, next: [] } as unknown as T;
  }

  // /sources/:id  /sources/:id/products  /sources/:id/imports[/...]
  const sourceMatch = pathname.match(/^\/sources\/([^/]+)(?:\/(.*))?$/);
  if (sourceMatch) {
    const sourceId = sourceMatch[1]!;
    const sub = sourceMatch[2] ?? "";
    const source = mockSources.find((s) => s.id === sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    if (!sub) return source as unknown as T;

    if (sub === "products") {
      const links = mockSourceProductLinks[sourceId] ?? [];
      return { total: links.length, items: links } as unknown as T;
    }

    if (sub === "imports") {
      const items = mockSourceImports.filter(
        (i) => i.sourceId === sourceId,
      );
      return items as unknown as T;
    }

    const importMatch = sub.match(/^imports\/([^/]+)(?:\/(.*))?$/);
    if (importMatch) {
      const importId = importMatch[1]!;
      const importSub = importMatch[2] ?? "";
      const imp = mockSourceImports.find(
        (i) => i.id === importId && i.sourceId === sourceId,
      );
      if (!imp) throw new Error(`Import ${importId} not found`);

      if (!importSub) return imp as unknown as T;

      if (importSub === "runs") {
        const items = mockSourceRuns
          .filter((r) => r.importId === importId)
          .sort(
            (a, b) =>
              new Date(b.startedAt).getTime() -
              new Date(a.startedAt).getTime(),
          );
        return { total: items.length, items } as unknown as T;
      }

      const runMatch = importSub.match(/^runs\/(.+)$/);
      if (runMatch) {
        const runId = runMatch[1]!;
        const run = mockSourceRuns.find(
          (r) => r.id === runId && r.importId === importId,
        );
        if (!run) throw new Error(`Run ${runId} not found`);
        return run as unknown as T;
      }
    }
  }

  throw new Error(`[demo] No mock handler for ${path}`);
}

export function demoRouteSafe<T>(path: string): T | null {
  try {
    return demoRoute<T>(path);
  } catch {
    return null;
  }
}

export const DEMO_CATEGORY_IDS = mockCategories.map((c) => c.id);
export const DEMO_PRODUCT_IDS = mockProducts.map((p) => p.id);
export const DEMO_CUSTOMER_IDS = mockCustomers.map((c) => c.id);
export const DEMO_ORDER_IDS = mockOrders.map((o) => o.id);
export const DEMO_SOURCE_IDS = mockSources.map((s) => s.id);
export const DEMO_SOURCE_IMPORT_IDS = mockSourceImports.map((i) => ({
  sourceId: i.sourceId,
  importId: i.id,
}));
