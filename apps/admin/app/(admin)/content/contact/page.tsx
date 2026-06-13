import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { ContactContent, Page } from "../../../../lib/types";
import { ContactEditor } from "./contact-editor";

export default async function ContactContentPage() {
  const page = await apiFetch<Page<ContactContent>>(`/pages/contact`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Contact page" description="Edit the Contact Us content and SEO" />
      <ContactEditor page={page} />
    </div>
  );
}
