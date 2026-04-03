import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AdminShell } from "./admin-shell";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopEase Admin",
  description: "Ecommerce Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
