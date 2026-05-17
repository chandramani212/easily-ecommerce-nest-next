import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact Us - Easily Branded",
  description:
    "Get in touch with the Easily Branded team. We're here to help with orders, questions, and feedback.",
};

const CONTACT_INFO = [
  {
    title: "Email Us",
    description: "Our team typically responds within 24 hours.",
    detail: "support@shopease.com",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "Call Us",
    description: "Mon-Fri from 9AM to 6PM EST.",
    detail: "+1 (555) 123-4567",
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  },
  {
    title: "Visit Us",
    description: "Come say hello at our office.",
    detail: "123 Commerce St, San Francisco, CA 94102",
    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const FAQ = [
  {
    question: "What are your shipping options?",
    answer:
      "We offer standard (5-7 business days), express (2-3 business days), and overnight shipping. Orders over $50 qualify for free standard shipping.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We accept returns within 30 days of delivery. Items must be in original condition with tags attached. We provide free return shipping labels.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your order status in your account dashboard.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes! We ship to over 30 countries worldwide. International shipping rates and delivery times vary by destination.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            We&apos;d Love to{" "}
            <span className="text-[var(--accent)]">Hear from You</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--foreground)]/60">
            Have a question, suggestion, or just want to say hi? Our team is
            ready to assist you.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CONTACT_INFO.map((info) => (
            <div
              key={info.title}
              className="rounded-xl border border-[var(--border)] p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-light)]">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[var(--accent)]"
                >
                  <path d={info.icon} />
                </svg>
              </div>
              <h3 className="font-semibold">{info.title}</h3>
              <p className="mt-1 text-sm text-[var(--foreground)]/50">
                {info.description}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                {info.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="border-t border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold">Send Us a Message</h2>
              <p className="mt-2 text-sm text-[var(--foreground)]/50">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible.
              </p>
              <ContactForm />
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="mt-2 text-sm text-[var(--foreground)]/50">
                Quick answers to common questions.
              </p>
              <div className="mt-6 space-y-4">
                {FAQ.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
                  >
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/60">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      {/* <section className="border-t border-[var(--border)]">
        <div className="flex h-64 items-center justify-center bg-[var(--muted)]">
          <div className="text-center">
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
              className="mx-auto text-[var(--foreground)]/20"
            >
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm text-[var(--foreground)]/40">
              123 Commerce St, San Francisco, CA 94102
            </p>
          </div>
        </div>
      </section> */}

      <Footer />
    </>
  );
}
