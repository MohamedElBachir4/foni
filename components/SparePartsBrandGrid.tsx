"use client";

import { useRouter } from "next/navigation";
import { getOfficialBrandLogo } from "@/lib/brandLogos";

type Brand = { _id: string; name: string; image?: string; slug?: string };

type SparePartsBrandGridProps = {
  brands: Brand[];
};

export function SparePartsBrandGrid({ brands }: SparePartsBrandGridProps) {
  const router = useRouter();

  const handleClick = (brandId: string) => {
    router.push(`/spare-parts/${brandId}`);
  };

  if (brands.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
        لا توجد ماركات مضافة بعد.
      </p>
    );
  }

  return (
    <section className="mb-20">
      <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-800">
        <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
        الماركات المتوفرة
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {brands.map((brand) => {
          const logoUrl = getOfficialBrandLogo(brand.name, brand.image);
          return (
            <button
              key={brand._id}
              type="button"
              onClick={() => handleClick(brand._id)}
              className="brand-card group cursor-pointer rounded-2xl border-2 border-transparent bg-white/80 p-4 text-center shadow-lg backdrop-blur-sm transition-all hover:border-blue-400 hover:shadow-2xl"
            >
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-2 transition-transform group-hover:scale-110">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={brand.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-700">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="font-bold text-gray-700">{brand.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
