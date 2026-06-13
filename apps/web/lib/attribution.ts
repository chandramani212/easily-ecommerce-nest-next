"use client";

/**
 * First-touch lead-source attribution. Captured client-side from the landing
 * URL's UTM params + the external referrer, stashed in sessionStorage so it
 * survives navigation to the enquiry form, then sent with the lead. The API
 * classifies it into a source bucket + organic/other.
 */

const KEY = "lead_attribution";

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

/** Call once on mount. Records first-touch; only overwrites when fresh UTM params appear. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Attribution = {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
    const hasUtm = utm.utmSource || utm.utmMedium || utm.utmCampaign;
    const already = sessionStorage.getItem(KEY);
    if (already && !hasUtm) return; // keep first touch

    const ref = document.referrer || "";
    const external = ref && !ref.includes(window.location.host) ? ref : "";
    sessionStorage.setItem(KEY, JSON.stringify({ ...utm, referrer: external }));
  } catch {
    /* sessionStorage unavailable (private mode) — attribution is best-effort. */
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}
