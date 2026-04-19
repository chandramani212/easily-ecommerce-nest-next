import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { CartContents } from "./cart-contents";

export const metadata = {
  title: "Shopping Cart - Easily Branded",
  description: "Review your cart items and proceed to checkout.",
};

export default function CartPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shopping Cart" },
          ]}
        />
      </div>
      <CartContents />
      <Footer />
    </>
  );
}
