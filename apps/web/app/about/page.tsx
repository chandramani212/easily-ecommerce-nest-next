import Link from "next/link";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { SectionHeading } from "../../components/section-heading";

export const metadata = {
  title: "About Us - Easily Branded",
  description:
    "Learn about Easily Branded — our mission, values, and the team making custom branding simple.",
};

const TEAM = [
  { name: "Alex Rivera", role: "CEO & Founder", initials: "AR", color: "#1a9e7a" },
  { name: "Jordan Lee", role: "Head of Design", initials: "JL", color: "#1b2e4b" },
  { name: "Sam Patel", role: "CTO", initials: "SP", color: "#0d9488" },
  { name: "Morgan Chen", role: "Head of Operations", initials: "MC", color: "#047857" },
];

const VALUES = [
  {
    title: "Customer First",
    description:
      "Every decision starts with our customers. We listen, learn, and build with your needs at the forefront.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    title: "Quality Guaranteed",
    description:
      "We rigorously vet every product and supplier to ensure you receive only the best, every time you shop.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Sustainability",
    description:
      "From eco-friendly packaging to carbon-neutral shipping, we're committed to reducing our environmental footprint.",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Transparency",
    description:
      "No hidden fees, no tricks. We believe in honest pricing, clear policies, and open communication.",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  },
];

const MILESTONES = [
  { year: "2020", title: "Founded", description: "Easily Branded launched with a mission to make online shopping simple and delightful." },
  { year: "2021", title: "10K Customers", description: "Hit our first major milestone, growing entirely through word-of-mouth." },
  { year: "2023", title: "500K Orders", description: "Half a million orders shipped, with a 98.5% satisfaction rate." },
  { year: "2026", title: "Going Global", description: "Now serving customers in 30+ countries with localized experiences." },
];

export default function AboutPage() {
  return (
    <>
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Building a Better Way to{" "}
            <span className="text-[var(--accent)]">Shop Online</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground)]/60">
            Easily Branded was founded with a simple belief: online shopping should be
            easy, trustworthy, and enjoyable. We&apos;re a passionate team
            dedicated to curating the best products and delivering an
            exceptional experience from browse to doorstep.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: "500K+", label: "Orders Shipped" },
            { value: "50K+", label: "Happy Customers" },
            { value: "30+", label: "Countries Served" },
            { value: "98.5%", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-[var(--accent)]">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--foreground)]/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Core Values"
          subtitle="The principles that guide everything we do"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-[var(--border)] p-6 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-light)]">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[var(--accent)]"
                >
                  <path d={value.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/60">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Our Journey"
            subtitle="Key milestones that shaped who we are"
          />
          <div className="mx-auto max-w-3xl">
            <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-[var(--border)] sm:before:left-1/2 sm:before:-translate-x-px">
              {MILESTONES.map((m, i) => (
                <div
                  key={m.year}
                  className={`relative flex items-start gap-4 sm:gap-8 ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  <div className={`hidden flex-1 sm:block ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                      <p className="text-sm font-bold text-[var(--accent)]">{m.year}</p>
                      <h3 className="mt-1 font-semibold">{m.title}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground)]/60">{m.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--background)] text-xs font-bold text-[var(--accent)]">
                    {m.year.slice(2)}
                  </div>
                  <div className="flex-1 sm:hidden">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                      <p className="text-sm font-bold text-[var(--accent)]">{m.year}</p>
                      <h3 className="mt-1 font-semibold">{m.title}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground)]/60">{m.description}</p>
                    </div>
                  </div>
                  <div className="hidden flex-1 sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Meet Our Team"
          subtitle="The people behind Easily Branded"
        />
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          {TEAM.map((member) => (
            <div key={member.name} className="text-center">
              <div
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </div>
              <h3 className="mt-4 font-semibold">{member.name}</h3>
              <p className="text-sm text-[var(--foreground)]/50">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {/* <section className="border-t border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Ready to start shopping?</h2>
          <p className="mt-2 text-[var(--foreground)]/50">
            Join thousands of happy customers and discover quality products at
            great prices.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/#shop"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white transition-colors hover:opacity-90"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 font-medium transition-colors hover:bg-[var(--background)]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section> */}

      <Footer />
    </>
  );
}
