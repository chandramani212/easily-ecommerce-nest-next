import { Header } from "../../../components/header";
import { CategoryBar } from "../../../components/category-bar";
import { Breadcrumb } from "../../../components/breadcrumb";
import { Footer } from "../../../components/footer";
import { CategoryListing } from "./category-listing";

export function generateStaticParams() {
  return [
    { slug: "t-shirts" },
    { slug: "stationery" },
    { slug: "drinkware" },
    { slug: "bags" },
    { slug: "tech" },
    { slug: "corporate" },
    { slug: "headwear" },
    { slug: "wellness" },
    { slug: "electronics" },
  ];
}

const MOCK_PRODUCTS = [
  { id: "1", name: "Wireless Noise-Cancelling Headphones", price: 79.99, originalPrice: 129.99, badge: "Sale", color: "#818cf8", brand: "AudioPro", colorName: "Purple", rating: 4 },
  { id: "2", name: "Bluetooth Portable Speaker", price: 49.99, color: "#60a5fa", brand: "SoundWave", colorName: "Blue", rating: 5 },
  { id: "3", name: "USB-C Fast Charger 65W", price: 29.99, originalPrice: 39.99, badge: "-25%", color: "#34d399", brand: "ChargeTech", colorName: "Green", rating: 4 },
  { id: "4", name: "Mechanical Gaming Keyboard", price: 89.99, color: "#f87171", brand: "KeyForce", colorName: "Red", rating: 5 },
  { id: "5", name: "4K Ultra HD Webcam", price: 59.99, color: "#1e293b", brand: "VisionPro", colorName: "Black", rating: 3 },
  { id: "6", name: "Wireless Ergonomic Mouse", price: 34.99, color: "#e2e8f0", brand: "AudioPro", colorName: "White", rating: 4 },
  { id: "7", name: "Smart LED Desk Lamp", price: 44.99, originalPrice: 59.99, badge: "Hot", color: "#fb923c", brand: "BrightHome", colorName: "Orange", rating: 5 },
  { id: "8", name: "Portable SSD 1TB", price: 94.99, color: "#a78bfa", brand: "DataVault", colorName: "Purple", rating: 4 },
  { id: "9", name: "Noise-Isolating Earbuds", price: 24.99, color: "#2dd4bf", brand: "SoundWave", colorName: "Teal", rating: 3 },
  { id: "10", name: "Laptop Stand Adjustable", price: 39.99, color: "#94a3b8", brand: "DeskPro", colorName: "Silver", rating: 4 },
  { id: "11", name: "Multi-Port USB Hub", price: 19.99, color: "#475569", brand: "ChargeTech", colorName: "Gray", rating: 5 },
  { id: "12", name: "Curved Gaming Monitor 27\"", price: 189.99, originalPrice: 249.99, badge: "Sale", color: "#4f46e5", brand: "VisionPro", colorName: "Blue", rating: 5 },
  { id: "13", name: "Wireless Charging Pad", price: 14.99, color: "#fbbf24", brand: "ChargeTech", colorName: "Yellow", rating: 3 },
  { id: "14", name: "Smart Plug Wi-Fi", price: 12.99, color: "#f472b6", brand: "BrightHome", colorName: "Pink", rating: 4 },
  { id: "15", name: "Condenser Microphone USB", price: 69.99, color: "#1e293b", brand: "AudioPro", colorName: "Black", rating: 5 },
  { id: "16", name: "Webcam Ring Light", price: 22.99, originalPrice: 29.99, color: "#fde68a", brand: "BrightHome", colorName: "Yellow", rating: 4 },
];

export default function CategoryPage() {
  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/#shop" },
            { label: "Electronics" },
          ]}
        />
      </div>

      <CategoryListing
        title="Electronics"
        products={MOCK_PRODUCTS}
      />

      <Footer />
    </>
  );
}
