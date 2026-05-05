import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCardActions } from "@/components/ProductCardActions";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductImage } from "@/components/ProductImage";
import { formatDzd } from "@/lib/pricing";
import { publicFetch } from "@/lib/publicFetch";

type AccessoryType = { _id: string; name: string };

type Accessory = {
  _id: string;
  name: string;
  type?: AccessoryType | string;
  image?: string;
  price?: number;
  details?: string;
  colors?: string[];
  options?: string[];
  phoneType?: unknown;
  phoneTypes?: unknown;
};

export const dynamic = "force-dynamic";

async function fetchAccessoriesByType(typeId: string): Promise<Accessory[]> {
  try {
    const res = await publicFetch(
      `/api/accessories?type=${encodeURIComponent(typeId)}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchAccessoryTypeName(typeId: string): Promise<string | null> {
  try {
    const res = await publicFetch("/api/accessory-types", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const row = data.find((x: { _id?: string }) => x?._id === typeId);
    return row?.name ? String(row.name) : null;
  } catch {
    return null;
  }
}

export default async function AccessoriesByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const accessories = await fetchAccessoriesByType(type);

  const first = accessories[0];
  const typeNameFromProduct =
    first && typeof first.type === "object" && first.type ? (first.type as AccessoryType).name : null;
  const typeNameResolved =
    typeNameFromProduct || (await fetchAccessoryTypeName(type)) || "الأكسسوارات";

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <nav className="mb-4 text-xs text-slate-500 sm:text-sm">
          <Link href="/" className="hover:text-blue-600">
            الرئيسية
          </Link>
          <span className="mx-1">/</span>
          <Link href="/accessories" className="hover:text-blue-600">
            أنواع الأكسسوارات
          </Link>
          <span className="mx-1">/</span>
          <span className="text-slate-800 font-medium truncate max-w-[180px] align-middle sm:max-w-none inline-block">
            {typeNameResolved}
          </span>
        </nav>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {typeNameResolved}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            جميع الأكسسوارات المُصنَّفة تحت هذا النوع، بما فيها المرتبطة بموديلات محددة إن وُجدت.
          </p>
        </header>

        {accessories.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            لا توجد منتجات في هذا النوع حالياً.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {accessories.map((a) => (
              <article
                key={a._id}
                className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:rounded-[1.25rem]"
              >
                {/* منطقة الصورة مع الشارات فوقها (مثل بطاقة الهاتف) */}
                <div className="relative flex min-h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:min-h-[130px] sm:py-4">
                  <ProductImage
                    src={
                      a.image ||
                      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80"
                    }
                    alt={a.name}
                    priority={false}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full max-w-[100px] object-contain sm:max-w-[130px]"
                  />
                  {/* شارة النوع */}
                  <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                    أكسسوارات
                  </span>
                  {/* أيقونة المفضلة */}
                  <button
                    type="button"
                    aria-label="إضافة للمفضلة"
                    className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                  >
                    <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* المحتوى مثل بطاقة الهاتف */}
                <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                  <h2 className="mb-2 text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                    {a.name}
                  </h2>

                  <p className="mb-2 line-clamp-2 text-center text-xs text-slate-500 sm:text-sm">
                    {a.details || "أكسسوار متوفر للطلب."}
                  </p>

                  {a.price != null && a.price > 0 ? (
                    <p className="mb-2 text-center">
                      <span className="text-xl font-black text-slate-900 sm:text-2xl">
                        {formatDzd(a.price)}
                      </span>
                      <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                    </p>
                  ) : (
                    <p className="mb-2 text-center text-sm font-semibold text-slate-400">— DA</p>
                  )}

                  <ProductCardActions
                    id={a._id}
                    name={a.name}
                    price={a.price ?? 0}
                    image={a.image ?? ""}
                    colors={Array.isArray(a.colors) ? a.colors : []}
                    options={Array.isArray(a.options) ? a.options : []}
                    category="أكسسوارات"
                  />
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

