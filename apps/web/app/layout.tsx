import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CartProvider } from "../context/cart-context";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Easily Branded - Custom Branded Products",
  description:
    "Browse quality branded products at competitive prices. Custom T-shirts, stationery, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
