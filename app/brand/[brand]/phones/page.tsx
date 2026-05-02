import { Navbar } from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";
import { publicFetch } from "@/lib/publicFetch";

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

const MONGO_ID = /^[a-f0-9]{24}$/i;

export default async function BrandPhonesPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ phoneType?: string }>;
}) {
  const { brand } = await params;
  const sp = await searchParams;
  const brandId = brand.toLowerCase();
  const brandLabel = BRAND_LABELS[brandId] ?? brandId;

  let phoneTypeId: string | null = null;
  let phoneTypeName: string | null = null;
  const q = sp?.phoneType;
  if (q && MONGO_ID.test(q)) {
    try {
      const res = await publicFetch(`/api/phone-types/${q}`, { cache: "no-store" });
      if (res.ok) {
        const pt = (await res.json()) as {
          name?: string;
          brand?: { slug?: string; name?: string } | null;
        };
        const bSlug = (pt.brand?.slug || "").toLowerCase();
        const bName = (pt.brand?.name || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-");
        if (bSlug === brandId || bName === brandId) {
          phoneTypeId = q;
          phoneTypeName = pt.name ?? null;
        }
      }
    } catch {
      /* تجاهل query غير صالح */
    }
  }

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {phoneTypeName
              ? `هواتف ${brandLabel} — ${phoneTypeName}`
              : `هواتف ${brandLabel}`}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            {phoneTypeName
              ? `الهواتف المسجّلة تحت موديل «${phoneTypeName}» ضمن ${brandLabel}.`
              : `استكشف هواتف ${brandLabel} المتوفرة لدينا، مع إمكانية إضافة المزيد من الموديلات من لوحة
            التحكم.`}
          </p>
        </section>

        <ProductGrid selectedBrandId={brandId} phoneTypeId={phoneTypeId} />

        <Footer />
      </main>
    </div>
  );
}
