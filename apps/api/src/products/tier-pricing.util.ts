import { Prisma, TierPriceType } from '@prisma/client';

type DecimalLike = Prisma.Decimal | string | number;

export interface TierLike {
  type: TierPriceType;
  price: DecimalLike;
}

export interface ProductLike {
  sellingPrice: DecimalLike;
}

/**
 * Resolves the final per-unit price for a tier given its product's selling
 * price. Single source of truth for FIXED vs PERCENTAGE tiers.
 *
 * - FIXED      -> tier.price is the per-unit price.
 * - PERCENTAGE -> tier.price is a 0-100 discount applied off sellingPrice.
 *
 * Result is rounded to 2 decimal places to match `@db.Decimal(12, 2)`.
 */
export function resolveTierUnitPrice(
  product: ProductLike,
  tier: TierLike,
): number {
  const selling = Number(product.sellingPrice);
  if (tier.type === 'PERCENTAGE') {
    const pct = Math.max(0, Math.min(100, Number(tier.price)));
    return +(selling * (1 - pct / 100)).toFixed(2);
  }
  return +Number(tier.price).toFixed(2);
}

/**
 * Annotates each tier with `effectivePrice` so storefront/admin can render
 * percentage tiers without recomputing client-side.
 */
export function withEffectiveTierPrices<
  P extends ProductLike & { tierPrices: (TierLike & Record<string, unknown>)[] },
>(product: P): P & {
  tierPrices: (P['tierPrices'][number] & { effectivePrice: number })[];
} {
  return {
    ...product,
    tierPrices: product.tierPrices.map((t) => ({
      ...t,
      effectivePrice: resolveTierUnitPrice(product, t),
    })),
  };
}
