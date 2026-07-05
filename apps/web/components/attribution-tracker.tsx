"use client";

import { useEffect } from "react";

import { captureAttribution } from "../lib/attribution";

/**
 * Records first-touch lead-source attribution on the very first page load,
 * regardless of which page the visitor lands on (home, a category, a product,
 * etc.). Mounted once in the root layout so the landing URL's UTM params and
 * external referrer are stashed in sessionStorage immediately — before the
 * visitor navigates away and that information is gone. The enquiry form then
 * reads it at submit time. Renders nothing.
 */
export function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
