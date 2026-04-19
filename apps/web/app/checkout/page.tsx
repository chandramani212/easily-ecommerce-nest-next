import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { CheckoutFlow } from "./checkout-flow";

export const metadata = {
  title: "Checkout - Easily Branded",
  description: "Complete your purchase securely.",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />
      </div>
      <CheckoutFlow />
      <Footer />
    </>
  );
}
