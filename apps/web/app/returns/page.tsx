import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("returns");
  return pageMetadata(page, { title: "Return & Refund Policy - Easily Branded" });
}

export default function ReturnsPage() {
  return <LegalPage slug="returns" fallbackTitle="Return & Refund Policy" />;
}
