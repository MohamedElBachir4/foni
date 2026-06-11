import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategorySlider } from "@/components/CategorySlider";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "المنتجات | هواتف واكسسوارات وقطع غيار في الجزائر",
  description:
    "استعرض جميع أقسام المنتجات في متجر Foni: الهواتف النقالة، الاكسسوارات، وقطع الغيار في الجزائر.",
  path: "/products",
});

export default function ProductsHubPage() {
  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">المنتجات</span>
          </nav>
        </header>

        <CategorySlider
          heading="اختر القسم"
          subheading="اختر ما تريد استعراضه: الهواتف، الأكسسوارات، أو قطع الغيار."
          className="mb-0"
        />
      </main>
      <Footer />
    </div>
  );
}
