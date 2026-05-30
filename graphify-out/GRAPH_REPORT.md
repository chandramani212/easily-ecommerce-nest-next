# Graph Report - ecommerce  (2026-05-30)

## Corpus Check
- 264 files · ~74,589 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1294 nodes · 2404 edges · 106 communities (74 shown, 32 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ff10dd9`
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
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 25 edges
2. `PrismaService` - 22 edges
3. `PageHeader()` - 21 edges
4. `resolveSearchParams()` - 19 edges
5. `clientApi()` - 17 edges
6. `SupplierImportsService` - 16 edges
7. `ImportRunnerService` - 15 edges
8. `SupplierImportsController` - 13 edges
9. `MediaService` - 13 edges
10. `ProductsService` - 12 edges

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

## Communities (106 total, 32 thin omitted)

### Community 0 - "Supplier Import Pipeline"
Cohesion: 0.1
Nodes (30): Column, DataTable(), DateRangeFilter(), DateRangeFilterProps, ExportButton(), ExportButtonProps, PageHeader(), Pager() (+22 more)

### Community 1 - "Auth & User Management"
Cohesion: 0.08
Nodes (35): CsvParser, JsonParser, ParseResult, RecordParser, xml, XmlParser, applyMarkup(), applyTransform() (+27 more)

### Community 2 - "Admin Page Components"
Cohesion: 0.07
Nodes (30): OrderStatusEditor(), STATUSES, CustomerDetailPage(), DemoMockExports, generateStaticParams(), OrderDetailPage(), TABS, STATUS_BADGE (+22 more)

### Community 3 - "API Middleware & Settings"
Cohesion: 0.07
Nodes (35): DEMO_CATEGORY_IDS, DEMO_PRODUCT_IDS, DEMO_SUPPLIER_IDS, DEMO_SUPPLIER_IMPORT_IDS, demoRoute(), demoRouteSafe(), paginate(), parseUrl() (+27 more)

### Community 4 - "Admin Product UI"
Cohesion: 0.09
Nodes (13): CreateProductDto, ProductAttributeDto, TierPriceDto, UpdateProductDto, ProductsController, ProductsModule, ProductListQuery, ProductsService (+5 more)

### Community 5 - "Product API Module"
Cohesion: 0.11
Nodes (17): ApiKeyAdapter, AsiMemberAuthAdapter, AnyCredentials, ApiKeyCredentials, AsiMemberAuthCredentials, AuthAdapter, BasicCredentials, BearerCredentials (+9 more)

### Community 6 - "Admin Shell & Layout"
Cohesion: 0.1
Nodes (20): MediaPicker(), Props, ProductPicker(), Props, clientApi(), demoHandle(), DemoReadOnlyError, isMutation() (+12 more)

### Community 7 - "Supplier Admin UI"
Cohesion: 0.1
Nodes (20): StatusBadge(), STYLES, ContactRow(), STATUSES, InquiryRow(), STATUSES, AdminUser, ContactMessage (+12 more)

### Community 8 - "Inquiries & Mail"
Cohesion: 0.08
Nodes (20): BestSellersTabs(), Product, Tab, FilterOption, Filters, FilterSidebar(), FilterSidebarProps, buildPageRange() (+12 more)

### Community 9 - "Auth Adapters"
Cohesion: 0.1
Nodes (18): CATEGORIES, categoryIcon(), PRODUCT_TABS, TESTIMONIALS, CategoryCard(), CategoryCardProps, HeroBanner(), Slide (+10 more)

### Community 10 - "Import Run History UI"
Cohesion: 0.12
Nodes (23): CategoryBarClient(), CategoryBarClientProps, MobileCategoryRowProps, AdaptedCategory, adaptProductForCard(), adaptProductForDetail(), CardProduct, CATEGORY_ICON_PATHS (+15 more)

### Community 11 - "Web Store Catalog UI"
Cohesion: 0.1
Nodes (18): AdminShell(), AdminShellProps, MeResponse, MENU, MenuItem, PAGES, Sidebar(), SidebarProps (+10 more)

### Community 12 - "Demo API Layer"
Cohesion: 0.08
Nodes (15): AttributeMapItem, CategoriesMap, FIELD_TRANSFORMS, FieldTransform, ImagesMap, ImportWizard(), MappingSpec, MarkupSpec (+7 more)

### Community 13 - "Web Home & Navigation"
Cohesion: 0.08
Nodes (25): Build, code:block1 (├── apps/), code:bash (pnpm install), code:bash (pnpm dev), code:bash (# API only), code:bash (pnpm build), code:bash (pnpm lint), code:bash (pnpm test) (+17 more)

### Community 14 - "Orders API Module"
Cohesion: 0.13
Nodes (18): CATEGORIES, Category, CategoryBar(), SubCategory, MOCK_PRODUCT, PageProps, ProductPage(), resolveProduct() (+10 more)

### Community 15 - "Contact Messages API"
Cohesion: 0.11
Nodes (15): CartContents(), metadata, CheckoutFlow(), INITIAL_PAYMENT, INITIAL_SHIPPING, PaymentData, ReviewStep(), ShippingData (+7 more)

### Community 16 - "Mock Data Generation"
Cohesion: 0.13
Nodes (7): CreateOrderDto, OrderItemDto, UpdateOrderStatusDto, OrdersController, OrdersModule, OrderListQuery, OrdersService

### Community 17 - "Customers API Module"
Cohesion: 0.13
Nodes (6): CreateUserDto, UpdateUserDto, UsersController, UsersModule, userSelect, UsersService

### Community 18 - "Middleware & Routes"
Cohesion: 0.14
Nodes (14): AsiCentralFetcher, AsiCentralFetcherConfig, AsiProductSummary, AsiSearchResponse, DETAIL_PATH(), extractSummaries(), pickId(), safeText() (+6 more)

### Community 19 - "Import Wizard UI"
Cohesion: 0.15
Nodes (8): AuthController, AuthModule, AuthService, CurrentUser, JwtUser, LoginDto, JwtPayload, JwtStrategy

### Community 20 - "Supplier API Module"
Cohesion: 0.13
Nodes (12): config, middleware(), PUBLIC_PATHS, AdminSessionPayload, verifyToken(), Ctx, DELETE(), forward() (+4 more)

### Community 21 - "Import Service Internals"
Cohesion: 0.12
Nodes (11): COMPANY, Footer(), QUICK_LINKS, SUPPORT, ContactForm(), SUBJECTS, CONTACT_INFO, FAQ (+3 more)

### Community 22 - "Admin Category Management"
Cohesion: 0.15
Nodes (9): CategoriesManager(), EditProductPage(), DemoMockExports, generateStaticParams(), ApiError, apiFetch(), realFetch(), SupplierImport (+1 more)

### Community 23 - "Links CRUD Module"
Cohesion: 0.16
Nodes (3): LinksController, LinksModule, LinksService

### Community 24 - "Project Architecture Docs"
Cohesion: 0.13
Nodes (10): DemoMockExports, generateStaticParams(), Supplier, SupplierAuthType, SupplierKind, AUTH_TYPES, AuthState, EMPTY_AUTH (+2 more)

### Community 25 - "API Core Module"
Cohesion: 0.19
Nodes (5): TestEmailDto, UpdateSettingsDto, SettingsController, SettingsModule, SettingsService

### Community 26 - "Admin Contacts & Users"
Cohesion: 0.18
Nodes (6): JwtAuthGuard, MediaModule, PrismaModule, AppModule, SupplierCategoriesController, SuppliersModule

### Community 27 - "Web Inquiry Form"
Cohesion: 0.14
Nodes (7): FileFetcher, parserFor(), SecretsCipher, parseAsiConfig(), RunOptions, RunResult, RunResultRow

### Community 28 - "Web Checkout Flow"
Cohesion: 0.19
Nodes (5): CustomersController, CustomersModule, CustomerListQuery, CreateCustomerDto, UpdateCustomerDto

### Community 29 - "Web Category Pages"
Cohesion: 0.2
Nodes (15): apps/admin Directory Admin App, apps/api Directory NestJS Backend, apps/web Directory Next.js Frontend, Ecommerce Monorepo Plan, Phase 2 Out-of-Scope Features, Supplier Product Import Feature, Tier Price Types Fixed Price and Percentage Discount, NestJS Next.js Monorepo Starter README (+7 more)

### Community 31 - "Supplier Imports Controller"
Cohesion: 0.19
Nodes (11): buildCategoryTree(), categoryLabel(), CategorySelect(), nameCollisions(), parentNameFor(), Filter, SupplierCategoriesTab(), SupplierCategoryRow (+3 more)

### Community 32 - "Web Footer & Thank You"
Cohesion: 0.18
Nodes (8): Breadcrumb(), BreadcrumbItem, BreadcrumbProps, INQUIRY_TYPES, InquiryForm(), InquiryFormProps, InquiryFormPage(), metadata

### Community 33 - "Categories API Module"
Cohesion: 0.25
Nodes (4): CategoriesModule, CategoriesService, CreateCategoryDto, UpdateCategoryDto

### Community 34 - "Web App Layout"
Cohesion: 0.18
Nodes (6): Roles(), RolesGuard, SetSupplierCategoryMappingDto, SupplierCategoryListQueryDto, SupplierCategoriesService, SupplierCategoryListQuery

### Community 35 - "Web Cart & Header"
Cohesion: 0.18
Nodes (10): ProductGallery(), ProductGalleryProps, ProductImage, ProductTabs(), ProductTabsProps, TabContent, ACTION_BUTTONS, Product (+2 more)

### Community 38 - "Suppliers Controller"
Cohesion: 0.21
Nodes (3): CsvColumn, toCsv(), CustomersService

### Community 39 - "Import Runner Service"
Cohesion: 0.27
Nodes (6): LocalStorageAdapter, sanitize(), SavedFile, STORAGE_ADAPTER, StorageAdapter, UploadInput

### Community 40 - "Web About Page"
Cohesion: 0.27
Nodes (6): CreateImportDto, DryRunOptionsDto, RunNowOptionsDto, RunsListQuery, UpdateImportDto, PrismaService

### Community 41 - "Sync Scheduler Service"
Cohesion: 0.17
Nodes (11): 1. Suppliers List (`/suppliers`), 2. Products Tab (`/suppliers/[id]?tab=products`), 3. Import Runs Page (`/suppliers/[id]/imports/[importId]/runs`), API Response Shape, code:block1 (const page = Number(p(sp, "page") ?? "1");), Files Changed, Out of Scope, Overview (+3 more)

### Community 43 - "Prisma & Scheduler Module"
Cohesion: 0.4
Nodes (8): CreateSupplierDto, CronPreviewDto, SampleFromUrlDto, SupplierAuthCredentialsDto, SupplierListQuery, SupplierProductsQuery, TestConnectionDto, UpdateSupplierDto

### Community 44 - "ESLint & Build Configs"
Cohesion: 0.27
Nodes (7): geist, metadata, RootLayout(), CartContext, CartContextType, CartItem, CartProvider()

### Community 45 - "Web Contact Form"
Cohesion: 0.29
Nodes (3): StatsController, StatsModule, StatsService

### Community 47 - "Categories Controller"
Cohesion: 0.31
Nodes (3): Public(), AppController, AppService

### Community 49 - "Build Demo Script"
Cohesion: 0.29
Nodes (3): MailModule, MailOptions, MailService

### Community 52 - "Shared UI Avatar"
Cohesion: 0.25
Nodes (6): metadata, MILESTONES, TEAM, VALUES, SectionHeading(), SectionHeadingProps

### Community 54 - "Jest Config"
Cohesion: 0.36
Nodes (4): config, nestJsConfig, nextJsConfig, config

### Community 57 - "Link DTOs"
Cohesion: 0.5
Nodes (4): CreateInquiryDto, UpdateInquiryStatusDto, InquiriesModule, InquiryListQuery

### Community 58 - "Shared UI Tabs"
Cohesion: 0.5
Nodes (4): ContactMessagesModule, ContactListQuery, CreateContactMessageDto, UpdateContactMessageStatusDto

### Community 60 - "Category Filter Component"
Cohesion: 0.29
Nodes (5): ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 61 - "Easily Branded Brand Assets"
Cohesion: 0.38
Nodes (5): DashboardPage(), formatMoney(), Summary, StatCard(), StatCardProps

### Community 63 - "Shared UI Input"
Cohesion: 0.52
Nodes (4): MediaListQuery, UpdateMediaDto, ALLOWED_MIME, MIME_TO_EXT

### Community 64 - "Quantity Selector"
Cohesion: 0.29
Nodes (4): adminRoot, here, moves, stash

### Community 65 - "Database Seed Script"
Cohesion: 0.33
Nodes (5): dto, link, links, removed, updated

### Community 66 - "Admin Metric Card"
Cohesion: 0.33
Nodes (5): code:bash (pnpm run dev), Getting Started, Important Note 🚧, Learn More, With-NestJs | API

### Community 67 - "Turborepo Brand Assets"
Cohesion: 0.47
Nodes (6): SVG Pulsing Opacity Animation, Inner Circle (r=25) Stroke Animated, Outer Circle (r=45) Stroke Animated, Inner Circle Radial Gradient Fill Animated, Radial Gradient White to Transparent, Animated Concentric Circles SVG

### Community 68 - "Link Entity Prisma"
Cohesion: 0.4
Nodes (3): AvatarProps, AvatarSize, sizeClasses

### Community 69 - "PostCSS Config Web"
Cohesion: 0.4
Nodes (3): BadgeProps, BadgeVariant, variantClasses

### Community 72 - "Vercel Brand Assets"
Cohesion: 0.5
Nodes (4): AdminError(), classify(), ErrorInfo, ErrorProps

### Community 74 - "ESLint Config Backend"
Cohesion: 0.4
Nodes (4): code:bash (pnpm dev), Deploy on Vercel, Getting Started, Learn More

### Community 78 - "PostCSS Config Admin"
Cohesion: 0.67
Nodes (4): Easily Branded Admin Logo, Easily Branded, EB Monogram Icon, Teal and Dark Blue Color Scheme

### Community 84 - "ESLint Config Admin"
Cohesion: 0.67
Nodes (3): Monorepo Build Tooling, Turborepo Brand Identity, Turborepo SVG Logo

## Knowledge Gaps
- **266 isolated node(s):** `UpdateLinkDto`, `Link`, `TabItem`, `TabsProps`, `ButtonVariant` (+261 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetchSafe()` connect `Orders API Module` to `Admin Page Components`, `API Middleware & Settings`, `Auth Adapters`, `Web Store Catalog UI`, `Admin Category Management`, `Easily Branded Brand Assets`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Web About Page` to `Categories API Module`, `Web App Layout`, `Admin Product UI`, `Shared UI Tabs`, `Prisma & Scheduler Module`, `Web Contact Form`, `Link DTOs`, `Mock Data Generation`, `Customers API Module`, `Build Demo Script`, `Import Wizard UI`, `API Core Module`, `Admin Contacts & Users`, `Web Inquiry Form`, `Web Checkout Flow`, `Shared UI Input`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `Admin Category Management` to `Supplier Import Pipeline`, `Admin Page Components`, `API Middleware & Settings`, `Supplier Admin UI`, `Orders API Module`, `Project Architecture Docs`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `UpdateLinkDto`, `Link`, `TabItem` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supplier Import Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Auth & User Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Admin Page Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._