import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { Breadcrumb } from "../../components/breadcrumb";
import { InquiryFormPage } from "./inquiry-form-page";

export const metadata = {
  title: "Product Inquiry - Easily Branded",
  description:
    "Get an instant quote, request a free visual, order a sample, or place an order for custom branded products.",
};

export default function InquiryPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Product Inquiry" },
          ]}
        />
      </div>
      <InquiryFormPage />
      <Footer />
    </>
  );
}
