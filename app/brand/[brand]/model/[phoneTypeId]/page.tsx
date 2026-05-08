import Link from "next/link";
import { notFound } from "next/navigation";
import { Smartphone, Headphones, Wrench } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { publicFetch } from "@/lib/publicFetch";

const MONGO_ID = /^[a-f0-9]{24}$/i;

type PhoneTypeOne = {
  _id: string;
  name: string;
  image?: string;
  brand?: { _id: string; name: string; slug?: string } | null;
};

type ProductCardItem = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
};

function brandParamMatchesPhoneType(brandParam: string, pt: PhoneTypeOne) {
  const b = pt.brand;
  if (!b) return true;
  const slug = (b.slug || "").toLowerCase().trim();
  if (slug && slug === brandParam) return true;
  const name = (b.name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return name === brandParam;
}

export default async function ModelHubPage({
  params,
}: {
  params: Promise<{ brand: string; phoneTypeId: string }>;
}) {
  const { brand, phoneTypeId } = await params;
  const brandParam = brand.toLowerCase();
  if (!MONGO_ID.test(phoneTypeId)) notFound();

  let pt: PhoneTypeOne | null = null;
  try {
    const res = await publicFetch(`/api/phone-types/${phoneTypeId}`, {
      cache: "no-store",
    });
    if (!res.ok) notFound();
    pt = (await res.json()) as PhoneTypeOne;
  } catch {
    notFound();
  }
  if (!pt || !pt.brand?._id) notFound();
  if (!brandParamMatchesPhoneType(brandParam, pt)) notFound();

  const brandName = pt.brand?.name ?? brandParam;
  const modelName = pt.name;
  const brandMongoId = pt.brand._id;

  const [phones, accessories, spareParts] = await Promise.all([
    publicFetch(
      `/api/phones?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(
        phoneTypeId
      )}`,
      { cache: "no-store" }
    )
      .then(async (res) => (res.ok ? ((await res.json()) as ProductCardItem[]) : []))
      .catch(() => []),
    publicFetch(
      `/api/accessories?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(
        phoneTypeId
      )}`,
      { cache: "no-store" }
    )
      .then(async (res) => (res.ok ? ((await res.json()) as ProductCardItem[]) : []))
      .catch(() => []),
    publicFetch(
      `/api/spare-parts?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(
        phoneTypeId
      )}&limit=200`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return (Array.isArray(data?.parts) ? data.parts : []) as ProductCardItem[];
      })
      .catch(() => []),
  ]);

  function effectivePrice(item: ProductCardItem) {
    return Number(item.price ?? item.priceRetail ?? 0);
  }

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <Link href={`/brand/${brandParam}/models`} className="hover:text-blue-600">
              {brandName}
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">{modelName}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {modelName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            كل المنتجات المرتبطة بهذا الموديل في صفحة واحدة: الهواتف ثم قطع الغيار ثم الإكسسوارات.
          </p>
        </header>

        <section className="space-y-10">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Smartphone className="h-5 w-5 text-blue-600" />
              الهواتف
            </h2>
            {phones.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                لا توجد هواتف لهذا الموديل حالياً.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {phones.map((item) => (
                  <Link
                    key={item._id}
                    href={`/product/${item._id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/LOGO.jpeg"}
                      alt={item.name}
                      className="h-40 w-full object-contain bg-slate-50 p-2"
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-sm font-bold text-blue-600">{effectivePrice(item).toLocaleString()} دج</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Wrench className="h-5 w-5 text-emerald-600" />
              قطع الغيار
            </h2>
            {spareParts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                لا توجد قطع غيار لهذا الموديل حالياً.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {spareParts.map((item) => (
                  <Link
                    key={item._id}
                    href={`/product/${item._id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/LOGO.jpeg"}
                      alt={item.name}
                      className="h-40 w-full object-contain bg-slate-50 p-2"
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-600">{effectivePrice(item).toLocaleString()} دج</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
              <Headphones className="h-5 w-5 text-fuchsia-600" />
              الإكسسوارات
            </h2>
            {accessories.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                لا توجد إكسسوارات لهذا الموديل حالياً.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {accessories.map((item) => (
                  <Link
                    key={item._id}
                    href={`/product/${item._id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/LOGO.jpeg"}
                      alt={item.name}
                      className="h-40 w-full object-contain bg-slate-50 p-2"
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-sm font-bold text-fuchsia-600">{effectivePrice(item).toLocaleString()} دج</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
