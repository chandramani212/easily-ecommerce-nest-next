import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("accessibility");
  return pageMetadata(page, { title: "Accessibility Statement - Easily Branded" });
}

export default function AccessibilityPage() {
  return <LegalPage slug="accessibility" fallbackTitle="Accessibility Statement" />;
}
