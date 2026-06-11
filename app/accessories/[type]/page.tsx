import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandAccessoriesList } from "@/components/BrandAccessoriesList";
import { publicFetch } from "@/lib/publicFetch";

type AccessoryType = { _id: string; name: string };

type Accessory = {
  _id: string;
  name: string;
  type?: AccessoryType | string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
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
          <BrandAccessoriesList
            accessories={accessories}
            apiPath={`/api/accessories?type=${encodeURIComponent(type)}`}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

