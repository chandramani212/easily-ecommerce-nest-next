# Graph Report - ecommerce  (2026-06-13)

## Corpus Check
- 292 files · ~86,359 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1601 nodes · 3348 edges · 104 communities (74 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e384eeb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Supplier Import Pipeline|Supplier Import Pipeline]]
- [[_COMMUNITY_Auth & User Management|Auth & User Management]]
- [[_COMMUNITY_Admin Page Components|Admin Page Components]]
- [[_COMMUNITY_API Middleware & Settings|API Middleware & Settings]]
- [[_COMMUNITY_Admin Product UI|Admin Product UI]]
- [[_COMMUNITY_Product API Module|Product API Module]]
- [[_COMMUNITY_Admin Shell & Layout|Admin Shell & Layout]]
- [[_COMMUNITY_Supplier Admin UI|Supplier Admin UI]]
- [[_COMMUNITY_Inquiries & Mail|Inquiries & Mail]]
- [[_COMMUNITY_Auth Adapters|Auth Adapters]]
- [[_COMMUNITY_Import Run History UI|Import Run History UI]]
- [[_COMMUNITY_Web Store Catalog UI|Web Store Catalog UI]]
- [[_COMMUNITY_Demo API Layer|Demo API Layer]]
- [[_COMMUNITY_Web Home & Navigation|Web Home & Navigation]]
- [[_COMMUNITY_Orders API Module|Orders API Module]]
- [[_COMMUNITY_Contact Messages API|Contact Messages API]]
- [[_COMMUNITY_Mock Data Generation|Mock Data Generation]]
- [[_COMMUNITY_Customers API Module|Customers API Module]]
- [[_COMMUNITY_Middleware & Routes|Middleware & Routes]]
- [[_COMMUNITY_Import Wizard UI|Import Wizard UI]]
- [[_COMMUNITY_Supplier API Module|Supplier API Module]]
- [[_COMMUNITY_Import Service Internals|Import Service Internals]]
- [[_COMMUNITY_Admin Category Management|Admin Category Management]]
- [[_COMMUNITY_Links CRUD Module|Links CRUD Module]]
- [[_COMMUNITY_Project Architecture Docs|Project Architecture Docs]]
- [[_COMMUNITY_API Core Module|API Core Module]]
- [[_COMMUNITY_Admin Contacts & Users|Admin Contacts & Users]]
- [[_COMMUNITY_Web Inquiry Form|Web Inquiry Form]]
- [[_COMMUNITY_Web Checkout Flow|Web Checkout Flow]]
- [[_COMMUNITY_Web Category Pages|Web Category Pages]]
- [[_COMMUNITY_Web Product Detail|Web Product Detail]]
- [[_COMMUNITY_Supplier Imports Controller|Supplier Imports Controller]]
- [[_COMMUNITY_Web Footer & Thank You|Web Footer & Thank You]]
- [[_COMMUNITY_Categories API Module|Categories API Module]]
- [[_COMMUNITY_Web App Layout|Web App Layout]]
- [[_COMMUNITY_Web Cart & Header|Web Cart & Header]]
- [[_COMMUNITY_Admin Stats Module|Admin Stats Module]]
- [[_COMMUNITY_API App Controller|API App Controller]]
- [[_COMMUNITY_Suppliers Controller|Suppliers Controller]]
- [[_COMMUNITY_Import Runner Service|Import Runner Service]]
- [[_COMMUNITY_Web About Page|Web About Page]]
- [[_COMMUNITY_Sync Scheduler Service|Sync Scheduler Service]]
- [[_COMMUNITY_Suppliers Service|Suppliers Service]]
- [[_COMMUNITY_Prisma & Scheduler Module|Prisma & Scheduler Module]]
- [[_COMMUNITY_ESLint & Build Configs|ESLint & Build Configs]]
- [[_COMMUNITY_Web Contact Form|Web Contact Form]]
- [[_COMMUNITY_Shared UI Button|Shared UI Button]]
- [[_COMMUNITY_Categories Controller|Categories Controller]]
- [[_COMMUNITY_Links Controller|Links Controller]]
- [[_COMMUNITY_Build Demo Script|Build Demo Script]]
- [[_COMMUNITY_Encryption Utility|Encryption Utility]]
- [[_COMMUNITY_Animated Circles SVG|Animated Circles SVG]]
- [[_COMMUNITY_Shared UI Avatar|Shared UI Avatar]]
- [[_COMMUNITY_Shared UI Badge|Shared UI Badge]]
- [[_COMMUNITY_Jest Config|Jest Config]]
- [[_COMMUNITY_Import Wizard Page|Import Wizard Page]]
- [[_COMMUNITY_Admin Login|Admin Login]]
- [[_COMMUNITY_Link DTOs|Link DTOs]]
- [[_COMMUNITY_Shared UI Tabs|Shared UI Tabs]]
- [[_COMMUNITY_Product Performance Widget|Product Performance Widget]]
- [[_COMMUNITY_Category Filter Component|Category Filter Component]]
- [[_COMMUNITY_Easily Branded Brand Assets|Easily Branded Brand Assets]]
- [[_COMMUNITY_Shared UI Card|Shared UI Card]]
- [[_COMMUNITY_Shared UI Input|Shared UI Input]]
- [[_COMMUNITY_Quantity Selector|Quantity Selector]]
- [[_COMMUNITY_Database Seed Script|Database Seed Script]]
- [[_COMMUNITY_Admin Metric Card|Admin Metric Card]]
- [[_COMMUNITY_Turborepo Brand Assets|Turborepo Brand Assets]]
- [[_COMMUNITY_Link Entity Prisma|Link Entity Prisma]]
- [[_COMMUNITY_PostCSS Config Web|PostCSS Config Web]]
- [[_COMMUNITY_Next.js Config Web|Next.js Config Web]]
- [[_COMMUNITY_Easily Branded Web Logo|Easily Branded Web Logo]]
- [[_COMMUNITY_Vercel Brand Assets|Vercel Brand Assets]]
- [[_COMMUNITY_Next.js Brand Assets|Next.js Brand Assets]]
- [[_COMMUNITY_ESLint Config Backend|ESLint Config Backend]]
- [[_COMMUNITY_Backend Entry Point|Backend Entry Point]]
- [[_COMMUNITY_ESLint Config UI|ESLint Config UI]]
- [[_COMMUNITY_UI Entry Point|UI Entry Point]]
- [[_COMMUNITY_PostCSS Config Admin|PostCSS Config Admin]]
- [[_COMMUNITY_ESLint Config Web|ESLint Config Web]]
- [[_COMMUNITY_Next Env Types Web|Next Env Types Web]]
- [[_COMMUNITY_Jest Config Admin|Jest Config Admin]]
- [[_COMMUNITY_ESLint Config API|ESLint Config API]]
- [[_COMMUNITY_PostCSS Config Web2|PostCSS Config Web2]]
- [[_COMMUNITY_ESLint Config Admin|ESLint Config Admin]]
- [[_COMMUNITY_Next Env Types Admin|Next Env Types Admin]]
- [[_COMMUNITY_Next.js Config Admin|Next.js Config Admin]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 33 edges
2. `PageHeader()` - 31 edges
3. `PrismaService` - 29 edges
4. `clientApi()` - 24 edges
5. `resolveSearchParams()` - 24 edges
6. `ImportRunnerService` - 19 edges
7. `formatDateTime()` - 17 edges
8. `SourceImportsService` - 16 edges
9. `SyncSchedulerService` - 16 edges
10. `DemoReadOnlyError` - 16 edges

## Surprising Connections (you probably didn't know these)
- `buildCategoryTree()` --calls--> `Build`  [INFERRED]
  apps/web/lib/adapt.ts → README.md
- `Tier Price Types Fixed Price and Percentage Discount` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `apps/admin Directory Admin App` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `Supplier Product Import Feature` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `demoHandle()` --calls--> `demoRoute()`  [INFERRED]
  apps/admin/lib/client-api.ts → apps/admin/lib/demo-api.ts

## Hyperedges (group relationships)
- **Monorepo Workspace Structure** — pnpm_workspace_yaml, readme_monorepo_turborepo, readme_monorepo_pnpm, apps_api_dir, apps_web_dir, apps_admin_dir [INFERRED 0.85]
- **Supplier Import Feature Scope** — plan_supplier_import, plan_tier_pricing, plan_phase2_out_of_scope, apps_admin_dir, apps_api_dir [INFERRED 0.75]

## Communities (104 total, 30 thin omitted)

### Community 0 - "Supplier Import Pipeline"
Cohesion: 0.07
Nodes (50): AsiCentralFetcher, AsiCentralFetcherConfig, AsiProductSummary, AsiSearchResponse, DETAIL_PATH(), extractSummaries(), pickId(), safeText() (+42 more)

### Community 1 - "Auth & User Management"
Cohesion: 0.05
Nodes (16): CsvColumn, toCsv(), ContactMessagesController, ContactMessagesModule, ContactListQuery, ContactMessagesService, escapeHtml(), CustomersController (+8 more)

### Community 2 - "Admin Page Components"
Cohesion: 0.05
Nodes (21): AuthController, AuthModule, AuthService, CurrentUser, JwtUser, LoginDto, MediaListQuery, UpdateMediaDto (+13 more)

### Community 3 - "API Middleware & Settings"
Cohesion: 0.1
Nodes (31): Column, DataTable(), DateRangeFilter(), DateRangeFilterProps, ExportButton(), Pager(), PagerProps, SearchInput() (+23 more)

### Community 4 - "Admin Product UI"
Cohesion: 0.06
Nodes (40): DEMO_CATEGORY_IDS, DEMO_SOURCE_IDS, DEMO_SOURCE_IMPORT_IDS, DEMO_SUPPLIER_IDS, DEMO_SUPPLIER_IMPORT_IDS, buildOrder(), computeSummary(), customerWithOrders() (+32 more)

### Community 5 - "Product API Module"
Cohesion: 0.13
Nodes (18): ApiKeyAdapter, AsiMemberAuthAdapter, AnyCredentials, ApiKeyCredentials, AsiMemberAuthCredentials, AuthAdapter, BasicCredentials, BearerCredentials (+10 more)

### Community 6 - "Admin Shell & Layout"
Cohesion: 0.07
Nodes (22): CreateInquiryDto, UpdateInquiryStatusDto, InquiriesController, InquiriesModule, escapeHtml(), InquiriesService, InquiryListQuery, AttributionInput (+14 more)

### Community 7 - "Supplier Admin UI"
Cohesion: 0.09
Nodes (22): ExportButtonProps, PageHeader(), DemoMockExports, EditProductPage(), generateStaticParams(), DemoMockExports, EditImportPage(), generateStaticParams() (+14 more)

### Community 8 - "Inquiries & Mail"
Cohesion: 0.12
Nodes (13): CsvParser, JsonParser, ParseResult, parserFor(), RecordParser, xml, XmlParser, getPath() (+5 more)

### Community 9 - "Auth Adapters"
Cohesion: 0.09
Nodes (13): CreateProductDto, ProductAttributeDto, TierPriceDto, UpdateProductDto, ProductsController, ProductsModule, ProductListQuery, ProductsService (+5 more)

### Community 10 - "Import Run History UI"
Cohesion: 0.09
Nodes (24): CATEGORIES, Category, CategoryBar(), CategoryBarClient(), CategoryBarClientProps, MobileCategoryRowProps, SubCategory, absoluteImage() (+16 more)

### Community 11 - "Web Store Catalog UI"
Cohesion: 0.12
Nodes (10): HttpExceptionFilter, JwtAuthGuard, MailModule, MediaModule, PagesModule, PrismaModule, SourcesModule, AppController (+2 more)

### Community 12 - "Demo API Layer"
Cohesion: 0.12
Nodes (26): AttributeMapItem, CategoriesMap, Field(), FIELD_TRANSFORMS, FieldRow(), FieldTransform, ImagesMap, ImportWizard() (+18 more)

### Community 13 - "Web Home & Navigation"
Cohesion: 0.1
Nodes (19): StatusBadge(), STYLES, OrderStatusEditor(), STATUSES, CustomerDetailPage(), generateStaticParams(), InquiryRow(), STATUSES (+11 more)

### Community 14 - "Orders API Module"
Cohesion: 0.11
Nodes (15): metadata, CheckoutFlow(), metadata, Breadcrumb(), BreadcrumbItem, BreadcrumbProps, COMPANY, Footer() (+7 more)

### Community 15 - "Contact Messages API"
Cohesion: 0.08
Nodes (20): BestSellersTabs(), Product, Tab, FilterOption, Filters, FilterSidebar(), FilterSidebarProps, buildPageRange() (+12 more)

### Community 16 - "Mock Data Generation"
Cohesion: 0.1
Nodes (17): ContactRow(), STATUSES, AboutContent, ContactContent, ContactStatus, HomeContent, LeadSource, OrderItem (+9 more)

### Community 17 - "Customers API Module"
Cohesion: 0.11
Nodes (17): OrderDetailPage(), ORIGIN_LABEL, STATUS_BADGE, SupplierActivity(), SupplierDetailTabs(), Tab, STATUS_BADGE, SupplierImportsTab() (+9 more)

### Community 18 - "Middleware & Routes"
Cohesion: 0.11
Nodes (9): Public(), LinksController, LinksModule, LinksService, dto, link, links, removed (+1 more)

### Community 19 - "Import Wizard UI"
Cohesion: 0.12
Nodes (9): Roles(), CreateUserDto, UpdateUserDto, RolesGuard, PagesController, SetSourceCategoryMappingDto, SourceCategoriesController, SourceCategoryListQueryDto (+1 more)

### Community 20 - "Supplier API Module"
Cohesion: 0.1
Nodes (18): AdminShell(), AdminShellProps, MeResponse, MENU, MenuItem, PAGES, Sidebar(), SidebarProps (+10 more)

### Community 21 - "Import Service Internals"
Cohesion: 0.1
Nodes (18): CATEGORIES, categoryIcon(), PRODUCT_TABS, TESTIMONIALS, CategoryCard(), CategoryCardProps, HeroBanner(), Slide (+10 more)

### Community 22 - "Admin Category Management"
Cohesion: 0.1
Nodes (17): geist, metadata, RootLayout(), CartContents(), INITIAL_PAYMENT, INITIAL_SHIPPING, PaymentData, ReviewStep() (+9 more)

### Community 23 - "Links CRUD Module"
Cohesion: 0.13
Nodes (24): Build, code:bash (pnpm build), AdaptedCategory, adaptProductForCard(), adaptProductForDetail(), buildCategoryTree(), canonicalColor(), CardProduct (+16 more)

### Community 24 - "Project Architecture Docs"
Cohesion: 0.11
Nodes (17): DemoMockExports, SourceDetailPage(), TABS, SourceActivity(), STATUS_BADGE, SourceDetailTabs(), Tab, SourceImportsTab() (+9 more)

### Community 25 - "API Core Module"
Cohesion: 0.12
Nodes (20): generateMetadata(), generateMetadata(), Page(), ContactForm(), SUBJECTS, CONTACT_INFO, DEFAULT_FAQ, DEFAULT_INFO (+12 more)

### Community 26 - "Admin Contacts & Users"
Cohesion: 0.13
Nodes (7): CreateOrderDto, OrderItemDto, UpdateOrderStatusDto, OrdersController, OrdersModule, OrderListQuery, OrdersService

### Community 27 - "Web Inquiry Form"
Cohesion: 0.09
Nodes (22): code:block1 (├── apps/), code:bash (pnpm install), code:bash (pnpm dev), code:bash (# API only), code:bash (pnpm lint), code:bash (pnpm test), code:bash (pnpm format), Customization (+14 more)

### Community 28 - "Web Checkout Flow"
Cohesion: 0.12
Nodes (7): SecretsCipher, SetSupplierCategoryMappingDto, SupplierCategoriesController, SupplierCategoryListQueryDto, SupplierCategoriesService, SupplierCategoryListQuery, SuppliersModule

### Community 29 - "Web Category Pages"
Cohesion: 0.13
Nodes (9): UpdatePageDto, MailOptions, PAGE_DEFAULTS, PAGE_SLUGS, PageSeed, PageSlug, PrismaService, SourceCategoriesService (+1 more)

### Community 30 - "Web Product Detail"
Cohesion: 0.24
Nodes (14): CreateImportDto, CreateSupplierDto, CronPreviewDto, DryRunOptionsDto, RunNowOptionsDto, RunsListQuery, SampleFromUrlDto, SupplierAuthCredentialsDto (+6 more)

### Community 31 - "Supplier Imports Controller"
Cohesion: 0.15
Nodes (5): CategoriesController, CategoriesModule, CategoriesService, CreateCategoryDto, UpdateCategoryDto

### Community 32 - "Web Footer & Thank You"
Cohesion: 0.13
Nodes (12): config, middleware(), PUBLIC_PATHS, AdminSessionPayload, verifyToken(), Ctx, DELETE(), forward() (+4 more)

### Community 33 - "Categories API Module"
Cohesion: 0.24
Nodes (14): AboutEditor(), ImageField(), SeoFields(), SeoValue, ContactEditor(), EditorSection(), ListEditor(), moveItem() (+6 more)

### Community 34 - "Web App Layout"
Cohesion: 0.25
Nodes (13): CreateImportDto, CreateSourceDto, CronPreviewDto, DryRunOptionsDto, RunNowOptionsDto, RunsListQuery, SampleFromUrlDto, SourceAuthCredentialsDto (+5 more)

### Community 35 - "Web Cart & Header"
Cohesion: 0.19
Nodes (5): TestEmailDto, UpdateSettingsDto, SettingsController, SettingsModule, SettingsService

### Community 36 - "Admin Stats Module"
Cohesion: 0.13
Nodes (10): MediaPicker(), Props, ProductPicker(), Props, ProductAttribute, RelatedProductSummary, TierPriceType, AttrRow (+2 more)

### Community 37 - "API App Controller"
Cohesion: 0.14
Nodes (3): UsersController, UsersModule, UsersService

### Community 38 - "Suppliers Controller"
Cohesion: 0.19
Nodes (11): Filter, SupplierCategoriesTab(), SupplierCategoryRow, clientApi(), demoHandle(), DemoReadOnlyError, isMutation(), formatBytes() (+3 more)

### Community 39 - "Import Runner Service"
Cohesion: 0.2
Nodes (15): apps/admin Directory Admin App, apps/api Directory NestJS Backend, apps/web Directory Next.js Frontend, Ecommerce Monorepo Plan, Phase 2 Out-of-Scope Features, Supplier Product Import Feature, Tier Price Types Fixed Price and Percentage Discount, NestJS Next.js Monorepo Starter README (+7 more)

### Community 40 - "Web About Page"
Cohesion: 0.14
Nodes (9): SourceAuthType, SourceKind, AUTH_TYPES, AuthState, EMPTY_AUTH, FormState, ManualSupplier, SourceForm() (+1 more)

### Community 41 - "Sync Scheduler Service"
Cohesion: 0.15
Nodes (11): DEFAULT_MILESTONES, DEFAULT_STATS, DEFAULT_TEAM, DEFAULT_VALUES, metadata, MILESTONES, TEAM, VALUE_ICONS (+3 more)

### Community 43 - "Prisma & Scheduler Module"
Cohesion: 0.21
Nodes (9): CategoriesManager(), buildCategoryTree(), categoryLabel(), CategorySelect(), nameCollisions(), parentNameFor(), Filter, SourceCategoriesTab() (+1 more)

### Community 44 - "ESLint & Build Configs"
Cohesion: 0.18
Nodes (10): ProductGallery(), ProductGalleryProps, ProductImage, ProductTabs(), ProductTabsProps, TabContent, ACTION_BUTTONS, Product (+2 more)

### Community 48 - "Links Controller"
Cohesion: 0.17
Nodes (7): SupplierAuthType, SupplierKind, AUTH_TYPES, AuthState, EMPTY_AUTH, FormState, SupplierForm()

### Community 51 - "Animated Circles SVG"
Cohesion: 0.27
Nodes (8): SourceImport, SupplierImport, DemoMockExports, generateStaticParams(), RunHistoryPage(), RunsTable(), sanitize(), STATUS_BADGE

### Community 52 - "Shared UI Avatar"
Cohesion: 0.17
Nodes (11): 1. Suppliers List (`/suppliers`), 2. Products Tab (`/suppliers/[id]?tab=products`), 3. Import Runs Page (`/suppliers/[id]/imports/[importId]/runs`), API Response Shape, code:block1 (const page = Number(p(sp, "page") ?? "1");), Files Changed, Out of Scope, Overview (+3 more)

### Community 53 - "Shared UI Badge"
Cohesion: 0.24
Nodes (7): INQUIRY_TYPES, InquiryForm(), InquiryFormProps, InquiryFormPage(), Attribution, captureAttribution(), getAttribution()

### Community 57 - "Link DTOs"
Cohesion: 0.29
Nodes (3): StatsController, StatsModule, StatsService

### Community 58 - "Shared UI Tabs"
Cohesion: 0.24
Nodes (7): DashboardPage(), formatMoney(), SOURCE_LABELS, Summary, StatCard(), StatCardProps, LeadSourceReport

### Community 60 - "Category Filter Component"
Cohesion: 0.36
Nodes (4): config, nestJsConfig, nextJsConfig, config

### Community 62 - "Shared UI Card"
Cohesion: 0.29
Nodes (5): ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 63 - "Shared UI Input"
Cohesion: 0.29
Nodes (4): adminRoot, here, moves, stash

### Community 65 - "Database Seed Script"
Cohesion: 0.33
Nodes (5): code:bash (pnpm run dev), Getting Started, Important Note 🚧, Learn More, With-NestJs | API

### Community 66 - "Admin Metric Card"
Cohesion: 0.47
Nodes (6): SVG Pulsing Opacity Animation, Inner Circle (r=25) Stroke Animated, Outer Circle (r=45) Stroke Animated, Inner Circle Radial Gradient Fill Animated, Radial Gradient White to Transparent, Animated Concentric Circles SVG

### Community 67 - "Turborepo Brand Assets"
Cohesion: 0.4
Nodes (3): AvatarProps, AvatarSize, sizeClasses

### Community 68 - "Link Entity Prisma"
Cohesion: 0.4
Nodes (3): BadgeProps, BadgeVariant, variantClasses

### Community 71 - "Easily Branded Web Logo"
Cohesion: 0.5
Nodes (4): AdminError(), classify(), ErrorInfo, ErrorProps

### Community 72 - "Vercel Brand Assets"
Cohesion: 0.4
Nodes (4): code:bash (pnpm dev), Deploy on Vercel, Getting Started, Learn More

### Community 76 - "ESLint Config UI"
Cohesion: 0.67
Nodes (4): Easily Branded Admin Logo, Easily Branded, EB Monogram Icon, Teal and Dark Blue Color Scheme

### Community 82 - "ESLint Config API"
Cohesion: 0.67
Nodes (3): Monorepo Build Tooling, Turborepo Brand Identity, Turborepo SVG Logo

## Knowledge Gaps
- **286 isolated node(s):** `UpdateLinkDto`, `Link`, `TabItem`, `TabsProps`, `ButtonVariant` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetchSafe()` connect `Import Run History UI` to `Supplier Admin UI`, `Customers API Module`, `Supplier API Module`, `Import Service Internals`, `Project Architecture Docs`, `API Core Module`, `Shared UI Tabs`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Web Category Pages` to `Supplier Import Pipeline`, `Auth & User Management`, `Web App Layout`, `Admin Page Components`, `Web Cart & Header`, `Admin Shell & Layout`, `Auth Adapters`, `Web Store Catalog UI`, `Import Wizard UI`, `Link DTOs`, `Admin Contacts & Users`, `Web Checkout Flow`, `Web Product Detail`, `Supplier Imports Controller`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `Supplier Admin UI` to `API Middleware & Settings`, `Import Run History UI`, `Web Home & Navigation`, `Mock Data Generation`, `Customers API Module`, `Animated Circles SVG`, `Project Architecture Docs`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `UpdateLinkDto`, `Link`, `TabItem` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supplier Import Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Auth & User Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Admin Page Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._