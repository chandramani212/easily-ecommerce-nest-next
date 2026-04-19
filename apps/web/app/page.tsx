import { Header } from "../components/header";
import { HeroBanner } from "../components/hero-banner";
import { TrustBadges } from "../components/trust-badges";
import { CategoryBar } from "../components/category-bar";
import { SectionHeading } from "../components/section-heading";
import { CategoryCard } from "../components/category-card";
import { BestSellersTabs } from "../components/best-sellers-tabs";
import { TestimonialCarousel } from "../components/testimonial-carousel";
import { Footer } from "../components/footer";

const CATEGORIES = [
  {
    name: "T-Shirts",
    slug: "t-shirts",
    count: 312,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.29 2h2.83l2.88 2.88L14.88 2h2.83L21 5.29v4.42l-3 3V21H6v-8.29l-3-3V5.29L6.29 2z" />
      </svg>
    ),
  },
  {
    name: "Stationery",
    slug: "stationery",
    count: 245,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    name: "Drinkware",
    slug: "drinkware",
    count: 178,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 012 2v2a6 6 0 01-6 6h0a6 6 0 01-6-6V8a2 2 0 012-2z M8 16v4m8-4v4M7 20h10" />
      </svg>
    ),
  },
  {
    name: "Bags",
    slug: "bags",
    count: 156,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    name: "Tech",
    slug: "tech",
    count: 198,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Corporate",
    slug: "corporate",
    count: 134,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const PRODUCT_TABS = [
  {
    key: "popular",
    label: "Most Popular",
    products: [
      { name: "Custom Logo Hoodie", price: 44.99, originalPrice: 59.99, badge: "Best Seller", color: "#1a9e7a" },
      { name: "Branded Notebook Set", price: 18.99, color: "#1b2e4b" },
      { name: "Company Polo Shirt", price: 32.99, originalPrice: 42.99, badge: "-23%", color: "#34d399" },
      { name: "Printed Tote Bag", price: 14.99, color: "#2dd4bf" },
      { name: "Custom Water Bottle", price: 19.99, color: "#0d9488" },
      { name: "Branded USB Drive 64GB", price: 12.99, badge: "Hot", color: "#115e59" },
      { name: "Logo Embossed Pen Set", price: 24.99, color: "#1b2e4b" },
      { name: "Custom Desk Calendar", price: 16.99, originalPrice: 22.99, badge: "Sale", color: "#047857" },
    ],
  },
  {
    key: "tshirts",
    label: "T-Shirts",
    products: [
      { name: "Classic Crew Neck Tee", price: 22.99, color: "#1a9e7a" },
      { name: "Premium V-Neck T-Shirt", price: 26.99, originalPrice: 34.99, badge: "-23%", color: "#115e59" },
      { name: "Oversized Graphic Tee", price: 29.99, badge: "New", color: "#0d9488" },
      { name: "Organic Cotton T-Shirt", price: 34.99, color: "#34d399" },
      { name: "Performance Dry-Fit Tee", price: 28.99, color: "#047857" },
      { name: "Long Sleeve Brand Tee", price: 31.99, originalPrice: 39.99, badge: "Sale", color: "#1b2e4b" },
      { name: "Vintage Wash Tee", price: 27.99, color: "#2dd4bf" },
      { name: "Pocket Logo T-Shirt", price: 24.99, badge: "Popular", color: "#1a9e7a" },
    ],
  },
  {
    key: "stationery",
    label: "Stationery",
    products: [
      { name: "Branded A5 Notebook", price: 14.99, badge: "Best Seller", color: "#1b2e4b" },
      { name: "Custom Sticky Notes Pack", price: 8.99, color: "#34d399" },
      { name: "Logo Ballpoint Pen (10 pk)", price: 19.99, originalPrice: 24.99, badge: "-20%", color: "#0d9488" },
      { name: "Branded Planner 2026", price: 22.99, color: "#047857" },
      { name: "Custom Bookmark Set", price: 6.99, color: "#2dd4bf" },
      { name: "Printed Folder Portfolio", price: 16.99, color: "#115e59" },
      { name: "Logo Washi Tape Set", price: 9.99, badge: "New", color: "#1a9e7a" },
      { name: "Branded Pencil Case", price: 12.99, originalPrice: 17.99, badge: "Sale", color: "#1b2e4b" },
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Verified Buyer",
    initials: "SJ",
    rating: 5,
    quote:
      "Absolutely love the quality of products! Fast shipping and the packaging was perfect. Will definitely be ordering again.",
  },
  {
    name: "Michael Chen",
    role: "Regular Customer",
    initials: "MC",
    rating: 5,
    quote:
      "The customer service is outstanding. Had a question about my order and they responded within minutes. Highly recommend!",
  },
  {
    name: "Emily Rodriguez",
    role: "Verified Buyer",
    initials: "ER",
    rating: 4,
    quote:
      "Great selection and competitive prices. The website is easy to navigate and checkout was seamless. Very impressed.",
  },
  {
    name: "David Park",
    role: "Regular Customer",
    initials: "DP",
    rating: 5,
    quote:
      "Been shopping here for over a year now. Consistent quality and the rewards program is a great bonus. Wouldn't shop anywhere else.",
  },
  {
    name: "Lisa Thompson",
    role: "Verified Buyer",
    initials: "LT",
    rating: 5,
    quote:
      "The return process was so easy and hassle-free. They really stand behind their products. Excellent experience overall.",
  },
  {
    name: "James Wilson",
    role: "Verified Buyer",
    initials: "JW",
    rating: 4,
    quote:
      "Wide variety of products and very competitive pricing. The website makes it easy to compare and find exactly what you need.",
  },
];

export default function Page() {
  return (
    <>
      <Header />
      <CategoryBar />
      <HeroBanner />
      <TrustBadges />

      <section className="bg-[var(--muted)]" id="categories">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Shop by Category"
            subtitle="Find what you need across our wide range of categories"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.name} {...cat} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white" id="shop">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Best Sellers"
            subtitle="Our most popular products loved by customers"
          />
          <BestSellersTabs tabs={PRODUCT_TABS} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Real reviews from real customers"
        />
        <TestimonialCarousel items={TESTIMONIALS} />
      </section>

      <Footer />
    </>
  );
}
