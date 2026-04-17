"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_OFFICIAL_LOGOS } from "@/lib/brandLogos";

const BRANDS = [
  { id: "apple", name: "Apple", image: BRAND_OFFICIAL_LOGOS.apple },
  { id: "samsung", name: "Samsung", image: BRAND_OFFICIAL_LOGOS.samsung },
  { id: "xiaomi", name: "Xiaomi", image: BRAND_OFFICIAL_LOGOS.xiaomi },
  { id: "oppo", name: "Oppo", image: BRAND_OFFICIAL_LOGOS.oppo },
  { id: "huawei", name: "Huawei", image: BRAND_OFFICIAL_LOGOS.huawei },
  { id: "infinix", name: "Infinix", image: BRAND_OFFICIAL_LOGOS.infinix },
  { id: "google", name: "Google", image: BRAND_OFFICIAL_LOGOS.google },
  { id: "realme", name: "Realme", image: BRAND_OFFICIAL_LOGOS.realme },
  { id: "oneplus", name: "OnePlus", image: BRAND_OFFICIAL_LOGOS.oneplus },
  { id: "redmi", name: "Redmi", image: BRAND_OFFICIAL_LOGOS.redmi },
  { id: "motorola", name: "Motorola", image: BRAND_OFFICIAL_LOGOS.motorola },
  { id: "vivo", name: "Vivo", image: BRAND_OFFICIAL_LOGOS.vivo },
  { id: "ace", name: "Ace", image: BRAND_OFFICIAL_LOGOS.ace },
  { id: "tecno", name: "Tecno", image: BRAND_OFFICIAL_LOGOS.tecno },
  { id: "nokia", name: "Nokia", image: BRAND_OFFICIAL_LOGOS.nokia },
  { id: "lg", name: "LG", image: BRAND_OFFICIAL_LOGOS.lg },
  { id: "condor", name: "Condor", image: BRAND_OFFICIAL_LOGOS.condor },
  { id: "itel", name: "Itel", image: BRAND_OFFICIAL_LOGOS.itel },
  { id: "honor", name: "Honor", image: BRAND_OFFICIAL_LOGOS.honor },
  { id: "poco", name: "Poco", image: BRAND_OFFICIAL_LOGOS.poco },
];

type BrandGridProps = {
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null) => void;
  /** عند التحديد: الانتقال مباشرة إلى قسم الماركة (هواتف/اكسسوارات/قطع غيار). غير مُمرّر = صفحة الماركة فقط (من الماركات المتوفرة) */
  category?: "phones" | "accessories" | "spare-parts";
};

export function BrandGrid({ selectedBrandId, onSelectBrand, category }: BrandGridProps) {
  const [shimmerId, setShimmerId] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = (brandId: string) => {
    const next = selectedBrandId === brandId ? null : brandId;
    onSelectBrand(next);
    setShimmerId(brandId);
    setTimeout(() => setShimmerId(null), 1000);
    const path = category ? `/brand/${brandId}/${category}` : `/brand/${brandId}`;
    router.push(path);
  };

  return (
    <section className="mb-20">
      <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-800">
        <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
        الماركات المتوفرة
      </h2>
      

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {BRANDS.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => handleClick(brand.id)}
            className={`brand-card group cursor-pointer rounded-2xl border-2 p-4 text-center shadow-lg backdrop-blur-sm transition-all hover-lift ${
              selectedBrandId === brand.id
                ? "active border-blue-600 bg-gradient-to-br from-blue-600 to-blue-400 text-white"
                : "border-transparent bg-white/80 hover:border-blue-400 hover:shadow-2xl"
            } ${shimmerId === brand.id ? "shimmer" : ""}`}
          >
            <div className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl p-2 transition-transform group-hover:scale-110 ${
              selectedBrandId === brand.id
                ? "bg-white/20"
                : "bg-gradient-to-br from-blue-50 to-blue-100"
            }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.image}
                alt={brand.name}
                className={`h-full w-full object-contain ${
                  selectedBrandId === brand.id ? "brightness-0 invert" : ""
                }`}
              />
            </div>
            <span className={`font-bold ${
              selectedBrandId === brand.id ? "text-white" : "text-gray-700"
            }`}>
              {brand.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
