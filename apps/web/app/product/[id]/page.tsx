import { Header } from "../../../components/header";
import { CategoryBar } from "../../../components/category-bar";
import { Footer } from "../../../components/footer";
import { Breadcrumb } from "../../../components/breadcrumb";
import { ProductDetail } from "./product-detail";

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
    "Experience premium sound quality with our Wireless Noise-Cancelling Headphones. Featuring advanced active noise cancellation technology, these headphones deliver crystal-clear audio in any environment. The ergonomic over-ear design provides maximum comfort for extended listening sessions, while the 30-hour battery life ensures your music never stops. With Bluetooth 5.3 connectivity, seamless device switching, and a built-in microphone for calls, these headphones are the perfect companion for work, travel, and everyday listening.",
  additionalInfo:
    "Driver Size: 40mm | Frequency Response: 20Hz - 20kHz | Battery Life: 30 hours (ANC on), 45 hours (ANC off) | Charging: USB-C, 10 min = 3 hours playback | Weight: 250g | Bluetooth: 5.3 with multipoint | Noise Cancellation: Hybrid Active | Foldable: Yes | Included: Carrying case, USB-C cable, 3.5mm audio cable, airplane adapter.",
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
