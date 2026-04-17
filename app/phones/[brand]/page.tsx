import { Navbar } from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";

const BRAND_LABELS: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  xiaomi: "Xiaomi",
  oppo: "Oppo",
  huawei: "Huawei",
  infinix: "Infinix",
  google: "Google",
  realme: "Realme",
  oneplus: "OnePlus",
  redmi: "Redmi",
  motorola: "Motorola",
  vivo: "Vivo",
  ace: "Ace",
  tecno: "Tecno",
  nokia: "Nokia",
  lg: "LG",
  condor: "Condor",
  itel: "Itel",
  honor: "Honor",
  poco: "Poco",
};

export default async function BrandPhonesPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const brandId = brand.toLowerCase();
  const brandLabel = BRAND_LABELS[brandId] ?? brandId;

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            هواتف {brandLabel}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            استكشف هواتف {brandLabel} المتوفرة لدينا، مع إمكانية إضافة المزيد من
            الموديلات وقطع الغيار من لوحة التحكم.
          </p>
        </section>

        {/* Products grid filtered حسب الماركة */}
        <ProductGrid selectedBrandId={brandId} />

        <Footer />
      </main>
    </div>
  );
}

