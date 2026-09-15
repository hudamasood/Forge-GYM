import type { Metadata, Viewport } from "next";
import { Oswald, Work_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  applicationName: "FORGE",
  title: "FORGE | Strength is made, not born",
  description: "FORGE is a premium strength gym with six dedicated training spaces, object-based memberships and expert coaching.",
};

export const viewport: Viewport = {
  themeColor: "#1c1b19",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions stamp attributes on <html>/<body> before
    // React hydrates. It only silences attribute diffs on these two elements, not their children.
    <html lang="en" className={`${oswald.variable} ${workSans.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
