import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { ThankYouContent } from "./thank-you-content";

export const metadata = {
  title: "Thank You - Easily Branded",
  description: "Your inquiry has been submitted successfully.",
};

export default function ThankYouPage() {
  return (
    <>
      <Header />
      <ThankYouContent />
      <Footer />
    </>
  );
}
