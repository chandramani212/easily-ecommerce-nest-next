import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("privacy");
  return pageMetadata(page, { title: "Privacy Policy — Easily Branded" });
}

export default function PrivacyPage() {
  return <LegalPage slug="privacy" fallbackTitle="Privacy Policy" />;
}
