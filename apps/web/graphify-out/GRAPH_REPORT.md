# Graph Report - web  (2026-06-13)

## Corpus Check
- 48 files · ~18,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 231 nodes · 387 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e384eeb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `Header()` - 11 edges
2. `useCart()` - 10 edges
3. `adaptProductForCard()` - 10 edges
4. `Footer()` - 10 edges
5. `apiFetchSafe()` - 9 edges
6. `getPage()` - 9 edges
7. `pageMetadata()` - 8 edges
8. `Breadcrumb()` - 8 edges
9. `adaptProductForDetail()` - 7 edges
10. `ApiCategory` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Header()` --calls--> `useCart()`  [EXTRACTED]
  components/header.tsx → context/cart-context.tsx
- `ReviewStep()` --calls--> `useCart()`  [EXTRACTED]
  app/checkout/checkout-flow.tsx → context/cart-context.tsx
- `resolveProduct()` --calls--> `apiFetchSafe()`  [EXTRACTED]
  app/product/[id]/page.tsx → lib/api.ts
- `ProductPage()` --calls--> `adaptProductForDetail()`  [EXTRACTED]
  app/product/[id]/page.tsx → lib/adapt.ts
- `CartContents()` --calls--> `useCart()`  [EXTRACTED]
  app/cart/cart-contents.tsx → context/cart-context.tsx

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (34): DEFAULT_MILESTONES, DEFAULT_STATS, DEFAULT_TEAM, DEFAULT_VALUES, generateMetadata(), metadata, MILESTONES, TEAM (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (23): metadata, metadata, Breadcrumb(), BreadcrumbItem, BreadcrumbProps, COMPANY, Footer(), QUICK_LINKS (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (27): geist, metadata, CartContents(), CheckoutFlow(), INITIAL_PAYMENT, INITIAL_SHIPPING, PaymentData, ReviewStep() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (26): CategoryBarClient(), CategoryBarClientProps, MobileCategoryRowProps, adaptCategory(), AdaptedCategory, adaptProductForCard(), adaptProductForDetail(), canonicalColor() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (19): BestSellersTabs(), Product, Tab, FilterOption, Filters, FilterSidebar(), FilterSidebarProps, buildPageRange() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (16): CategoryBar(), absoluteImage(), generateMetadata(), PageProps, ProductPage(), resolveProduct(), buildCategoryTree(), ApiCategory (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (5): TestimonialCard(), TestimonialCardProps, Testimonial, TestimonialCarousel(), TestimonialCarouselProps

### Community 7 - "Community 7"
Cohesion: 0.32
Nodes (6): INQUIRY_TYPES, InquiryForm(), InquiryFormProps, Attribution, captureAttribution(), getAttribution()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (4): code:bash (pnpm dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **92 isolated node(s):** `nextConfig`, `CartItem`, `CartContextType`, `CartContext`, `ApiProductCategoryRef` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Header()` connect `Community 1` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `Footer()` connect `Community 1` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `useCart()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `nextConfig`, `CartItem`, `CartContextType` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._