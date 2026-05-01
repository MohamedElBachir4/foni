import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SparePartsBrandsSection } from "@/components/SparePartsBrandsSection";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "قطع غيار الهواتف في الجزائر",
  description:
    "تصفح قطع غيار الهواتف حسب الماركة والموديل في متجر Foni داخل الجزائر مع خيارات متنوعة.",
  path: "/spare-parts",
});

export default function SparePartsBrandsPage() {
  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            قطع غيار الهواتف
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            اختر الماركة لعرض موديلات الهواتف وقطع الغيار الخاصة بها.
          </p>
        </section>

        <SparePartsBrandsSection />
        <Footer />
      </main>
    </div>
  );
}
