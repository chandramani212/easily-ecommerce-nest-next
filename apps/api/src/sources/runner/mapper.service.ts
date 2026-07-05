import { Injectable } from '@nestjs/common';

import {
  AttributeMapItem,
  CategoriesMap,
  FieldTransform,
  ImagesMap,
  MappedAttribute,
  MappedCategory,
  MappedProduct,
  MappedTier,
  MappedVendor,
  MappingSpec,
  MarkupSpec,
  SimpleField,
  TierMapItem,
  VendorMap,
} from './mapping.types';
import { getPath } from './path.util';

/**
 * Pure transformation layer: converts a raw source record (already extracted
 * via the format parser) into a normalized `MappedProduct` ready to be upserted.
 *
 * Stateless and Prisma-free so it can also serve dry-run previews from the UI.
 */
@Injectable()
export class MapperService {
  mapRecord(
    record: unknown,
    spec: MappingSpec,
    markup?: MarkupSpec,
  ): MappedProduct {
    const externalId = asRequiredString(this.value(record, spec.externalId), 'externalId');
    const name = asRequiredString(this.value(record, spec.name), 'name');
    // Website SKU is optional — empty falls back to the DB auto-generated value.
    const sku = asString(this.value(record, spec.sku)).trim();
    const externalSku = asString(this.value(record, spec.externalSku)).trim();
    const shortDescription = asString(this.value(record, spec.shortDescription));
    const description = asString(this.value(record, spec.description));

    let basePrice = asNumber(this.value(record, spec.basePrice)) ?? 0;
    let sellingPrice = asNumber(this.value(record, spec.sellingPrice)) ?? basePrice;

    if (markup && markup.value > 0) {
      const targets = markup.appliesTo ?? ['basePrice', 'sellingPrice'];
      basePrice = targets.includes('basePrice')
        ? applyMarkup(basePrice, markup)
        : basePrice;
      sellingPrice = targets.includes('sellingPrice')
        ? applyMarkup(sellingPrice, markup)
        : sellingPrice;
    }

    const images = this.mapImages(record, spec.images, (f) => this.value(record, f));
    const attributes = this.mapAttributes(record, spec.attributes);
    const categories = this.mapCategories(record, spec.categories);
    const tiers = this.mapTiers(record, spec.tiers);

    const active = spec.active
      ? (asBool(this.value(record, spec.active)) ?? true)
      : true;

    const vendor = this.mapVendor(record, spec.vendor);

    return {
      externalId,
      name,
      sku,
      externalSku,
      shortDescription,
      description,
      basePrice: round2(basePrice),
      sellingPrice: round2(sellingPrice),
      images,
      attributes,
      categories,
      tiers,
      active,
      ...(vendor ? { vendor } : {}),
    };
  }

  /**
   * Extract the supplier company from a record (aggregator feeds). Returns
   * undefined when no vendor mapping is configured or the name resolves empty.
   * `externalId` falls back to the slugified name so the same vendor dedupes
   * across runs even when the feed has no explicit id.
   */
  private mapVendor(record: unknown, cfg?: VendorMap): MappedVendor | undefined {
    if (!cfg) return undefined;
    const name = asString(this.value(record, cfg.name)).trim();
    if (!name) return undefined;
    const rawExternalId = cfg.externalId
      ? asString(this.value(record, cfg.externalId)).trim()
      : '';
    const externalId = rawExternalId || slugify(name);
    return {
      externalId,
      name,
      phone: optString(this.value(record, cfg.phone)),
      altPhone: optString(this.value(record, cfg.altPhone)),
      tollFree: optString(this.value(record, cfg.tollFree)),
      website: optString(this.value(record, cfg.website)),
    };
  }

  /* ---- Sub-mappers. ---------------------------------------------------- */

