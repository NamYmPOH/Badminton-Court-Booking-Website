import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { BRAND } from "@/lib/config/brand";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/features/layout/Navbar";
import { MobileTabBar } from "@/components/features/layout/MobileTabBar";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bvp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Đặt sân cầu lông online`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.tagline,
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
