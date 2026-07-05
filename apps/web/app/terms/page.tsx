import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("terms");
  return pageMetadata(page, { title: "Terms & Conditions — Easily Branded" });
}

export default function TermsPage() {
  return <LegalPage slug="terms" fallbackTitle="Terms & Conditions" />;
}
