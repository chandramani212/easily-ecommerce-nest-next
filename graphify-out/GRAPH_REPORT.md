# Graph Report - .  (2026-05-08)

## Corpus Check
- Large corpus: 255 files · ~64,861 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1117 nodes · 2079 edges · 87 communities (62 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.88)
- Token cost: 1,800 input · 1,350 output

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

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 24 edges
2. `PrismaService` - 21 edges
3. `PageHeader()` - 21 edges
4. `resolveSearchParams()` - 17 edges
5. `SupplierImportsService` - 16 edges
6. `clientApi()` - 16 edges
7. `SupplierImportsController` - 13 edges
8. `ImportRunnerService` - 13 edges
9. `SuppliersService` - 12 edges
10. `SyncSchedulerService` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Tier Price Types Fixed Price and Percentage Discount` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `apps/admin Directory Admin App` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `Supplier Product Import Feature` --conceptually_related_to--> `apps/api Directory NestJS Backend`  [INFERRED]
  plan.txt → README.md
- `demoHandle()` --calls--> `demoRoute()`  [INFERRED]
  apps/admin/lib/client-api.ts → apps/admin/lib/demo-api.ts
- `RunHistoryPage()` --calls--> `apiFetch()`  [EXTRACTED]
  apps/admin/app/(admin)/suppliers/[id]/imports/[importId]/runs/page.tsx → apps/admin/lib/api.ts

## Hyperedges (group relationships)
- **Monorepo Workspace Structure** — pnpm_workspace_yaml, readme_monorepo_turborepo, readme_monorepo_pnpm, apps_api_dir, apps_web_dir, apps_admin_dir [INFERRED 0.85]
- **Supplier Import Feature Scope** — plan_supplier_import, plan_tier_pricing, plan_phase2_out_of_scope, apps_admin_dir, apps_api_dir [INFERRED 0.75]

## Communities (87 total, 25 thin omitted)

### Community 0 - "Supplier Import Pipeline"
Cohesion: 0.06
Nodes (42): FetchedPayload, Fetcher, FileFetcher, resolveUrl(), RestFetcher, RestFetcherConfig, safeText(), CsvParser (+34 more)

### Community 1 - "Auth & User Management"
Cohesion: 0.06
Nodes (20): AuthController, AuthModule, AuthService, CurrentUser, JwtUser, LoginDto, MediaListQuery, UpdateMediaDto (+12 more)

### Community 2 - "Admin Page Components"
Cohesion: 0.1
Nodes (26): Column, DataTable(), DateRangeFilter(), DateRangeFilterProps, Pager(), PagerProps, SearchInput(), SearchInputProps (+18 more)

### Community 3 - "API Middleware & Settings"
Cohesion: 0.07
Nodes (13): Roles(), CreateUserDto, TestEmailDto, UpdateSettingsDto, UpdateUserDto, RolesGuard, SettingsController, SettingsModule (+5 more)

### Community 4 - "Admin Product UI"
Cohesion: 0.08
Nodes (28): MediaPicker(), Props, ProductPicker(), Props, OrderStatusEditor(), STATUSES, clientApi(), demoHandle() (+20 more)

### Community 5 - "Product API Module"
Cohesion: 0.09
Nodes (13): CreateProductDto, ProductAttributeDto, TierPriceDto, UpdateProductDto, ProductsController, ProductsModule, ProductListQuery, ProductsService (+5 more)

### Community 6 - "Admin Shell & Layout"
Cohesion: 0.08
Nodes (24): AdminShell(), AdminShellProps, MeResponse, DashboardPage(), formatMoney(), Summary, MENU, MenuItem (+16 more)

### Community 7 - "Supplier Admin UI"
Cohesion: 0.1
Nodes (23): CustomerDetailPage(), DemoMockExports, generateStaticParams(), OrderDetailPage(), SupplierDetailPage(), TABS, STATUS_BADGE, SupplierActivity() (+15 more)

### Community 8 - "Inquiries & Mail"
Cohesion: 0.09
Nodes (10): CreateInquiryDto, UpdateInquiryStatusDto, InquiriesController, InquiriesModule, escapeHtml(), InquiriesService, InquiryListQuery, MailModule (+2 more)

### Community 9 - "Auth Adapters"
Cohesion: 0.12
Nodes (15): ApiKeyAdapter, AnyCredentials, ApiKeyCredentials, AuthAdapter, BasicCredentials, BearerCredentials, OAuth2ClientCredentials, RequestPlan (+7 more)

### Community 10 - "Import Run History UI"
Cohesion: 0.08
Nodes (18): PageHeader(), DemoMockExports, generateStaticParams(), DemoMockExports, generateStaticParams(), SupplierAuthType, SupplierImport, SupplierKind (+10 more)

### Community 11 - "Web Store Catalog UI"
Cohesion: 0.09
Nodes (19): BestSellersTabs(), Product, Tab, FilterOption, Filters, FilterSidebar(), FilterSidebarProps, buildPageRange() (+11 more)

### Community 12 - "Demo API Layer"
Cohesion: 0.1
Nodes (23): DEMO_CATEGORY_IDS, DEMO_CUSTOMER_IDS, DEMO_ORDER_IDS, DEMO_PRODUCT_IDS, DEMO_SUPPLIER_IDS, DEMO_SUPPLIER_IMPORT_IDS, demoRoute(), demoRouteSafe() (+15 more)

### Community 13 - "Web Home & Navigation"
Cohesion: 0.11
Nodes (15): CATEGORIES, PRODUCT_TABS, TESTIMONIALS, CategoryCard(), CategoryCardProps, HeroBanner(), Slide, SLIDES (+7 more)

### Community 14 - "Orders API Module"
Cohesion: 0.13
Nodes (7): CreateOrderDto, OrderItemDto, UpdateOrderStatusDto, OrdersController, OrdersModule, OrderListQuery, OrdersService

### Community 15 - "Contact Messages API"
Cohesion: 0.14
Nodes (7): ContactMessagesController, ContactMessagesModule, ContactListQuery, ContactMessagesService, escapeHtml(), CreateContactMessageDto, UpdateContactMessageStatusDto

### Community 16 - "Mock Data Generation"
Cohesion: 0.1
Nodes (17): buildOrder(), daysAgo(), mockInquiries, mockOrders, mockSupplierImports, mockSupplierProductLinks, mockSupplierRuns, now (+9 more)

### Community 17 - "Customers API Module"
Cohesion: 0.14
Nodes (6): CustomersController, CustomersModule, CustomerListQuery, CustomersService, CreateCustomerDto, UpdateCustomerDto

### Community 18 - "Middleware & Routes"
Cohesion: 0.13
Nodes (12): config, middleware(), PUBLIC_PATHS, AdminSessionPayload, verifyToken(), Ctx, DELETE(), forward() (+4 more)

### Community 19 - "Import Wizard UI"
Cohesion: 0.1
Nodes (12): AttributeMapItem, CategoriesMap, FIELD_TRANSFORMS, FieldTransform, ImagesMap, MappingSpec, MarkupSpec, PRODUCT_FIELDS (+4 more)

### Community 20 - "Supplier API Module"
Cohesion: 0.25
Nodes (13): CreateImportDto, CreateSupplierDto, CronPreviewDto, DryRunOptionsDto, RunNowOptionsDto, RunsListQuery, SampleFromUrlDto, SupplierAuthCredentialsDto (+5 more)

### Community 21 - "Import Service Internals"
Cohesion: 0.18
Nodes (4): buildAuthAdapter(), parserFor(), listPaths(), SupplierImportsService

### Community 22 - "Admin Category Management"
Cohesion: 0.21
Nodes (7): CategoriesManager(), EditProductPage(), apiFetch(), realFetch(), Category, ProductsPage(), ProductForm()

### Community 23 - "Links CRUD Module"
Cohesion: 0.18
Nodes (6): LinksService, dto, link, links, removed, updated

### Community 24 - "Project Architecture Docs"
Cohesion: 0.2
Nodes (15): apps/admin Directory Admin App, apps/api Directory NestJS Backend, apps/web Directory Next.js Frontend, Ecommerce Monorepo Plan, Phase 2 Out-of-Scope Features, Supplier Product Import Feature, Tier Price Types Fixed Price and Percentage Discount, NestJS Next.js Monorepo Starter README (+7 more)

### Community 25 - "API Core Module"
Cohesion: 0.18
Nodes (5): CategoriesModule, HttpExceptionFilter, JwtAuthGuard, LinksModule, AppModule

### Community 26 - "Admin Contacts & Users"
Cohesion: 0.17
Nodes (10): StatusBadge(), STYLES, ContactRow(), STATUSES, AdminUser, ContactStatus, UserRole, ROLES (+2 more)

### Community 27 - "Web Inquiry Form"
Cohesion: 0.18
Nodes (8): Breadcrumb(), BreadcrumbItem, BreadcrumbProps, INQUIRY_TYPES, InquiryForm(), InquiryFormProps, InquiryFormPage(), metadata

### Community 28 - "Web Checkout Flow"
Cohesion: 0.15
Nodes (8): CheckoutFlow(), INITIAL_PAYMENT, INITIAL_SHIPPING, PaymentData, ShippingData, Step, STEPS, metadata

### Community 29 - "Web Category Pages"
Cohesion: 0.16
Nodes (8): CATEGORIES, Category, CategoryBar(), SubCategory, MOCK_PRODUCT, ProductDetail(), CategoryListing(), MOCK_PRODUCTS

### Community 30 - "Web Product Detail"
Cohesion: 0.18
Nodes (10): ProductGallery(), ProductGalleryProps, ProductImage, ProductTabs(), ProductTabsProps, TabContent, ACTION_BUTTONS, Product (+2 more)

### Community 32 - "Web Footer & Thank You"
Cohesion: 0.2
Nodes (6): COMPANY, Footer(), QUICK_LINKS, SUPPORT, metadata, ThankYouContent()

### Community 33 - "Categories API Module"
Cohesion: 0.29
Nodes (3): CategoriesService, CreateCategoryDto, UpdateCategoryDto

### Community 34 - "Web App Layout"
Cohesion: 0.27
Nodes (7): geist, metadata, RootLayout(), CartContext, CartContextType, CartItem, CartProvider()

### Community 35 - "Web Cart & Header"
Cohesion: 0.31
Nodes (6): CartContents(), metadata, ReviewStep(), Header(), NAV_LINKS, useCart()

### Community 36 - "Admin Stats Module"
Cohesion: 0.29
Nodes (3): StatsController, StatsModule, StatsService

### Community 37 - "API App Controller"
Cohesion: 0.31
Nodes (3): Public(), AppController, AppService

### Community 40 - "Web About Page"
Cohesion: 0.25
Nodes (6): metadata, MILESTONES, TEAM, VALUES, SectionHeading(), SectionHeadingProps

### Community 43 - "Prisma & Scheduler Module"
Cohesion: 0.33
Nodes (3): PrismaModule, PrismaService, SuppliersModule

### Community 44 - "ESLint & Build Configs"
Cohesion: 0.36
Nodes (4): config, nestJsConfig, nextJsConfig, config

### Community 45 - "Web Contact Form"
Cohesion: 0.29
Nodes (5): ContactForm(), SUBJECTS, CONTACT_INFO, FAQ, metadata

### Community 46 - "Shared UI Button"
Cohesion: 0.29
Nodes (5): ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 49 - "Build Demo Script"
Cohesion: 0.29
Nodes (4): adminRoot, here, moves, stash

### Community 51 - "Animated Circles SVG"
Cohesion: 0.47
Nodes (6): SVG Pulsing Opacity Animation, Inner Circle (r=25) Stroke Animated, Outer Circle (r=45) Stroke Animated, Inner Circle Radial Gradient Fill Animated, Radial Gradient White to Transparent, Animated Concentric Circles SVG

### Community 52 - "Shared UI Avatar"
Cohesion: 0.4
Nodes (3): AvatarProps, AvatarSize, sizeClasses

### Community 53 - "Shared UI Badge"
Cohesion: 0.4
Nodes (3): BadgeProps, BadgeVariant, variantClasses

### Community 55 - "Import Wizard Page"
Cohesion: 0.4
Nodes (3): ImportWizard(), DemoMockExports, generateStaticParams()

### Community 61 - "Easily Branded Brand Assets"
Cohesion: 0.67
Nodes (4): Easily Branded Admin Logo, Easily Branded, EB Monogram Icon, Teal and Dark Blue Color Scheme

### Community 67 - "Turborepo Brand Assets"
Cohesion: 0.67
Nodes (3): Monorepo Build Tooling, Turborepo Brand Identity, Turborepo SVG Logo

## Knowledge Gaps
- **209 isolated node(s):** `UpdateLinkDto`, `Link`, `TabItem`, `TabsProps`, `ButtonVariant` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateStaticParams()` connect `Supplier Admin UI` to `Mock Data Generation`, `Web Category Pages`, `Admin Category Management`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Prisma & Scheduler Module` to `Supplier Import Pipeline`, `Categories API Module`, `Auth & User Management`, `API Middleware & Settings`, `Admin Stats Module`, `Product API Module`, `Inquiries & Mail`, `Orders API Module`, `Contact Messages API`, `Customers API Module`, `Supplier API Module`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Header()` connect `Web Cart & Header` to `Web Footer & Thank You`, `Web About Page`, `Web Contact Form`, `Web Home & Navigation`, `Web Inquiry Form`, `Web Checkout Flow`, `Web Category Pages`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `UpdateLinkDto`, `Link`, `TabItem` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supplier Import Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Auth & User Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Admin Page Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._