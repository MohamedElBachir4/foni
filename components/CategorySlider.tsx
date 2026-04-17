"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  {
    id: "phones",
    label: "الهواتف النقالة",
    image: "https://i.pinimg.com/736x/e3/f4/a2/e3f4a286400d050bad935c6853879d6e.jpg",
  },
  {
    id: "accessories",
    label: "اكسسوارات",
    image: "https://i.pinimg.com/736x/a1/f6/e2/a1f6e266de71fe64b1eb4a68b91c00ee.jpg",
  },
  {
    id: "parts",
    label: "قطع غيار الهواتف",
    image: "https://i.pinimg.com/736x/02/c2/62/02c262e51afde8e065fc64aac01eb378.jpg",
  },
];

export function CategorySlider() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <section className="mb-14">
      <div className="mb-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800 sm:text-3xl">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400 sm:h-8 sm:w-1.5" />
          تصفح حسب التصنيف
        </h2>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 sm:gap-8 lg:gap-10">
        {CATEGORIES.map((cat) => {
          const isActive = activeId === cat.id;
          const handleClick = () => {
            if (cat.id === "phones") {
              router.push("/phones");
              return;
            }
            if (cat.id === "accessories") {
              router.push("/accessories");
              return;
            }
            if (cat.id === "parts") {
              router.push("/spare-parts");
              return;
            }
            setActiveId(isActive ? null : cat.id);
          };
          return (
            <button
              key={cat.id}
              type="button"
              onClick={handleClick}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md cursor-pointer ${
                isActive
                  ? "border-blue-400 bg-blue-50/40"
                  : "border-slate-200"
              }`}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="px-2 py-2 text-center">
                <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                  {cat.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
