import type { Metadata } from "next";
import { Cairo, Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { buildMetadata } from "@/lib/seo";
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
  ...buildMetadata({
    title: "عالم الهواتف النقالة - Foni",
    description:
      "عالم الهواتف النقالة في الجزائر — هواتف، اكسسوارات، وقطع غيار مع تجربة عربية موحدة.",
    path: "/",
    image: "/LOGO.jpeg",
  }),
  title: {
    default: "عالم الهواتف النقالة - Foni",
    template: "%s | Foni",
  },
  icons: {
    icon: [
      { url: "/LOGO.jpeg?v=4", type: "image/jpeg", sizes: "32x32" },
      { url: "/LOGO.jpeg?v=4", type: "image/jpeg", sizes: "192x192" },
    ],
    shortcut: "/LOGO.jpeg?v=4",
    apple: "/LOGO.jpeg?v=4",
  },
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
        <Providers>
          {children}
          <WhatsAppFloatingButton />
        </Providers>
      </body>
    </html>
  );
}

