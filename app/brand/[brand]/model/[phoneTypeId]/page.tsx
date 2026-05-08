import Link from "next/link";
import { notFound } from "next/navigation";
import { Smartphone, Headphones, Wrench, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductImage } from "@/components/ProductImage";
import { ProductCardActions } from "@/components/ProductCardActions";
import { formatDzd } from "@/lib/pricing";

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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                {phones.map((item) => (
                  <article
                    key={item._id}
                    className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:rounded-[1.25rem]"
                  >
                    <div className="relative flex h-[180px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[220px] sm:py-4">
                      <ProductImage
                        src={item.image || "/LOGO.jpeg"}
                        alt={item.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="h-full w-full object-contain p-2 sm:p-3"
                      />
                      <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                        هواتف
                      </span>
                      <button
                        type="button"
                        aria-label="إضافة للمفضلة"
                        className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                      >
                        <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                      <h3 className="mb-2 text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                        {item.name}
                      </h3>
                      <p className="mb-2 text-center">
                        <span className="text-xl font-black text-slate-900 sm:text-2xl">
                          {formatDzd(effectivePrice(item))}
                        </span>
                        <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                      </p>
                      <ProductCardActions
                        id={item._id}
                        name={item.name}
                        price={effectivePrice(item)}
                        image={item.image || ""}
                        category="هواتف"
                      />
                    </div>
                  </article>
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                {spareParts.map((item) => (
                  <article
                    key={item._id}
                    className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:rounded-[1.25rem]"
                  >
                    <div className="relative flex h-[180px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[220px] sm:py-4">
                      <ProductImage
                        src={item.image || "/LOGO.jpeg"}
                        alt={item.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="h-full w-full object-contain p-2 sm:p-3"
                      />
                      <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                        قطعة غيار
                      </span>
                      <button
                        type="button"
                        aria-label="إضافة للمفضلة"
                        className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                      >
                        <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                      <p className="mb-2 text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">{item.name}</p>
                      <p className="mb-2 text-center">
                        <span className="text-xl font-black text-slate-900 sm:text-2xl">
                          {formatDzd(effectivePrice(item))}
                        </span>
                        <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                      </p>
                      <ProductCardActions
                        id={item._id}
                        name={item.name}
                        price={effectivePrice(item)}
                        image={item.image || ""}
                        category="قطع غيار"
                      />
                    </div>
                  </article>
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                {accessories.map((item) => (
                  <article
                    key={item._id}
                    className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:rounded-[1.25rem]"
                  >
                    <div className="relative flex h-[180px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[220px] sm:py-4">
                      <ProductImage
                        src={item.image || "/LOGO.jpeg"}
                        alt={item.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="h-full w-full object-contain p-2 sm:p-3"
                      />
                      <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                        أكسسوارات
                      </span>
                      <button
                        type="button"
                        aria-label="إضافة للمفضلة"
                        className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                      >
                        <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                      <p className="mb-2 text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">{item.name}</p>
                      <p className="mb-2 text-center">
                        <span className="text-xl font-black text-slate-900 sm:text-2xl">
                          {formatDzd(effectivePrice(item))}
                        </span>
                        <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                      </p>
                      <ProductCardActions
                        id={item._id}
                        name={item.name}
                        price={effectivePrice(item)}
                        image={item.image || ""}
                        category="أكسسوارات"
                      />
                    </div>
                  </article>
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
