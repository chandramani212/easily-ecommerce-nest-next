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
  'returns',
  'shipping',
  'cookie-policy',
  'accessibility',
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
        // 'split' = text + side image; 'full' = full-width banner image + link.
        variant: 'split',
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
    // Multi-paragraph fields separate paragraphs with a blank line.
    content: {
      hero: {
        title: 'Promotional products',
        highlight: 'made easier.',
        intro: [
          'Welcome to Easily Branded.',
          'We help businesses across the United States put their brand in the hands of their customers, employees and audiences through promotional products and branded merchandise.',
          'Whether you need 50 branded pens for a local event, hundreds of custom shirts for your team or thousands of promotional products for a nationwide campaign, we can help.',
        ].join('\n\n'),
        image: '/hero/slide-1.png',
        imageAlt:
          'Branded promotional products including bottles, mugs, bags, notebooks and caps',
      },
      why: {
        heading: 'Why Easily Branded?',
        body: [
          'We started Easily Branded because we believe ordering promotional products should be straightforward.',
          'There are plenty of large promotional product companies out there. They have huge teams, massive catalogues and layers of account management.',
          "We're different.",
          "We're a smaller business, which means you get a more personal service and direct communication with the people working on your order.",
          'We can also be more flexible when it comes to sourcing products and building quotes around your budget.',
          "We don't want to sell you the most expensive product. We want to find the product that makes the most sense for what you're trying to achieve.",
        ].join('\n\n'),
        callout: 'In simple terms, being smaller can mean better value for you.',
      },
      range: {
        heading: 'What can we help with?',
        intro: 'We supply a wide range of promotional products, including:',
        items: [
          'Pens and writing products',
          'Mugs and drinkware',
          'Bags and backpacks',
          'Clothing and apparel',
          'Technology products',
          'Office and desk accessories',
          'Trade show giveaways',
          'Event merchandise',
          'Corporate gifts',
          'Employee and onboarding products',
          'Wellness and leisure products',
          'Eco-friendly promotional products',
          'Custom merchandise',
          'Campaign merchandise',
        ].map((label) => ({ label })),
        outro: [
          "If you already know what you want, send us the details and we'll put together a quote.",
          "If you're not sure what you want, that's fine too. Tell us about your event, campaign, audience, budget or deadline and we'll help you find some options.",
        ].join('\n\n'),
      },
      details: {
        heading: 'We care about the details',
        intro: 'Promotional products are often ordered for an important date.',
        occasions: [
          'A conference',
          'A product launch',
          'A trade show',
          'An employee event',
          'A marketing campaign',
        ].map((label) => ({ label })),
        body: [
          'We understand that getting the products right and getting them on time matters.',
          "That's why we focus on keeping communication clear from the initial quote through to production and delivery.",
          "We'll tell you what we know, flag anything that could affect your order and work with you to find a solution if something changes.",
        ].join('\n\n'),
      },
      quotes: {
        heading: 'Better quotes. Better service.',
        intro: [
          'Being a smaller company allows us to spend more time on individual orders.',
          "For larger quantities, tight deadlines or more unusual requirements, we'll look at different products and suppliers to find the best fit.",
        ].join('\n\n'),
        options: [
          'Sometimes that means finding a better product.',
          'Sometimes it means finding a cheaper alternative.',
          'Sometimes it means finding something that can be produced faster.',
        ].map((text) => ({ text })),
        outro:
          'Our job is to give you options and help you make the right decision.',
      },
      cta: {
        heading: "We're here to make things easier.",
        body: [
          "You shouldn't need to become a promotional products expert just to order branded merchandise.",
          "Tell us what you're trying to achieve and we'll take it from there.",
        ].join('\n\n'),
        buttonLabel: 'Contact us',
        buttonHref: '/contact',
      },
      contact: {
        company: 'Easily Branded LLC',
        address:
          '16192 Coastal Highway\nLewes, DE 19958\nSussex County, Delaware, USA',
        phone: '(302) 313-0900',
        email: 'info@easilybranded.com',
        website: 'www.easilybranded.com',
        closing: "We're looking forward to working with you.",
      },
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
          detail: 'orders@easilybranded.com',
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
      body: "<p><em>Last updated: September 9, 2026</em></p><p>At Easily Branded, we respect your privacy.</p><p>This Privacy Policy explains what information we collect, why we collect it and how we use it when you visit easilybranded.com, request a quote, place an order or contact us.</p><h2>1. Who we are</h2><p><strong>Easily Branded LLC</strong></p><p>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County<br>Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p><h2>2. Information we collect</h2><p>Depending on how you interact with us, we may collect information such as:</p><ul><li>Your name</li><li>Company name</li><li>Email address</li><li>Phone number</li><li>Billing address</li><li>Shipping address</li><li>Products you order</li><li>Order history</li><li>Artwork and logos</li><li>Information you provide when requesting a quote</li><li>Messages you send to us</li><li>Payment information required to process your order</li></ul><p>We may also automatically collect certain technical information when you visit our website, such as your IP address, browser type, device information, pages viewed and website activity.</p><h2>3. How we use your information</h2><p>We use information to run our business and provide the service you've asked for.</p><p>This can include:</p><ul><li>Responding to enquiries</li><li>Preparing quotes</li><li>Processing orders</li><li>Producing and delivering products</li><li>Processing payments</li><li>Providing customer support</li><li>Communicating about your order</li><li>Improving our website</li><li>Understanding how customers use our website</li><li>Preventing fraud</li><li>Protecting our systems</li><li>Sending marketing where permitted</li><li>Meeting legal requirements</li></ul><h2>4. Your artwork</h2><p>If you send us a logo or other artwork, we may need to provide it to the supplier, manufacturer or decorator producing your products.</p><p>We'll only use it for purposes connected with your order unless we have your permission to use it for something else.</p><h2>5. Payment information</h2><p>Payments may be processed through third-party payment providers.</p><p>We generally do not store complete credit or debit card details ourselves.</p><p>Your payment provider may have its own privacy policy and terms.</p><h2>6. Companies we work with</h2><p>We may use third-party companies to help us operate our business.</p><p>For example:</p><ul><li>Website hosting</li><li>Payment processing</li><li>Product suppliers</li><li>Manufacturers</li><li>Product decorators</li><li>Shipping companies</li><li>Email services</li><li>CRM systems</li><li>Analytics</li><li>Marketing</li><li>IT and security services</li></ul><p>We only share information where it is reasonably necessary for these companies to provide their services.</p><h2>7. Marketing</h2><p>We may send you marketing emails where permitted by law.</p><p>You can unsubscribe at any time using the unsubscribe link in our emails.</p><p>Even if you unsubscribe from marketing, we may still contact you about an order, payment, account or other service-related matter.</p><h2>8. Cookies</h2><p>Our website uses cookies and similar technologies.</p><p>These help us operate the website, understand how people use it and, where applicable, measure marketing.</p><p>See our <a href=\"/cookie-policy\">Cookie Policy</a> for more information.</p><h2>9. Information sharing</h2><p>We do not sell your personal information as part of our ordinary business.</p><p>We may share information when necessary to:</p><ul><li>Complete your order</li><li>Deliver products</li><li>Process payments</li><li>Provide services</li><li>Protect our business</li><li>Prevent fraud</li><li>Comply with the law</li><li>Respond to lawful requests</li></ul><p>Some state privacy laws may classify certain advertising or data activities differently. Where a law gives you a right to opt out, we will respect that right where applicable.</p><h2>10. How we protect information</h2><p>We take reasonable steps to protect personal information against unauthorized access, loss or misuse.</p><p>However, no website or electronic system can be guaranteed to be completely secure.</p><h2>11. How long we keep information</h2><p>We keep information for as long as we reasonably need it for business, legal, accounting, customer-service and other legitimate purposes.</p><p>The length of time depends on the type of information and why we collected it.</p><h2>12. Your privacy rights</h2><p>Depending on where you live, you may have rights relating to your personal information.</p><p>These may include the right to:</p><ul><li>Access your information</li><li>Correct inaccurate information</li><li>Request deletion</li><li>Obtain a copy of certain information</li><li>Opt out of certain data uses</li><li>Opt out of targeted advertising</li><li>Exercise other rights provided by applicable state law</li></ul><p>Not every right applies to every person or situation.</p><h2>13. Delaware residents</h2><p>Delaware's Personal Data Privacy Act provides certain qualifying Delaware residents with rights relating to their personal information.</p><p>Where the law applies to us and to your request, we'll handle your request in accordance with applicable Delaware law.</p><h2>14. California and other states</h2><p>Other states may provide additional privacy rights.</p><p>Where applicable, we'll comply with the privacy rights and requirements that apply to our business and your request.</p><h2>15. Making a privacy request</h2><p>If you want to ask about your personal information or exercise a privacy right, contact us:</p><p><strong><a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></strong></p><p>We may need to verify your identity before completing certain requests.</p><h2>16. Children's privacy</h2><p>Our website is not directed at children under 13.</p><p>We do not knowingly collect personal information from children under 13.</p><h2>17. Changes to this Privacy Policy</h2><p>We may update this Privacy Policy as our business, website or legal requirements change.</p><p>The latest version will always be available on easilybranded.com.</p><h2>18. Contact us</h2><p><strong>Easily Branded LLC</strong></p><p>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County<br>Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p>",
    },
  },

  terms: {
    title: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions — Easily Branded',
    metaDescription:
      'The terms and conditions governing your use of Easily Branded.',
    keywords: 'terms, conditions, terms of service',
    content: {
      body: "<p><em>Last updated: September 9, 2026</em></p><p>These Terms &amp; Conditions explain how Easily Branded works when you use our website, request a quote or place an order with us.</p><p>We've tried to keep them straightforward and easy to understand. If you have any questions about an order or these terms, please contact us.</p><h2>1. Who we are</h2><p>Easily Branded LLC is a limited liability company registered in Delaware.</p><p><strong>Easily Branded LLC</strong><br>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County<br>Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p><p>When we say \"Easily Branded\", \"we\", \"us\" or \"our\", we mean Easily Branded LLC.</p><p>When we say \"you\" or \"your\", we mean the person or business using our website or placing an order.</p><h2>2. Using our website</h2><p>You are welcome to use easilybranded.com for legitimate business and personal purposes.</p><p>Please don't use our website to:</p><ul><li>Do anything illegal or fraudulent</li><li>Try to access systems or information that you are not authorized to access</li><li>Introduce viruses or other harmful software</li><li>Interfere with the operation of our website</li><li>Copy or use our website content commercially without our permission</li><li>Infringe someone else's intellectual property rights</li><li>Provide information that you know is false or misleading</li></ul><p>If we believe the website is being misused, we may restrict or remove access.</p><h2>3. Products on our website</h2><p>We do our best to make sure our product descriptions, images, specifications and prices are accurate.</p><p>However, promotional products are manufactured by different suppliers, so some details can change.</p><p>For example, there may be small differences in:</p><ul><li>Product color</li><li>Product dimensions</li><li>Materials</li><li>Finish</li><li>Packaging</li><li>Product specifications</li></ul><p>Images on our website are sometimes examples and may not show the exact finished product, particularly where the product is customized.</p><p>If a manufacturer changes or discontinues a product, we may need to offer an alternative.</p><h2>4. Quotes</h2><p>When you ask us for a quote, we'll base it on the information you provide.</p><p>This can include:</p><ul><li>Product</li><li>Quantity</li><li>Branding method</li><li>Artwork</li><li>Delivery location</li><li>Required delivery date</li><li>Shipping method</li></ul><p>A quote may change if any of these details change.</p><p>Quotes may also be affected by supplier availability, changes in supplier pricing or other circumstances outside our control.</p><p>Unless we state otherwise, a quote is not an order and does not guarantee that the product will remain available.</p><p>We'll confirm the final price with you before the order is placed.</p><h2>5. Placing an order</h2><p>When you place an order, you are asking us to supply the products described in your order.</p><p>An order becomes accepted once we confirm it and any required payment or deposit has been received.</p><p>In some situations, we may need to decline or cancel an order.</p><p>This could happen if:</p><ul><li>A product becomes unavailable</li><li>There was a significant pricing error</li><li>We cannot fulfil the order</li><li>Payment cannot be processed</li><li>We suspect fraud</li><li>The requested artwork cannot legally be reproduced</li><li>We cannot reasonably meet the requirements of the order</li></ul><p>If we cancel an order after receiving payment, we'll refund the amount paid for the cancelled part of the order.</p><h2>6. Custom and branded products</h2><p>A large part of what we sell is made specifically for our customers.</p><p>This includes products with:</p><ul><li>Company logos</li><li>Names</li><li>Artwork</li><li>Text</li><li>Photographs</li><li>Custom colors</li><li>Personalization</li><li>Custom packaging</li><li>Other customer-specific information</li></ul><p>Because these products are made specifically for you, they generally cannot be returned simply because you change your mind or no longer need them.</p><h2>7. Artwork and proofs</h2><p>You're responsible for making sure the artwork you provide is correct.</p><p>If we send you an artwork proof, please check it carefully before approving it.</p><p>Your approval confirms that you're happy with the artwork and details shown on the proof.</p><p>This includes things such as:</p><ul><li>Spelling</li><li>Names</li><li>Logos</li><li>Colors</li><li>Logo positioning</li><li>Text</li><li>Images</li><li>Product choice</li><li>Quantity</li><li>Decoration method</li></ul><p>Once you approve the artwork and production starts, we may not be able to make changes.</p><p>If changes are possible, additional costs may apply.</p><h2>8. Your artwork and trademarks</h2><p>When you send us a logo, photograph, design, trademark or other artwork, you are confirming that you have permission to use it.</p><p>You are responsible for making sure the artwork does not infringe someone else's copyright, trademark or other rights.</p><p>We only use your artwork for purposes connected with your order, such as quoting, producing and delivering your products.</p><h2>9. Production and manufacturing</h2><p>Promotional products are produced using commercial manufacturing and decoration processes.</p><p>Small variations can sometimes occur in:</p><ul><li>Color</li><li>Print position</li><li>Print density</li><li>Embroidery</li><li>Dimensions</li><li>Materials</li><li>Finish</li></ul><p>Small variations that are normal for the manufacturing or decoration process do not necessarily mean that the products are defective.</p><p>If there is a genuine problem with your order, please contact us and we'll investigate it.</p><h2>10. Order quantities</h2><p>Some manufacturers allow a small variation between the quantity ordered and the quantity ultimately produced.</p><p>If a material difference occurs, please contact us and we'll look into it.</p><h2>11. Payment</h2><p>Payment requirements will be explained when we provide your quote or order confirmation.</p><p>Depending on the order, we may require:</p><ul><li>Payment in full before production</li><li>A deposit before production</li><li>Credit or debit card payment</li><li>ACH</li><li>Bank transfer</li><li>Another agreed payment method</li></ul><p>For approved business accounts, we may offer alternative payment terms in writing.</p><p>Production will normally begin once the required payment has been received.</p><h2>12. Sales tax</h2><p>Applicable sales tax will be added where required by law.</p><p>The amount of sales tax can depend on the delivery address and applicable state and local requirements.</p><h2>13. Cancelling an order</h2><p>If you need to cancel an order, please contact us as quickly as possible.</p><p>We'll always try to help where we can.</p><p>If production has not started, cancellation may be possible.</p><p>If we have already sourced the products, purchased materials, started production or committed costs to your order, cancellation may not be possible.</p><p>Where we agree to cancel an order after costs have been incurred, those costs may be deducted from any refund.</p><p>Custom products already in production generally cannot be cancelled.</p><h2>14. Delivery</h2><p>We'll provide an estimated production and delivery timeframe when we quote or confirm your order.</p><p>Production time and shipping time are separate.</p><p>The final delivery date can be affected by things such as supplier availability, artwork approval, production schedules, carrier delays, weather and other circumstances outside our reasonable control.</p><p>We will always make reasonable efforts to meet the delivery timeframe we give you.</p><p>Where we know that an order is going to be significantly delayed, we'll contact you and explain the available options.</p><h2>15. Shipping information</h2><p>You're responsible for providing the correct delivery address.</p><p>Please check that your:</p><ul><li>Company name</li><li>Recipient name</li><li>Street address</li><li>Apartment or suite number</li><li>City</li><li>State</li><li>ZIP code</li><li>Contact details</li></ul><p>are correct.</p><p>If an order needs to be reshipped because an incorrect address was provided, additional shipping costs may apply.</p><h2>16. Returns and refunds</h2><p>Our <a href=\"/returns\">Return &amp; Refund Policy</a> explains how returns, replacements and refunds work.</p><p>Because many of our products are customized, custom products generally cannot be returned simply because you have changed your mind.</p><p>If products are defective, damaged, incorrectly produced or materially different from what was agreed, we'll work with you to resolve the issue.</p><h2>17. Our website content</h2><p>The content on easilybranded.com belongs to Easily Branded LLC or is used with permission.</p><p>This includes our:</p><ul><li>Text</li><li>Graphics</li><li>Website design</li><li>Images</li><li>Logos</li><li>Product descriptions</li><li>Other website content</li></ul><p>You cannot copy or commercially use our website content without our permission.</p><h2>18. Third-party brands</h2><p>Some products we sell may carry third-party trademarks or brand names.</p><p>Those trademarks belong to their respective owners.</p><p>Their appearance on our website does not mean that those companies endorse or sponsor Easily Branded unless we specifically say so.</p><h2>19. Your company logo</h2><p>We may need to provide your logo or artwork to suppliers and production partners to complete your order.</p><p>We will only use your branding for purposes connected with your order unless we have your permission to use it for another purpose.</p><p>We will not publicly advertise that you are an Easily Branded customer without your permission.</p><h2>20. Website links</h2><p>Our website may contain links to other websites.</p><p>Those websites are operated by third parties, and we are not responsible for their content, security or privacy practices.</p><h2>21. Pricing or website errors</h2><p>We try hard to keep our website accurate.</p><p>If we discover a significant pricing, product or specification error, we may contact you before processing the order.</p><p>If we cannot agree on a solution, we may cancel the affected order and refund any payment received.</p><h2>22. Circumstances outside our control</h2><p>Sometimes things happen that we simply cannot control.</p><p>This can include severe weather, natural disasters, fires, supplier problems, transport disruption, government action, labor disputes, power failures, cyber incidents and similar events.</p><p>If something like this affects your order, we'll keep you informed and do what we reasonably can to minimize the impact.</p><h2>23. Liability</h2><p>We will always take reasonable care in providing our products and services.</p><p>However, to the extent allowed by law, we are not responsible for indirect or consequential losses arising from an order or use of our website.</p><p>Where liability can legally be limited, our liability relating to an individual order will generally be limited to the amount you paid us for the products giving rise to the claim.</p><p>Nothing in these Terms is intended to remove a legal right or protection that cannot legally be excluded.</p><h2>24. Your responsibility</h2><p>You are responsible for information, artwork and materials that you provide to us.</p><p>If a claim arises because you supplied artwork or content that you did not have permission to use, you agree to take responsibility for that claim and any reasonable costs that result.</p><h2>25. Delaware law</h2><p>These Terms are governed by the laws of the State of Delaware, unless applicable law requires otherwise.</p><p>Any dispute will be dealt with by a court that has proper jurisdiction, subject to any rights you may have under applicable law.</p><h2>26. Changes to these Terms</h2><p>We may update these Terms from time to time.</p><p>The latest version will be published on easilybranded.com and will show the date it was last updated.</p><h2>27. If part of these Terms is invalid</h2><p>If a court decides that part of these Terms cannot be enforced, the rest of the Terms will continue to apply.</p><h2>28. Contact us</h2><p>If you have a question about these Terms or an order, please contact us.</p><p><strong>Easily Branded LLC</strong><br>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County, Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p><p><strong>Website:</strong> <a href=\"http://www.easilybranded.com\">www.easilybranded.com</a></p>",
    },
  },

  returns: {
    title: 'Return & Refund Policy',
    metaTitle: 'Return & Refund Policy — Easily Branded',
    metaDescription:
      'How returns, replacements and refunds work for custom and non-custom promotional products from Easily Branded.',
    keywords: 'returns, refunds, return policy',
    content: {
      body: "<p><em>Last updated: September 9, 2026</em></p><p>We want you to be happy with your order.</p><p>We also know that promotional products are different from normal retail purchases because many of them are made specifically for your business.</p><p>This policy explains what happens if something goes wrong.</p><h2>Custom products</h2><p>Most of the products we supply are customized for you.</p><p>That could mean adding your logo, company name, artwork, employee names, custom colors or other information.</p><p>Once a custom product has entered production, it generally cannot be returned because you have changed your mind, no longer need it or ordered more than you require.</p><h2>If something is wrong with your order</h2><p>If your products arrive:</p><ul><li>Damaged</li><li>Defective</li><li>Incorrect</li><li>Incorrectly branded</li><li>Materially different from the approved specifications</li></ul><p>please let us know.</p><p>We want to fix the problem rather than make you spend time arguing about it.</p><h2>90-day claims period</h2><p>Please contact us within <strong>90 days of delivery</strong> if you believe there is a genuine problem with your products.</p><p>Email us at:</p><p><strong><a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></strong></p><p>or call:</p><p><strong>(302) 313-0900</strong></p><p>Please include your order number and, where possible, photographs showing the issue.</p><h2>What happens next?</h2><p>Once we receive your claim, we'll review the issue and may ask for additional information or for samples to be returned.</p><p>Depending on the circumstances, we may:</p><ul><li>Replace the affected products</li><li>Reproduce the affected products</li><li>Provide a partial refund</li><li>Provide a full refund for the affected products</li><li>Offer another reasonable solution</li></ul><p>We'll look at each situation individually.</p><h2>Artwork approval</h2><p>Please check your artwork carefully before approving production.</p><p>If an error was visible on the proof and you approved it, we generally cannot accept responsibility for that error.</p><p>This includes spelling, names, colors, logos, positioning, text and images.</p><p>If we make an error after receiving or approving correct artwork, we'll investigate and work with you to put it right.</p><h2>Small production differences</h2><p>Commercial production can involve small differences in color, print position, embroidery, dimensions and finish.</p><p>These small differences are not necessarily defects if they fall within normal manufacturing tolerances.</p><h2>Products that have not been customized</h2><p>If you purchase a product that has not been customized, its return eligibility will depend on the terms shown on your quote or order.</p><p>If a return is permitted, we'll provide instructions before you send anything back.</p><h2>Don't send products back without contacting us</h2><p>Please contact us before returning anything.</p><p>We'll tell you what we need and where to send it.</p><h2>Refunds</h2><p>If a refund is agreed, we'll normally return the money to the original payment method.</p><p>The time it takes to appear in your account can depend on your bank or payment provider.</p><p>If we cannot ship an order within the timeframe promised and a refund is required under applicable law, we'll process it in accordance with those requirements.</p><h2>Our approach</h2><p>We're a small business and we value our customers.</p><p>If we've made a genuine mistake, we want to know about it and we want to put it right.</p><p>Our aim is to resolve problems quickly and fairly.</p><p><strong>Easily Branded LLC</strong><br>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County, Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p>",
    },
  },

  shipping: {
    title: 'Shipping & Delivery Policy',
    metaTitle: 'Shipping & Delivery Policy — Easily Branded',
    metaDescription:
      'How production, shipping and delivery work for Easily Branded orders, including delivery estimates, tracking and delays.',
    keywords: 'shipping, delivery, shipping policy',
    content: {
      body: "<p><em>Last updated: September 9, 2026</em></p><p>We know that timing matters when you're ordering promotional products.</p><p>If you're ordering merchandise for a trade show, conference, event or campaign, receiving it on time is just as important as getting the product right.</p><p>Here's how our shipping process works.</p><h2>Production comes first</h2><p>When you order a customized product, it normally needs to be produced or decorated before it can be shipped.</p><p>Your total timeframe can therefore include:</p><p><strong>Artwork approval + production time + shipping time</strong></p><p>We'll provide an estimated timeframe when we quote your order.</p><h2>Production times</h2><p>Production times vary depending on:</p><ul><li>Product</li><li>Quantity</li><li>Decoration method</li><li>Artwork</li><li>Supplier availability</li><li>Production capacity</li></ul><p>Some products can be produced quickly, while others require more time.</p><p>If you have a firm deadline, tell us when you request your quote. We'll work backwards from your deadline and recommend suitable products where possible.</p><h2>Delivery estimates</h2><p>We'll give you an estimated delivery date or timeframe based on the information available to us.</p><p>Unless we specifically agree to a guaranteed delivery date in writing, delivery estimates are not guaranteed.</p><p>We will make reasonable efforts to meet the timeframe we provide.</p><h2>What can cause delays?</h2><p>Occasionally, things happen that are outside our control.</p><p>This can include:</p><ul><li>Supplier delays</li><li>Product shortages</li><li>Artwork approval taking longer than expected</li><li>Manufacturing delays</li><li>Carrier delays</li><li>Severe weather</li><li>Natural disasters</li><li>Holidays</li><li>Transportation problems</li><li>Government or customs delays</li><li>Other circumstances outside our reasonable control</li></ul><p>If we become aware of a significant delay, we'll let you know.</p><h2>Shipping carriers</h2><p>Depending on the order, we may use carriers such as:</p><ul><li>UPS</li><li>FedEx</li><li>USPS</li><li>DHL</li><li>Other commercial carriers</li></ul><p>The carrier used will depend on the order, destination and shipping service selected.</p><h2>Tracking</h2><p>Where tracking is available, we'll provide tracking information once the order has shipped.</p><p>Some orders may be delivered in multiple shipments, particularly where products come from different suppliers.</p><h2>Incorrect delivery addresses</h2><p>Please check your shipping address carefully before placing your order.</p><p>If an order has to be reshipped because an incorrect address was provided, additional shipping charges may apply.</p><h2>Damaged packages</h2><p>If your package arrives visibly damaged, please take photographs of the packaging and products and contact us as soon as possible.</p><p>We'll help investigate the issue.</p><h2>Missing packages</h2><p>If tracking shows that your package has been delivered but you cannot find it, please contact the carrier first where appropriate and then let us know.</p><p>We'll help where we can.</p><h2>International shipping</h2><p>We may offer international shipping on selected orders.</p><p>If we ship internationally, the customer may be responsible for customs duties, import taxes, brokerage charges and other local fees.</p><p>These charges are outside our control.</p><h2>Delayed orders</h2><p>We take delivery dates seriously.</p><p>If we cannot ship your order within the timeframe we promised, we'll contact you and explain the situation and your available options.</p><p>For internet orders, U.S. federal law may require a seller to offer a customer the option to accept a delay or receive a refund when merchandise cannot be shipped as promised.</p><p><strong>Easily Branded LLC</strong></p><p><strong>Phone:</strong> (302) 313-0900<br><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p>",
    },
  },

  'cookie-policy': {
    title: 'Cookie Policy',
    metaTitle: 'Cookie Policy — Easily Branded',
    metaDescription:
      'How easilybranded.com uses cookies and similar technologies, and how you can manage them.',
    keywords: 'cookies, cookie policy',
    content: {
      body: "<p><em>Last updated: September 9, 2026</em></p><p>easilybranded.com uses cookies and similar technologies to make our website work properly and to understand how visitors use it.</p><h2>What are cookies?</h2><p>Cookies are small files that websites place on your device.</p><p>They allow a website to remember certain information and recognize your device when you return.</p><h2>Why do we use cookies?</h2><p>We may use cookies for several reasons.</p><h3>Essential cookies</h3><p>These help the website function properly.</p><p>They can be used for things such as:</p><ul><li>Security</li><li>Shopping functionality</li><li>Checkout</li><li>Account features</li><li>Website operation</li></ul><h3>Functional cookies</h3><p>These help remember preferences and settings so the website can work more conveniently.</p><h3>Analytics cookies</h3><p>These help us understand how visitors use our website.</p><p>For example, we may use them to understand which pages are popular and where visitors may be experiencing problems.</p><h3>Marketing cookies</h3><p>Where used, marketing cookies can help us understand advertising performance and provide more relevant advertising.</p><h2>Third-party cookies</h2><p>Some services we use may place their own cookies on your device.</p><p>These could include analytics, advertising, payment, social media or other technology providers.</p><p>Those companies may have their own privacy and cookie policies.</p><h2>Managing cookies</h2><p>You can control or delete cookies through your browser settings.</p><p>Some websites may also provide their own cookie controls.</p><p>Please be aware that turning off certain cookies can affect how easilybranded.com works.</p><h2>Changes to this policy</h2><p>We may update this Cookie Policy from time to time.</p><p>The latest version will be published on our website.</p><h2>Contact us</h2><p>If you have questions about cookies, contact:</p><p><strong><a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></strong></p><p><strong>Easily Branded LLC</strong><br>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County<br>Delaware, USA</p><p><strong>Phone:</strong> (302) 313-0900</p>",
    },
  },

  accessibility: {
    title: 'Accessibility Statement',
    metaTitle: 'Accessibility Statement — Easily Branded',
    metaDescription:
      'How Easily Branded works to make easilybranded.com accessible, and how to report an accessibility problem.',
    keywords: 'accessibility, accessibility statement, WCAG',
    content: {
      body: "<p><em>Last updated: September 9, 2026</em></p><h2>We want everyone to be able to use our website.</h2><p>Easily Branded is committed to making easilybranded.com as accessible and easy to use as reasonably possible.</p><p>We know that people use websites in different ways and with different technologies, and we're working to make sure our website provides a good experience for as many people as possible.</p><h2>Our approach</h2><p>We aim to improve accessibility across our website by focusing on areas such as:</p><ul><li>Clear navigation</li><li>Easy-to-read content</li><li>Proper headings</li><li>Alternative text for meaningful images</li><li>Keyboard accessibility</li><li>Clear forms and labels</li><li>Good color contrast</li><li>Accessible digital content</li></ul><p>We use recognized accessibility principles, including the Web Content Accessibility Guidelines (WCAG), to help guide our approach.</p><h2>Third-party services</h2><p>Some features on our website may be provided by third-party companies.</p><p>We cannot always control the accessibility of third-party content or services, but we aim to work with providers that support an accessible experience where reasonably possible.</p><h2>Having trouble using our website?</h2><p>If you experience an accessibility problem on easilybranded.com, please tell us.</p><p>We genuinely want to know where we can improve.</p><p>You can contact us at:</p><p><strong>Email:</strong> <a href=\"mailto:info@easilybranded.com\">info@easilybranded.com</a></p><p><strong>Phone:</strong> (302) 313-0900</p><p><strong>Address:</strong></p><p>Easily Branded LLC<br>16192 Coastal Highway<br>Lewes, DE 19958<br>Sussex County<br>Delaware, USA</p><p>When contacting us, it helps if you tell us:</p><ul><li>Which page you were using</li><li>What problem you experienced</li><li>What you were trying to do</li><li>How you'd prefer us to respond</li></ul><p>We'll review the issue and do what we reasonably can to help.</p><h2>We're always improving</h2><p>Accessibility is not something you do once and forget about.</p><p>As Easily Branded grows, we'll continue to review our website and look for ways to make it easier for everyone to use.</p><p>Thank you for helping us improve.</p>",
    },
  },
};
