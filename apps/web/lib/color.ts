/**
 * Resolves a raw supplier color name to a base color "family" with a swatch
 * hex. Feeds (notably ASI) emit an open-ended, noisy color vocabulary:
 * qualified names ("Light Blue", "Vegas Gold"), pseudo-variants
 * ("Charcoal Shade", "Silver Tint"), and non-colors ("Assorted"). Without
 * normalization every unmapped name collapses to the same neutral swatch, so
 * the color filter shows a column of visually identical chips.
 *
 * `resolveColor` maps each name to the nearest known base color (dropping
 * qualifier words) so distinct real colors get distinct swatches, and callers
 * can de-duplicate chips by the resolved hex.
 */

/** Neutral swatch for colors we can't map to a known family. */
export const NEUTRAL_COLOR = "#94a3b8";

/** Base color families → swatch hex. Keys are lowercase, single tokens. */
const BASE_COLORS: Record<string, string> = {
  black: "#1e293b",
  white: "#e2e8f0",
  red: "#f87171",
  blue: "#60a5fa",
  green: "#34d399",
  purple: "#a78bfa",
  orange: "#fb923c",
  yellow: "#fbbf24",
  pink: "#f472b6",
  teal: "#2dd4bf",
  gray: "#94a3b8",
  grey: "#94a3b8",
  silver: "#cbd5e1",
  navy: "#1e3a8a",
  maroon: "#7f1d1d",
  brown: "#92400e",
  beige: "#e7d8b1",
  gold: "#d4af37",
  natural: "#e7d8b1",
  // Extended vocabulary seen in supplier feeds.
  charcoal: "#4b5563",
  graphite: "#374151",
  cream: "#f5f0e1",
  ivory: "#fffbeb",
  tan: "#d2b48c",
  khaki: "#bdb76b",
  cardinal: "#a71930",
  scarlet: "#b91c1c",
  crimson: "#b91c1c",
  burgundy: "#7f1d1d",
  wine: "#7f1d1d",
  coral: "#fb7185",
  salmon: "#fb7185",
  peach: "#fbb6a3",
  lavender: "#c4b5fd",
  violet: "#8b5cf6",
  fuchsia: "#e879f9",
  magenta: "#e879f9",
  royal: "#2563eb",
  indigo: "#6366f1",
  forest: "#166534",
  moss: "#4d7c0f",
  olive: "#4d7c0f",
  jade: "#10b981",
  kelly: "#22c55e",
  mint: "#6ee7b7",
  lime: "#84cc16",
  aqua: "#22d3ee",
  cyan: "#22d3ee",
  turquoise: "#2dd4bf",
  bronze: "#cd7f32",
  copper: "#b87333",
  tangerine: "#fb923c",
  plum: "#8b5a83",
  clear: "#e5e7eb",
  translucent: "#e5e7eb",
};

/**
 * Qualifier words that modify a color but are not colors themselves. They are
 * skipped during token scanning so "Charcoal Shade" resolves to charcoal and
 * "Light Blue" resolves to blue.
 */
const QUALIFIERS = new Set([
  "shade",
  "tint",
  "tone",
  "light",
  "dark",
  "medium",
  "deep",
  "bright",
  "pale",
  "optic",
  "electric",
  "army",
  "air",
  "force",
  "vegas",
  "true",
  "hot",
  "neon",
  "heather",
  "metallic",
  "matte",
  "glossy",
  "frost",
  "frosted",
]);

export interface ResolvedColor {
  /** Base-family label (e.g. "Charcoal") or the original name when unmapped. */
  label: string;
  /** Swatch hex; `NEUTRAL_COLOR` when the name maps to no known family. */
  hex: string;
  /** True when the name resolved to a known base color. */
  known: boolean;
}

function titleCase(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve a single raw color name to a base color family. Multi-color values
 * (e.g. "White-Red") should be split before calling this — see `splitColors`.
 */
export function resolveColor(raw: string): ResolvedColor {
  const lower = raw.trim().toLowerCase();

  // Exact match on the full name first (handles "grey" and any multi-word keys).
  if (BASE_COLORS[lower]) {
    return { label: titleCase(lower), hex: BASE_COLORS[lower], known: true };
  }

  // Scan tokens right-to-left: the base color usually trails the qualifier
  // ("Light Blue" -> blue, "Vegas Gold" -> gold, "Charcoal Shade" -> charcoal).
  const tokens = lower.split(/\s+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]!;
    if (QUALIFIERS.has(t)) continue;
    if (BASE_COLORS[t]) {
      return { label: titleCase(t), hex: BASE_COLORS[t], known: true };
    }
  }

  // Unrecognized: keep the original label but a neutral swatch. Callers that
  // de-duplicate by hex collapse all such names into a single neutral chip.
  return { label: titleCase(raw), hex: NEUTRAL_COLOR, known: false };
}
