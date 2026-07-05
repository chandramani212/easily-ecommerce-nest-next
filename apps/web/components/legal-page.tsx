import { Header } from "./header";
import { Footer } from "./footer";
import { Breadcrumb } from "./breadcrumb";
import { getPage, type LegalContent } from "../lib/pages";

/**
 * Renders an editable legal page (Privacy Policy, Terms & Conditions). The
 * body is admin-authored rich text stored on the Page CMS and rendered as HTML.
 */
export async function LegalPage({
  slug,
  fallbackTitle,
}: {
  slug: string;
  fallbackTitle: string;
}) {
  const page = await getPage<LegalContent>(slug);
  const title = page?.title || fallbackTitle;
  const body = page?.content?.body ?? "";

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        {body ? (
          <div
            className="mt-6 text-[15px] leading-relaxed text-[var(--foreground)]/75 [&_a]:text-[var(--accent)] [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--foreground)] [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_li]:mt-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-[var(--foreground)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_*:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="mt-6 text-sm text-[var(--foreground)]/50">
            Content coming soon.
          </p>
        )}
      </div>
      <Footer />
    </>
  );
}
