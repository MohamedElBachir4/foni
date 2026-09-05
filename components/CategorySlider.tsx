"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Smartphone, Headphones, Wrench, Hammer } from "lucide-react";

const CATEGORIES = [
  {
    id: "phones",
    label: "الهواتف",
    image: "https://i.pinimg.com/736x/4d/eb/00/4deb0070c186156633bd7888d3b8337b.jpg",
    icon: Smartphone,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "accessories",
    label: "اكسسوارات",
    image: "https://i.pinimg.com/736x/fc/7d/03/fc7d035abeb24f90fc3479fc23125c0c.jpg",
    icon: Headphones,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "parts",
    label: "قطع غيار",
    image: "https://i.pinimg.com/1200x/77/ff/dc/77ffdcdbe44f5ee9d537ab5b9880a0f9.jpg",
    icon: Wrench,
    color: "from-emerald-500 to-green-700",
  },
  {
    id: "maintenance",
    label: "أدوات الصيانة",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
    icon: Hammer,
    color: "from-amber-500 to-orange-700",
  },
];

type CategorySliderProps = {
  heading?: string;
  className?: string;
};

export function CategorySlider({
  heading = "تصفح حسب التصنيف",
  className = "mb-8 sm:mb-12",
}: CategorySliderProps = {}) {
  const router = useRouter();

  const routes: Record<string, string> = {
    phones: "/phones",
    accessories: "/accessories",
    parts: "/spare-parts",
    maintenance: "/maintenance-tools",
  };

  return (
    <section className={className}>
      {/* عنوان القسم */}
      <div className="mb-4 flex items-center justify-between px-1 sm:mb-6">
        <h2 className="text-base font-bold text-slate-800 sm:text-xl">{heading}</h2>
      </div>

      {/* موبايل: التصنيفات الأربعة في سطر واحد */}
      <div className="flex flex-nowrap items-start justify-between gap-1.5 px-0.5 sm:hidden">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => router.push(routes[cat.id] || "/")}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-offset-1 ring-blue-100 transition-transform active:scale-95">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${cat.color} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-white drop-shadow" strokeWidth={2} />
                </div>
              </div>
              <span className="w-full text-center text-[10px] font-semibold leading-tight text-slate-700">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ديسكتوب: بطاقات أفقية كبيرة */}
      <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-4 lg:gap-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => router.push(routes[cat.id] || "/")}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden lg:h-52">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-75`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                    <Icon className="h-7 w-7 lg:h-9 lg:w-9" />
                  </div>
                  <span className="text-base font-bold lg:text-lg">{cat.label}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
