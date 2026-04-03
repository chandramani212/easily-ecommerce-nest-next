import { Header } from "../components/header";
import { HeroBanner } from "../components/hero-banner";
import { TrustBadges } from "../components/trust-badges";
import { CategoryBar } from "../components/category-bar";
import { SectionHeading } from "../components/section-heading";
import { CategoryCard } from "../components/category-card";
import { ProductCard } from "../components/product-card";
import { TestimonialCarousel } from "../components/testimonial-carousel";
import { Footer } from "../components/footer";

const CATEGORIES = [
  {
    name: "Electronics",
    count: 245,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Clothing",
    count: 312,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.29 2h2.83l2.88 2.88L14.88 2h2.83L21 5.29v4.42l-3 3V21H6v-8.29l-3-3V5.29L6.29 2z" />
      </svg>
    ),
  },
  {
    name: "Home & Garden",
    count: 178,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
      </svg>
    ),
  },
  {
    name: "Sports",
    count: 156,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 000 20M12 2a14.5 14.5 0 010 20M2 12h20" />
      </svg>
    ),
  },
  {
    name: "Books",
    count: 423,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: "Beauty",
    count: 198,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-6-6h-2" />
      </svg>
    ),
  },
];

const PRODUCTS = [
  { name: "Wireless Noise-Cancelling Headphones", price: 79.99, originalPrice: 129.99, badge: "Sale", color: "#818cf8" },
  { name: "Organic Cotton T-Shirt", price: 34.99, color: "#34d399" },
  { name: "Smart Home Speaker", price: 49.99, originalPrice: 69.99, badge: "-29%", color: "#f472b6" },
  { name: "Premium Yoga Mat", price: 45.00, color: "#fb923c" },
  { name: "Stainless Steel Water Bottle", price: 24.99, color: "#60a5fa" },
  { name: "Leather Laptop Sleeve", price: 59.99, color: "#a78bfa" },
  { name: "Bluetooth Portable Charger", price: 29.99, originalPrice: 39.99, badge: "Hot", color: "#f87171" },
  { name: "Ceramic Coffee Mug Set", price: 22.00, color: "#2dd4bf" },
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="categories">
        <SectionHeading
          title="Shop by Category"
          subtitle="Find what you need across our wide range of categories"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>
      </section>

      <section className="bg-[var(--muted)]" id="shop">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Best Sellers"
            subtitle="Our most popular products loved by customers"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
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
