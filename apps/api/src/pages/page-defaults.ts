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

export const PAGE_SLUGS = [
  'home',
  'about',
  'contact',
  'privacy',
  'terms',
] as const;
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
            image: '/hero/slide-1.png',
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
      content: {
        heading: 'Why Choose Easily Branded',
        body: '<p>From single prototypes to bulk corporate orders, we make custom branding effortless — premium materials, fast turnaround, and a team that sweats the details so you don\'t have to.</p><h3>What you get</h3><ul><li><strong>Premium materials</strong> tested for durability and a clean finish.</li><li><strong>Fast turnaround</strong> with rush options when you\'re on a deadline.</li><li><strong>Bulk pricing</strong> that rewards bigger orders.</li><li><strong>Dedicated support</strong> from first proof to final delivery.</li></ul><p>Ready to get started? <a href="/#shop">Browse the catalog</a> or <a href="/contact">talk to our team</a>.</p>',
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

  privacy: {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy — Easily Branded',
    metaDescription:
      'How Easily Branded collects, uses, and protects your personal information.',
    keywords: 'privacy, privacy policy, data protection',
    content: {
      body: '<p><em>Last updated: [Effective date]</em></p><p>This Privacy Policy describes how [Legal entity name] (&ldquo;Easily Branded&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your information when you visit our website or purchase our products. By using our site, you consent to the practices described in this policy.</p><h2>1. Who We Are</h2><p>Easily Branded is operated by [Legal entity name], located at [Registered address]. For any privacy-related questions, contact us at <a href="mailto:info@easilybranded.com">info@easilybranded.com</a>.</p><h2>2. Information We Collect</h2><ul><li><strong>Information you provide:</strong> name, email address, phone number, billing and shipping address, company name, order details, custom artwork or logos, and any messages you send us.</li><li><strong>Payment information:</strong> processed securely by our payment providers; we do not store full payment card numbers on our servers.</li><li><strong>Information collected automatically:</strong> IP address, browser and device information, pages viewed, and referring URLs, gathered through cookies and similar technologies.</li></ul><h2>3. How We Use Your Information</h2><ul><li>To process, fulfil, and deliver your orders.</li><li>To produce custom-branded products according to the artwork and specifications you provide.</li><li>To provide customer support and respond to your enquiries.</li><li>To send order confirmations, service updates, and, where you have opted in, marketing communications.</li><li>To improve our website, products, and services.</li><li>To detect, prevent, and address fraud or security issues.</li></ul><h2>4. Cookies and Tracking</h2><p>We use cookies and similar technologies to operate the site, remember your preferences, analyse traffic, and measure marketing performance. You can control cookies through your browser settings; disabling them may affect site functionality.</p><h2>5. How We Share Information</h2><p>We do not sell your personal information. We share it only with:</p><ul><li><strong>Service providers</strong> who help us operate, such as payment processors, shipping carriers, hosting, email, and analytics providers, under confidentiality obligations.</li><li><strong>Legal and regulatory authorities</strong> where required by law or to protect our rights.</li><li><strong>Successors</strong> in connection with a merger, acquisition, or sale of assets.</li></ul><h2>6. Data Retention</h2><p>We retain personal information only for as long as necessary to fulfil the purposes described in this policy, including legal, accounting, and reporting obligations.</p><h2>7. Your Rights</h2><p>Depending on your location, you may have the right to access, correct, update, or delete your personal information, to object to or restrict certain processing, to withdraw consent, and to lodge a complaint with a data protection authority. To exercise these rights, contact us at <a href="mailto:info@easilybranded.com">info@easilybranded.com</a>.</p><h2>8. Data Security</h2><p>We use appropriate technical and organisational measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p><h2>9. International Transfers</h2><p>Your information may be processed in countries other than your own. Where required, we put appropriate safeguards in place for such transfers.</p><h2>10. Children&rsquo;s Privacy</h2><p>Our services are not directed to children under 16, and we do not knowingly collect their personal information.</p><h2>11. Third-Party Links</h2><p>Our site may link to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.</p><h2>12. Changes to This Policy</h2><p>We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated effective date.</p><h2>13. Contact Us</h2><p>If you have questions about this Privacy Policy, contact us at <a href="mailto:info@easilybranded.com">info@easilybranded.com</a> or via our <a href="/contact">contact page</a>.</p>',
    },
  },

  terms: {
    title: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions — Easily Branded',
    metaDescription:
      'The terms and conditions governing your use of Easily Branded.',
    keywords: 'terms, conditions, terms of service',
    content: {
      body: '<p><em>Last updated: [Effective date]</em></p><p>These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the Easily Branded website and the purchase of our products and services. By accessing the site or placing an order, you agree to be bound by these Terms.</p><h2>1. Eligibility</h2><p>You must be at least 18 years old, or have the consent of a parent or guardian, to use this site or place an order.</p><h2>2. Accounts</h2><p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p><h2>3. Orders and Acceptance</h2><p>All orders are offers to purchase and are subject to our acceptance. We may refuse or cancel an order at our discretion, including where there is an error in pricing or product information, or where we suspect fraud.</p><h2>4. Pricing and Payment</h2><ul><li>Prices are displayed in [Currency] and may change without notice.</li><li>Payment is due in full at the time of order unless otherwise agreed in writing.</li><li>You authorise us and our payment providers to charge your chosen payment method for the total order amount, including applicable taxes and shipping.</li></ul><h2>5. Custom Artwork, Proofs, and Intellectual Property</h2><ul><li>You are responsible for ensuring you have the right to use any logos, designs, or content you submit for customisation, and you grant us a licence to reproduce them solely to fulfil your order.</li><li>You warrant that your artwork does not infringe the intellectual property or other rights of any third party.</li><li>Where we provide a digital proof, production begins only after your approval; we are not liable for errors contained in an approved proof.</li></ul><h2>6. Shipping and Delivery</h2><p>Delivery times are estimates and are not guaranteed. Risk of loss passes to you upon delivery to the carrier. Any customs duties or import taxes are your responsibility.</p><h2>7. Returns and Refunds</h2><p>Custom-branded products are made to order and may not be eligible for return except where they are defective or differ materially from the approved proof. Please contact us for assistance with any issue.</p><h2>8. Acceptable Use</h2><p>You agree not to misuse the site, including by attempting unauthorised access, interfering with its operation, or using it for any unlawful purpose.</p><h2>9. Intellectual Property</h2><p>All content on this site, including text, graphics, logos, and images, is the property of Easily Branded or its licensors and may not be used without our prior written permission.</p><h2>10. Disclaimers</h2><p>The site and products are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, to the fullest extent permitted by law.</p><h2>11. Limitation of Liability</h2><p>To the maximum extent permitted by law, Easily Branded shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or products. Our total liability shall not exceed the amount you paid for the relevant order.</p><h2>12. Indemnification</h2><p>You agree to indemnify and hold Easily Branded harmless from any claims arising out of your breach of these Terms or the artwork you submit.</p><h2>13. Governing Law</h2><p>These Terms are governed by the laws of [Governing law / jurisdiction], and any disputes shall be subject to the exclusive jurisdiction of its courts.</p><h2>14. Changes to These Terms</h2><p>We may update these Terms from time to time. Your continued use of the site after changes take effect constitutes acceptance of the revised Terms.</p><h2>15. Contact Us</h2><p>Questions about these Terms? Contact [Legal entity name] at <a href="mailto:info@easilybranded.com">info@easilybranded.com</a> or via our <a href="/contact">contact page</a>.</p>',
    },
  },
};
