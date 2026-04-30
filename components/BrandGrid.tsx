"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_OFFICIAL_LOGOS } from "@/lib/brandLogos";
import { getProductImageUrl } from "@/lib/productImage";
import { Award, TrendingUp } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

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
};

export function BrandGrid({ selectedBrandId, onSelectBrand, category }: BrandGridProps) {
  const [brands, setBrands] = useState<BrandRow[]>(STATIC_BRANDS);
  const router = useRouter();

  useEffect(() => {
    const url = API_BASE ? `${API_BASE}/api/brands` : "/api/brands";
    fetch(url, { cache: "no-store" })
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
    <section className="mb-20">
      <div className="mb-10 text-center">
        <h2 className="mb-3 flex items-center justify-center gap-3 text-4xl font-bold text-gray-800">
          <Award className="h-8 w-8 text-yellow-500" />
          <span>الماركات العالمية</span>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </h2>
        <p className="text-gray-500">أشهر الماركات في مكان واحد بأسعار تنافسية</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {brands.map((brand, index) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => handleClick(brand.id)}
            className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-center transition-all duration-500 hover:shadow-2xl animate-fade-in-up cursor-pointer ${
              selectedBrandId === brand.id
                ? "border-blue-600 bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl"
                : "border-gray-100 bg-white hover:border-blue-400 hover:-translate-y-2"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center transition-all duration-300 group-hover:scale-110">
              <img
                src={brand.image}
                alt={brand.name}
                className={`h-16 w-16 object-contain transition-all duration-300 ${
                  selectedBrandId === brand.id ? "brightness-0 invert" : ""
                }`}
              />
            </div>
            <span className={`font-bold transition-colors ${
              selectedBrandId === brand.id ? "text-white" : "text-gray-800 group-hover:text-blue-600"
            }`}>
              {brand.name}
            </span>
            
            {/* Popularity Badge */}
            {brand.popularity && brand.popularity > 80 && (
              <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-white">
                شائع
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}