"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND_OFFICIAL_LOGOS } from "@/lib/brandLogos";
import { getProductImageUrl } from "@/lib/productImage";
import { publicFetch } from "@/lib/publicFetch";

const STATIC_BRANDS = [
  { id: "apple", name: "Apple", image: BRAND_OFFICIAL_LOGOS.apple, popularity: 100 },
  { id: "samsung", name: "Samsung", image: BRAND_OFFICIAL_LOGOS.samsung, popularity: 98 },
  { id: "xiaomi", name: "Xiaomi", image: BRAND_OFFICIAL_LOGOS.xiaomi, popularity: 85 },
  { id: "oppo", name: "Oppo", image: BRAND_OFFICIAL_LOGOS.oppo, popularity: 75 },
  { id: "huawei", name: "Huawei", image: BRAND_OFFICIAL_LOGOS.huawei, popularity: 80 },
  { id: "infinix", name: "Infinix", image: BRAND_OFFICIAL_LOGOS.infinix, popularity: 65 },
  { id: "google", name: "Google", image: BRAND_OFFICIAL_LOGOS.google, popularity: 70 },
  { id: "realme", name: "Realme", image: BRAND_OFFICIAL_LOGOS.realme, popularity: 68 },
  { id: "oneplus", name: "OnePlus", image: BRAND_OFFICIAL_LOGOS.oneplus, popularity: 72 },
  { id: "redmi", name: "Redmi", image: BRAND_OFFICIAL_LOGOS.redmi, popularity: 82 },
  { id: "motorola", name: "Motorola", image: BRAND_OFFICIAL_LOGOS.motorola, popularity: 60 },
  { id: "vivo", name: "Vivo", image: BRAND_OFFICIAL_LOGOS.vivo, popularity: 62 },
  { id: "tecno", name: "Tecno", image: BRAND_OFFICIAL_LOGOS.tecno, popularity: 55 },
  { id: "nokia", name: "Nokia", image: BRAND_OFFICIAL_LOGOS.nokia, popularity: 50 },
  { id: "honor", name: "Honor", image: BRAND_OFFICIAL_LOGOS.honor, popularity: 58 },
];

type BrandRow = { id: string; name: string; image: string; popularity?: number };

function mergeBrandsFromApi(
  apiList: { name?: string; slug?: string; image?: string }[] | null
): BrandRow[] {
  if (!apiList || !Array.isArray(apiList) || apiList.length === 0) {
    return STATIC_BRANDS;
  }
  const fromApi: BrandRow[] = apiList
    .filter((b) => b?.name && String(b.name).trim())
    .map((b) => {
      const slug = String(b.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      const id = slug || String(b.name).toLowerCase().replace(/\s+/g, "-");
      const name = String(b.name).trim();
      const custom = b.image && String(b.image).trim() ? getProductImageUrl(b.image) : "";
      const fallback = (id && (BRAND_OFFICIAL_LOGOS as Record<string, string>)[id]) || BRAND_OFFICIAL_LOGOS[slug] || "/LOGO.jpeg";
      return { id, name, image: custom || fallback, popularity: 50 };
    });
  const apiIds = new Set(fromApi.map((b) => b.id));
  const fromStatic = STATIC_BRANDS.filter((b) => !apiIds.has(b.id));
  return [...fromApi, ...fromStatic].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

type BrandGridProps = {
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null) => void;
  category?: "phones" | "accessories" | "spare-parts";
  /** عنوان القسم (الافتراضي: نفس الصفحة الرئيسية) */
  sectionTitle?: string;
  /** وصف تحت العنوان */
  sectionSubtitle?: string;
};

export function BrandGrid({
  selectedBrandId,
  onSelectBrand,
  category,
  sectionTitle,
  sectionSubtitle,
}: BrandGridProps) {
  const [brands, setBrands] = useState<BrandRow[]>(STATIC_BRANDS);
  const router = useRouter();

  useEffect(() => {
    publicFetch("/api/brands", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBrands(mergeBrandsFromApi(data));
        }
      })
      .catch(() => {});
  }, []);

  const handleClick = (brandId: string) => {
    const next = selectedBrandId === brandId ? null : brandId;
    onSelectBrand(next);
    const path = category
      ? `/brand/${brandId}/${category}`
      : `/brand/${brandId}/models`;
    router.push(path);
  };

  return (
    <section className="mb-10 sm:mb-16">
      {/* عنوان القسم */}
      <div className="mb-5 flex items-center justify-between px-1 sm:mb-8">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 sm:text-2xl">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-500 to-yellow-400 sm:h-7 sm:w-1.5" />
            {sectionTitle ?? "الماركات العالمية"}
          </h2>
          <p className="mt-1 text-[11px] text-slate-400 sm:text-sm">
            {sectionSubtitle ?? "أشهر الماركات في مكان واحد"}
          </p>
        </div>
      </div>

      {/* شبكة الماركات — 3 أعمدة موبايل */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {brands.map((brand) => {
          const isSelected = selectedBrandId === brand.id;
          const isPopular = brand.popularity != null && brand.popularity > 80;
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => handleClick(brand.id)}
              className={`group relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-all duration-300 sm:gap-2.5 sm:px-3 sm:py-5 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                  : "border-slate-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md"
              }`}
            >
              {/* بادج شائع */}
              {isPopular && (
                <span className="absolute -top-1.5 end-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[7px] font-bold text-white shadow-sm sm:text-[8px]">
                  🔥
                </span>
              )}

              {/* لوجو الماركة */}
              <div className={`relative flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14 ${
                isSelected ? "" : ""
              }`}>
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>

              {/* اسم الماركة */}
              <span className={`text-[10px] font-semibold leading-tight sm:text-xs ${
                isSelected ? "text-blue-600" : "text-slate-600 group-hover:text-blue-600"
              }`}>
                {brand.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}