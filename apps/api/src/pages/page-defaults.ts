/**
 * Seed content for the editable storefront pages. Mirrors what the web app
 * previously hard-coded so the very first GET returns the same page the user
 * already sees; admins then tweak it from the dashboard. The web app renders
 * entirely from this shape, so decorative bits (icon paths, gradients, colors)
 * live here too and are round-tripped untouched by the admin editor.
 */

export interface PageSeed {
  title: string;
  content: Record<string, unknown>;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export const PAGE_SLUGS = ['home', 'about', 'contact'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const PAGE_DEFAULTS: Record<PageSlug, PageSeed> = {
  home: {
    title: 'Home',
    metaTitle: 'Easily Branded — Custom Branded Products',
    metaDescription:
      'Custom branded T-shirts, stationery, drinkware, and more. Premium quality printing with fast turnaround and bulk discounts.',
    keywords: 'custom branding, promotional products, bulk orders',
    content: {
      hero: {
        autoPlayMs: 5000,
        slides: [
          {
            tag: 'Custom Branding 2026',
            heading: 'Your Brand,',
            highlight: 'Made Easy',
            description:
              'Custom branded T-shirts, stationery, drinkware, and more. Premium quality printing with fast turnaround and bulk discounts.',
            ctaLabel: 'Shop Now',
            ctaHref: '/#shop',
            ctaSecondaryLabel: 'View Categories',
            ctaSecondaryHref: '/#categories',
            gradient: 'from-teal-700 via-emerald-700 to-green-800',
            image: '/hero/slide-1.svg',
          },
          {
            tag: 'Bulk Discount',
            heading: 'Up to 50% Off',
            highlight: 'Bulk Orders',
            description:
              'The more you order, the more you save. Perfect for events, teams, and corporate gifting at unbeatable prices.',
            ctaLabel: 'Shop Deals',
            ctaHref: '/#shop',
            ctaSecondaryLabel: 'See All Offers',
            ctaSecondaryHref: '/#shop',
            gradient: 'from-slate-800 via-slate-700 to-teal-800',
            image: '/hero/slide-2.svg',
          },
          {
            tag: 'Free Shipping',
            heading: 'Fast & Reliable',
            highlight: 'Delivery',
            description:
              'Free shipping on all orders over $50. Get your products delivered to your door in 2-5 business days.',
            ctaLabel: 'Start Shopping',
            ctaHref: '/#shop',
            ctaSecondaryLabel: '',
            ctaSecondaryHref: '',
            gradient: 'from-emerald-600 via-teal-600 to-slate-700',
            image: '/hero/slide-3.svg',
          },
        ],
      },
    },
  },

  about: {
    title: 'About Us',
    metaTitle: 'About Us - Easily Branded',
    metaDescription:
      'Learn about Easily Branded — our mission, values, and the team making custom branding simple.',
    keywords: 'about, company, mission, team',
    content: {
      hero: {
        title: 'Building a Better Way to',
        highlight: 'Shop Online',
        intro:
          "Easily Branded was founded with a simple belief: online shopping should be easy, trustworthy, and enjoyable. We're a passionate team dedicated to curating the best products and delivering an exceptional experience from browse to doorstep.",
      },
      stats: [
        { value: '500K+', label: 'Orders Shipped' },
        { value: '50K+', label: 'Happy Customers' },
        { value: '30+', label: 'Countries Served' },
        { value: '98.5%', label: 'Satisfaction Rate' },
      ],
      valuesHeading: 'Our Core Values',
      valuesSubtitle: 'The principles that guide everything we do',
      values: [
        {
          title: 'Customer First',
          description:
            'Every decision starts with our customers. We listen, learn, and build with your needs at the forefront.',
          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        },
        {
          title: 'Quality Guaranteed',
          description:
            'We rigorously vet every product and supplier to ensure you receive only the best, every time you shop.',
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        },
        {
          title: 'Sustainability',
          description:
            "From eco-friendly packaging to carbon-neutral shipping, we're committed to reducing our environmental footprint.",
          icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        },
        {
          title: 'Transparency',
          description:
            'No hidden fees, no tricks. We believe in honest pricing, clear policies, and open communication.',
          icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
        },
      ],
      timelineHeading: 'Our Journey',
      timelineSubtitle: 'Key milestones that shaped who we are',
      milestones: [
        { year: '2020', title: 'Founded', description: 'Easily Branded launched with a mission to make online shopping simple and delightful.' },
        { year: '2021', title: '10K Customers', description: 'Hit our first major milestone, growing entirely through word-of-mouth.' },
        { year: '2023', title: '500K Orders', description: 'Half a million orders shipped, with a 98.5% satisfaction rate.' },
        { year: '2026', title: 'Going Global', description: 'Now serving customers in 30+ countries with localized experiences.' },
      ],
      teamHeading: 'Meet Our Team',
      teamSubtitle: 'The people behind Easily Branded',
      team: [
        { name: 'Alex Rivera', role: 'CEO & Founder', initials: 'AR', color: '#1a9e7a' },
        { name: 'Jordan Lee', role: 'Head of Design', initials: 'JL', color: '#1b2e4b' },
        { name: 'Sam Patel', role: 'CTO', initials: 'SP', color: '#0d9488' },
        { name: 'Morgan Chen', role: 'Head of Operations', initials: 'MC', color: '#047857' },
      ],
    },
  },

  contact: {
    title: 'Contact Us',
    metaTitle: 'Contact Us - Easily Branded',
    metaDescription:
      "Get in touch with the Easily Branded team. We're here to help with orders, questions, and feedback.",
    keywords: 'contact, support, help',
    content: {
      hero: {
        title: "We'd Love to",
        highlight: 'Hear from You',
        intro:
          'Have a question, suggestion, or just want to say hi? Our team is ready to assist you.',
      },
      info: [
        {
          title: 'Email Us',
          description: 'Our team typically responds within 24 hours.',
          detail: 'support@shopease.com',
          icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        },
        {
          title: 'Call Us',
          description: 'Mon-Fri from 9AM to 6PM EST.',
          detail: '+1 (555) 123-4567',
          icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
        },
        {
          title: 'Visit Us',
          description: 'Come say hello at our office.',
          detail: '123 Commerce St, San Francisco, CA 94102',
          icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
        },
      ],
      formHeading: 'Send Us a Message',
      formSubheading:
        "Fill out the form below and we'll get back to you as soon as possible.",
      faqHeading: 'Frequently Asked Questions',
      faqSubheading: 'Quick answers to common questions.',
      faq: [
        { question: 'What are your shipping options?', answer: 'We offer standard (5-7 business days), express (2-3 business days), and overnight shipping. Orders over $50 qualify for free standard shipping.' },
        { question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery. Items must be in original condition with tags attached. We provide free return shipping labels.' },
        { question: 'How can I track my order?', answer: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your order status in your account dashboard." },
        { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 30 countries worldwide. International shipping rates and delivery times vary by destination.' },
      ],
    },
  },
};
