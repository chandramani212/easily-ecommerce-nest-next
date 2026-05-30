# Graph Report - web  (2026-05-30)

## Corpus Check
- 46 files · ~16,731 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 203 nodes · 331 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ff10dd9`
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
3. `Footer()` - 10 edges
4. `adaptProductForCard()` - 9 edges
5. `Breadcrumb()` - 8 edges
6. `apiFetchSafe()` - 7 edges
7. `adaptProductForDetail()` - 7 edges
8. `ApiCategory` - 5 edges
9. `CategoryBar()` - 5 edges
10. `pickColor()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Page()` --calls--> `apiFetchSafe()`  [EXTRACTED]
  app/page.tsx → lib/api.ts
- `ReviewStep()` --calls--> `useCart()`  [EXTRACTED]
  app/checkout/checkout-flow.tsx → context/cart-context.tsx
- `ProductDetail()` --calls--> `useCart()`  [EXTRACTED]
  app/product/[id]/product-detail.tsx → context/cart-context.tsx
- `ProductPage()` --calls--> `adaptProductForDetail()`  [EXTRACTED]
  app/product/[id]/page.tsx → lib/adapt.ts
- `Header()` --calls--> `useCart()`  [EXTRACTED]
  components/header.tsx → context/cart-context.tsx

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (20): geist, metadata, CartContents(), metadata, CheckoutFlow(), INITIAL_PAYMENT, INITIAL_SHIPPING, PaymentData (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (20): BestSellersTabs(), Product, Tab, FilterOption, Filters, FilterSidebar(), FilterSidebarProps, buildPageRange() (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (23): CategoryBarClient(), CategoryBarClientProps, MobileCategoryRowProps, AdaptedCategory, adaptProductForCard(), adaptProductForDetail(), CardProduct, CATEGORY_ICON_PATHS (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): categoryIcon(), Page(), TESTIMONIALS, CategoryCard(), CategoryCardProps, HeroBanner(), Slide, SLIDES (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (14): metadata, MILESTONES, TEAM, VALUES, Breadcrumb(), BreadcrumbItem, BreadcrumbProps, INQUIRY_TYPES (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (14): CategoryBar(), PageProps, ProductPage(), resolveProduct(), buildCategoryTree(), apiFetchSafe(), ApiCategory, ApiProduct (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (11): COMPANY, Footer(), QUICK_LINKS, SUPPORT, ContactForm(), SUBJECTS, CONTACT_INFO, FAQ (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (11): ProductGallery(), ProductGalleryProps, ProductImage, ProductTabs(), ProductTabsProps, TabContent, ACTION_BUTTONS, Product (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (4): code:bash (pnpm dev), Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **81 isolated node(s):** `nextConfig`, `CartItem`, `CartContextType`, `CartContext`, `ApiProductCategoryRef` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Header()` connect `Community 0` to `Community 3`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `Footer()` connect `Community 6` to `Community 0`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `useCart()` connect `Community 0` to `Community 7`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `nextConfig`, `CartItem`, `CartContextType` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._