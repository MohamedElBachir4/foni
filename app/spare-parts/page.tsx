import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SparePartsBrandGrid } from "@/components/SparePartsBrandGrid";
import { SPARE_PARTS_STATIC_BRANDS } from "@/lib/sparePartsStaticBrands";

const brandsForGrid = SPARE_PARTS_STATIC_BRANDS.map((b) => ({
  _id: b.slug,
  name: b.name,
  slug: b.slug,
}));

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

        <SparePartsBrandGrid brands={brandsForGrid} />
        <Footer />
      </main>
    </div>
  );
}
