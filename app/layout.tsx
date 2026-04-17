import type { Metadata } from "next";
import { Cairo, Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-foni",
});

export const metadata: Metadata = {
  title: "Foni - متجر قطع غيار الهواتف النقالة",
  description:
    "متجر عصري وفاخر لبيع قطع غيار الهواتف النقالة في الجزائر مع تجربة استخدام عربية بالكامل.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${cairo.variable} ${poppins.variable} font-sans antialiased text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

