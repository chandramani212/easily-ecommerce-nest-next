import Link from "next/link";

import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { getPage, pageMetadata, type AboutContent } from "../../lib/pages";

export async function generateMetadata() {
  const page = await getPage("about");
  return pageMetadata(page, {
    title: "About Us - Easily Branded",
    description:
      "Easily Branded helps businesses across the United States with promotional products and branded merchandise.",
  });
}

/** Split an admin-authored text field into paragraphs (blank-line separated). */
function paragraphs(text?: string): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function lines(text?: string): string[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function Paragraphs({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {paragraphs(text).map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}

const ICONS = {
  pin: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  globe:
    "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
};

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-[var(--accent)]"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

const h2 = "text-2xl font-bold tracking-tight sm:text-3xl";

export default async function AboutPage() {
  const page = await getPage<AboutContent>("about");
  const c = page?.content;

  const hero = c?.hero ?? {
    title: "Promotional products",
    highlight: "made easier.",
    intro: "",
  };
  const { why, range, details, quotes, cta, contact } = c ?? {};
  const websiteHref = contact?.website
    ? /^https?:\/\//i.test(contact.website)
      ? contact.website
      : `https://${contact.website}`
    : "";

  return (
    <>
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-20">
        <div
          className={`grid items-center gap-10 lg:gap-14 ${hero.image ? "lg:grid-cols-2" : ""}`}
        >
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              {hero.title}{" "}
              <span className="text-[var(--accent)]">{hero.highlight}</span>
            </h1>
            <Paragraphs
              text={hero.intro}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground)]/70"
            />
          </div>
          {hero.image && (
            // Used as-is like HeroBanner: /hero/* is served from public/ and
            // /uploads/* reaches the API via the next.config rewrite.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.image}
              alt={hero.imageAlt ?? ""}
              className="aspect-[3/2] w-full rounded-2xl object-cover"
            />
          )}
        </div>
      </section>

      {/* Why Easily Branded */}
      {why && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-20">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <h2 className={h2}>{why.heading}</h2>
                {why.callout && (
                  <blockquote className="mt-8 border-l-4 border-[var(--accent)] pl-6 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                    {why.callout}
                  </blockquote>
                )}
              </div>
            </div>
            <Paragraphs
              text={why.body}
              className="max-w-2xl text-[17px] leading-relaxed text-[var(--foreground)]/75 lg:col-span-7"
            />
          </div>
        </section>
      )}

      {/* Product range */}
      {range && (
        <section className="bg-[var(--foreground)] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className={h2}>{range.heading}</h2>
            {range.intro && (
              <p className="mt-3 max-w-2xl text-lg text-white/70">{range.intro}</p>
            )}
            {range.items.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-3">
                {range.items.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-base font-medium sm:text-lg"
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
            {paragraphs(range.outro).length > 0 && (
              <div className="mt-12 grid gap-8 border-t border-white/15 pt-10 md:grid-cols-2 md:gap-12">
                {paragraphs(range.outro).map((p) => (
                  <p key={p} className="max-w-xl text-[17px] leading-relaxed text-white/80">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Details */}
      {details && (
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-20">
          <div className="lg:col-span-5">
            <h2 className={h2}>{details.heading}</h2>
            {details.intro && (
              <p className="mt-4 text-lg text-[var(--foreground)]/70">{details.intro}</p>
            )}
            {details.occasions.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {details.occasions.map((o) => (
                  <li
                    key={o.label}
                    className="rounded-md bg-[var(--accent-light)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Paragraphs
            text={details.body}
            className="text-[17px] leading-relaxed text-[var(--foreground)]/75 lg:col-span-7 lg:pt-2"
          />
        </section>
      )}

      {/* Better quotes */}
      {quotes && (
        <section className="bg-[var(--muted)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <h2 className={h2}>{quotes.heading}</h2>
              <Paragraphs
                text={quotes.intro}
                className="mt-6 text-[17px] leading-relaxed text-[var(--foreground)]/75"
              />
            </div>
            {quotes.options.length > 0 && (
              <ul className="mt-10 grid gap-6 md:grid-cols-3">
                {quotes.options.map((o) => (
                  <li
                    key={o.text}
                    className="border-t-2 border-[var(--accent)] pt-4 text-lg font-medium leading-snug"
                  >
                    {o.text}
                  </li>
                ))}
              </ul>
            )}
            {quotes.outro && (
              <p className="mt-10 text-xl font-semibold">{quotes.outro}</p>
            )}
          </div>
        </section>
      )}

      {/* Call to action + contact details */}
      {(cta || contact) && (
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-20">
          {cta && (
            <div className="lg:col-span-7">
              <h2 className={h2}>{cta.heading}</h2>
              <Paragraphs
                text={cta.body}
                className="mt-6 text-[17px] leading-relaxed text-[var(--foreground)]/75"
              />
              {cta.buttonLabel && cta.buttonHref && (
                <Link
                  href={cta.buttonHref}
                  className={`mt-8 inline-flex rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  {cta.buttonLabel}
                </Link>
              )}
            </div>
          )}
          {contact && (
            <address className="rounded-xl border border-[var(--border)] p-6 not-italic sm:p-8 lg:col-span-5">
              {contact.company && (
                <p className="text-lg font-semibold">{contact.company}</p>
              )}
              <ul className="mt-4 space-y-3 text-[15px] text-[var(--foreground)]/75">
                {contact.address && (
                  <li className="flex gap-3">
                    <Icon d={ICONS.pin} />
                    <span>
                      {lines(contact.address).map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </span>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex gap-3">
                    <Icon d={ICONS.phone} />
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                      className={`hover:text-[var(--accent)] ${focusRing}`}
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li className="flex gap-3">
                    <Icon d={ICONS.mail} />
                    <a
                      href={`mailto:${contact.email}`}
                      className={`hover:text-[var(--accent)] ${focusRing}`}
                    >
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.website && (
                  <li className="flex gap-3">
                    <Icon d={ICONS.globe} />
                    <a
                      href={websiteHref}
                      className={`hover:text-[var(--accent)] ${focusRing}`}
                    >
                      {contact.website.replace(/^https?:\/\//i, "")}
                    </a>
                  </li>
                )}
              </ul>
              {contact.closing && (
                <p className="mt-6 border-t border-[var(--border)] pt-5 font-medium">
                  {contact.closing}
                </p>
              )}
            </address>
          )}
        </section>
      )}

      <Footer />
    </>
  );
}