  private mapImages(
    record: unknown,
    cfg?: ImagesMap,
    resolve?: (f?: SimpleField) => unknown,
  ): string[] {
    if (!cfg) return [];
    const raw = (resolve ?? ((f) => this.value(record, f)))(cfg.source);
    let urls: string[] = [];
    if (Array.isArray(raw)) urls = raw.map(String).filter(Boolean);
    else if (typeof raw === 'string') {
      urls = cfg.separator
        ? raw.split(cfg.separator).map((s) => s.trim()).filter(Boolean)
        : [raw];
    } else if (raw !== undefined && raw !== null) {
      urls = [String(raw)];
    }

    if (cfg.featuredSource) {
      const featuredRaw = (resolve ?? ((f) => this.value(record, f)))(
        cfg.featuredSource,
      );
      if (typeof featuredRaw === 'string' && featuredRaw.trim()) {
        urls.unshift(featuredRaw.trim());
      } else if (Array.isArray(featuredRaw) && featuredRaw[0]) {
        urls.unshift(String(featuredRaw[0]));
      }
    }

    if (cfg.baseUrl) urls = urls.map((u) => applyBaseUrl(u, cfg.baseUrl!));
    // Store the largest configured variant so the product-detail gallery stays
    // sharp; the storefront down-shifts to smaller sizes by query swap.
    const storeSuffix =
      cfg.sizes?.detail ?? cfg.sizes?.normal ?? cfg.urlSuffix ?? undefined;
    if (storeSuffix) urls = urls.map((u) => applyUrlSuffix(u, storeSuffix));

    // Dedupe while preserving order so the featured image stays at index 0.
    const seen = new Set<string>();
    return urls.filter((u) => {
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  }

  private mapAttributes(
    record: unknown,
    items?: AttributeMapItem[],
  ): MappedAttribute[] {
    if (!items) return [];
    const out: MappedAttribute[] = [];
    for (const item of items) {
      const v = this.value(record, item.value);
      // Array-valued attributes (e.g. a wildcard path like
      // `Attributes.Colors.Values[*].Name`) are joined into a readable,
      // comma-separated string so multi-value attributes such as Color stay
      // splittable downstream instead of becoming "[object Object]" or a
      // delimiter-less blob.
      const value = Array.isArray(v)
        ? v
            .map((x) => String(x).trim())
            .filter(Boolean)
            .join(', ')
        : v === undefined || v === null
          ? ''
          : String(v).trim();
      if (!value) continue;
      out.push({ name: item.name, value });
    }
    return out;
  }

  private mapCategories(record: unknown, cfg?: CategoriesMap): MappedCategory[] {
    if (!cfg) return [];
    const raw = this.value(record, cfg.source);
    if (raw === undefined || raw === null) return [];

    // Structured mode: array of objects with sub-paths for name/parent. Each
    // item produces ONE MappedCategory; the parent is carried alongside so the
    // runner can upsert it before the child.
    if (cfg.itemExternalIdPath && Array.isArray(raw)) {
      const out: MappedCategory[] = [];
      for (const item of raw) {
        const externalId = asTrimmedString(getPath(item, cfg.itemExternalIdPath));
        const name = cfg.itemNamePath
          ? asTrimmedString(getPath(item, cfg.itemNamePath))
          : externalId;
        if (!externalId || !name) continue;
        const parentExternalId = cfg.itemParentExternalIdPath
          ? asTrimmedString(getPath(item, cfg.itemParentExternalIdPath)) || undefined
          : undefined;
        const parentName = cfg.itemParentNamePath
          ? asTrimmedString(getPath(item, cfg.itemParentNamePath)) || undefined
          : undefined;
        out.push({ externalId, name, parentExternalId, parentName });
      }
      return dedupeCategories(out);
    }

    // Flat-string fallback (legacy behavior). No externalId, no parent.
    let names: string[];
    if (Array.isArray(raw)) {
      names = raw.map((v) => String(v).trim()).filter(Boolean);
    } else if (typeof raw === 'string') {
      const sep = cfg.separator ?? ',';
      names = raw.split(sep).map((s) => s.trim()).filter(Boolean);
    } else {
      names = [String(raw).trim()].filter(Boolean);
    }
    return dedupeCategories(names.map((name) => ({ name })));
  }

  private mapTiers(record: unknown, items?: TierMapItem[]): MappedTier[] {
    if (!items) return [];
    const out: MappedTier[] = [];
    for (const item of items) {
      const min = asNumber(this.value(record, item.minQuantity));
      const price = asNumber(this.value(record, item.price));
      if (min === undefined || price === undefined) continue;
      out.push({
        minQuantity: Math.max(1, Math.round(min)),
        price: round2(price),
        type: item.type ?? 'FIXED',
      });
    }
    return dedupeTiers(out);
  }

  /* ---- Field resolution. ----------------------------------------------- */

  /**
   * Resolve a SimpleField against a record. Order: literal > template > path.
   */
  value(record: unknown, field?: SimpleField): unknown {
    if (!field) return undefined;
    let v: unknown;
    if (field.literal !== undefined) {
      v = field.literal;
    } else if (field.template) {
      v = renderTemplate(field.template, record);
    } else if (field.path) {
      v = getPath(record, field.path);
    } else {
      return undefined;
    }

    for (const t of field.transforms ?? []) {
      v = applyTransform(v, t, field.splitSeparator);
    }

    // Prepend the prefix only to a non-empty scalar, so a configured prefix with
    // no resolved key still yields "" (and the SKU auto-generates downstream).
    if (field.prefix && (typeof v === 'string' || typeof v === 'number')) {
      const s = String(v);
      v = s ? field.prefix + s : s;
    }
    return v;
  }
}

/* ---- Helpers (top-level so they're tree-shake-friendly + testable). ---- */

function applyBaseUrl(url: string, base: string): string {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  const b = base.replace(/\/+$/, '');
  const u = url.replace(/^\/+/, '');
  return `${b}/${u}`;
}

function applyUrlSuffix(url: string, suffix: string): string {
  if (!url || !suffix) return url;
  if (suffix.startsWith('?') && url.includes('?')) {
    return `${url}&${suffix.slice(1)}`;
  }
  return `${url}${suffix}`;
}

function applyMarkup(value: number, m: MarkupSpec): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  if (m.kind === 'percent') return value * (1 + m.value / 100);
  return value + m.value;
}

function applyTransform(
  value: unknown,
  t: FieldTransform,
  separator = ',',
): unknown {
  switch (t) {
    case 'string':
      return value === null || value === undefined ? '' : String(value);
    case 'lower':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'upper':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'slugify':
      return typeof value === 'string' ? slugify(value) : value;
    case 'int': {
      const n = Number(String(value).replace(/[^\d-]/g, ''));
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    }
    case 'float': {
      const n = parseFloat(String(value));
      return Number.isFinite(n) ? n : undefined;
    }
    case 'money': {
      const cleaned = String(value).replace(/[^0-9.\-,]/g, '');
      // Heuristic: if both `,` and `.` are present, treat `,` as thousands sep.
      const normalized =
        cleaned.includes(',') && cleaned.includes('.')
          ? cleaned.replace(/,/g, '')
          : cleaned.replace(/,/g, '.');
      const n = parseFloat(normalized);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'bool': {
      if (typeof value === 'boolean') return value;
      if (value === null || value === undefined) return undefined;
      const s = String(value).trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
      if (['false', '0', 'no', 'n', 'off', ''].includes(s)) return false;
      return undefined;
    }
    case 'split':
      return typeof value === 'string'
        ? value.split(separator).map((s) => s.trim()).filter(Boolean)
        : value;
    default:
      return value;
  }
}

function renderTemplate(tpl: string, record: unknown): string {
  return tpl.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, expr: string) => {
    const v = getPath(record, expr);
    return v === undefined || v === null ? '' : String(v);
  });
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

function asRequiredString(v: unknown, label: string): string {
  const s = asString(v).trim();
  if (!s) throw new Error(`Required field "${label}" is empty after mapping`);
  return s;
}

/** Trimmed string, or undefined when empty/absent — for optional contact fields. */
function optString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function asNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function asBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n', ''].includes(s)) return false;
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function asTrimmedString(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function dedupeCategories(cats: MappedCategory[]): MappedCategory[] {
  const seen = new Set<string>();
  const out: MappedCategory[] = [];
  for (const c of cats) {
    const key = c.externalId ?? `name:${c.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function dedupeTiers(tiers: MappedTier[]): MappedTier[] {
  const map = new Map<number, MappedTier>();
  for (const t of tiers) map.set(t.minQuantity, t);
  return [...map.values()].sort((a, b) => a.minQuantity - b.minQuantity);
}

export { slugify };
