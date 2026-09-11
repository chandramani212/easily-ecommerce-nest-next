import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("cookie-policy");
  return pageMetadata(page, { title: "Cookie Policy - Easily Branded" });
}

export default function CookiePolicyPage() {
  return <LegalPage slug="cookie-policy" fallbackTitle="Cookie Policy" />;
}
