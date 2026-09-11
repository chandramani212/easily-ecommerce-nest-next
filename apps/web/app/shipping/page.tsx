import { LegalPage } from "../../components/legal-page";
import { getPage, pageMetadata, type LegalContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage<LegalContent>("shipping");
  return pageMetadata(page, {
    title: "Shipping & Delivery Policy - Easily Branded",
  });
}

export default function ShippingPage() {
  return <LegalPage slug="shipping" fallbackTitle="Shipping & Delivery Policy" />;
}
