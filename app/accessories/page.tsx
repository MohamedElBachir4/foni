import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { buildMetadata } from "@/lib/seo";
import { getProductImageUrl } from "@/lib/productImage";

import { publicFetch } from "@/lib/publicFetch";

type AccessoryType = { _id: string; name: string; image?: string };

const FALLBACK_TYPE_IMAGE =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "اكسسوارات الهواتف في الجزائر",
  description:
    "تصفح أنواع اكسسوارات الهواتف المتوفرة في متجر Foni مع صور واضحة وأسعار مناسبة داخل الجزائر.",
  path: "/accessories",
});

async function fetchTypes(): Promise<AccessoryType[]> {
  try {
    const res = await publicFetch("/api/accessory-types", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function AccessoriesTypesPage() {
  const types = await fetchTypes();

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            أنواع الأكسسوارات
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            اختر نوع الأكسسوارات لعرض المنتجات المرتبطة به.
          </p>
        </header>

        {types.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            لا توجد أنواع أكسسوارات مضافة بعد.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
            {types.map((t) => (
              <Link
                key={t._id}
                href={`/accessories/${t._id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  {/* روابط الصور من الـ API قد تكون من أي نطاق؛ التحميل المباشر بالمتصفح يتجنب فشل /_next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageUrl(t.image || FALLBACK_TYPE_IMAGE)}
                    alt={t.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-center">
                  <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">
                    {t.name}
                  </h2>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

