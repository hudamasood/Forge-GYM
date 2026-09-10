import type { Metadata, Viewport } from "next";
import { Oswald, Work_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/store/cart-context";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORGE | Strength is made, not born",
  description: "FORGE is a premium strength gym with six dedicated training spaces, object-based memberships and expert coaching.",
};

export const viewport: Viewport = {
  themeColor: "#1c1b19",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oswald.variable} ${workSans.variable}`}>
      <body className="min-h-dvh antialiased">
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
