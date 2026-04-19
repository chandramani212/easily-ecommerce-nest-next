import { Header } from "../../../components/header";
import { CategoryBar } from "../../../components/category-bar";
import { Footer } from "../../../components/footer";
import { Breadcrumb } from "../../../components/breadcrumb";
import { ProductDetail } from "./product-detail";

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
    { id: "7" },
    { id: "8" },
    { id: "9" },
    { id: "10" },
    { id: "11" },
    { id: "12" },
    { id: "13" },
    { id: "14" },
    { id: "15" },
    { id: "16" },
    { id: "custom-logo-hoodie" },
    { id: "branded-notebook-set" },
    { id: "company-polo-shirt" },
    { id: "printed-tote-bag" },
    { id: "custom-water-bottle" },
    { id: "branded-usb-drive-64gb" },
    { id: "logo-embossed-pen-set" },
    { id: "custom-desk-calendar" },
    { id: "classic-crew-neck-tee" },
    { id: "premium-v-neck-t-shirt" },
    { id: "oversized-graphic-tee" },
    { id: "organic-cotton-t-shirt" },
    { id: "performance-dry-fit-tee" },
    { id: "long-sleeve-brand-tee" },
    { id: "vintage-wash-tee" },
    { id: "pocket-logo-t-shirt" },
    { id: "branded-a5-notebook" },
    { id: "custom-sticky-notes-pack" },
    { id: "logo-ballpoint-pen--10-pk-" },
    { id: "branded-planner-2026" },
    { id: "custom-bookmark-set" },
    { id: "printed-folder-portfolio" },
    { id: "logo-washi-tape-set" },
    { id: "branded-pencil-case" },
  ];
}

const MOCK_PRODUCT = {
  name: "Wireless Noise-Cancelling Headphones",
  price: 79.99,
  originalPrice: 129.99,
  sku: "WNC-HP-2026",
  categories: ["Electronics", "Audio", "Headphones"],
  images: [
    { id: "1", color: "#818cf8", label: "Front" },
    { id: "2", color: "#6366f1", label: "Side" },
    { id: "3", color: "#4f46e5", label: "Back" },
    { id: "4", color: "#4338ca", label: "Detail" },
    { id: "5", color: "#3730a3", label: "Packaging" },
  ],
  description:
    "Save the day and bestow your clients with immense power by giving out this adult super hero cape! It measures 44\" x 28\", is made of polyester knitted fabric, and features a Velcro closure around the neck. This party / costume favorite features a large 14\" x 14\" imprint area on the back where you can add your company name or logo. You could also have this personalized to make it a little more special. Power up your marketing efforts with this as your next promotion!",
  colorVariations: "Orange, Red, Purple, Green, White, Black, Yellow, Navy Blue, Royal Blue, Light Blue, Silver",
  additionalInfo:
    "Material: 100% Polyester Knitted Fabric | Size: 44\" x 28\" | Imprint Area: 14\" x 14\" (back) | Closure: Velcro neck closure | Weight: 0.15 lbs | Minimum Order: 50 units | Production Time: 5-7 business days | Packaging: Individual poly bag",
  quantityPricing: [
    { quantity: "1+", price: 79.99 },
    { quantity: "5+", price: 74.99 },
    { quantity: "10+", price: 69.99 },
    { quantity: "25+", price: 64.99 },
  ],
};

export default function ProductPage() {
  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/#shop" },
            { label: "Electronics", href: "#" },
            { label: MOCK_PRODUCT.name },
          ]}
        />
      </div>

      <ProductDetail product={MOCK_PRODUCT} />

      <Footer />
    </>
  );
}
