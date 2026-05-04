import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandAccessoriesList } from "@/components/BrandAccessoriesList";
import { filterAccessoriesForBrandPage } from "@/lib/accessoryVisibility";
import { publicFetch } from "@/lib/publicFetch";

const MONGO_ID = /^[a-f0-9]{24}$/i;

type Accessory = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  details?: string;
  brand?: { name?: string; slug?: string } | string;
  phoneType?: { name?: string } | string;
  options?: string[];
};

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

export const dynamic = "force-dynamic";

async function fetchAccessories(brandSlug: string, phoneTypeId: string | null): Promise<Accessory[]> {
  try {
    const q = new URLSearchParams();
    q.set("brand", brandSlug);
    if (phoneTypeId && MONGO_ID.test(phoneTypeId)) {
      q.set("phoneType", phoneTypeId);
    }
    const res = await publicFetch(`/api/accessories?${q.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchPhoneTypeName(id: string): Promise<string | null> {
  if (!MONGO_ID.test(id)) return null;
  try {
    const res = await publicFetch(`/api/phone-types/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { name?: string; brand?: { slug?: string } | null };
    return data.name ?? null;
  } catch {
    return null;
  }
}

export default async function BrandAccessoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ phoneType?: string; model?: string }>;
}) {
  const { brand } = await params;
  const sp = await searchParams;
  const brandId = brand.toLowerCase();
  const brandLabel = BRAND_LABELS[brandId] ?? brandId;
  const phoneTypeParam = sp?.phoneType && MONGO_ID.test(String(sp.phoneType)) ? String(sp.phoneType) : null;
  const modelLegacy = sp?.model ? decodeURIComponent(String(sp.model)).trim() : "";

  let modelLabel = phoneTypeParam ? await fetchPhoneTypeName(phoneTypeParam) : null;
  if (phoneTypeParam && !modelLabel) {
    modelLabel = modelLegacy || null;
  }
  if (!phoneTypeParam && modelLegacy) {
    modelLabel = modelLegacy;
  }

  const accessories = filterAccessoriesForBrandPage(
    await fetchAccessories(brandId, phoneTypeParam),
    phoneTypeParam
  );

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {modelLabel
              ? `أكسسوارات ${brandLabel} — ${modelLabel}`
              : `أكسسوارات ${brandLabel}`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            {modelLabel && phoneTypeParam
              ? `أكسسوارات مخصّصة لهذا الموديل فقط (كما حُدّدت في لوحة التحكم).`
              : `أكسسوارات عامة للماركة أو غير مربوطة بموديل محدّد. المنتجات المربوطة بموديل معيّن تظهر فقط عند اختيار ذلك الموديل من «اختر الموديل» ثم اكسسوارات.`}
          </p>
        </header>

        {accessories.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            لا توجد أكسسوارات مطابقة لهذه الفلترة حالياً.
          </p>
        ) : (
          <BrandAccessoriesList accessories={accessories} />
        )}
      </main>
      <Footer />
    </div>
  );
}
