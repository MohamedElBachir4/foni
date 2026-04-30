"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Smartphone, Headphones, Wrench, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  {
    id: "phones",
    label: "الهواتف النقالة",
    image: "https://i.pinimg.com/736x/4d/eb/00/4deb0070c186156633bd7888d3b8337b.jpg",
    icon: Smartphone,
    color: "from-blue-600 to-blue-400",
    description: "أحدث الهواتف الذكية",
  },
  {
    id: "accessories",
    label: "اكسسوارات",
    image: "https://i.pinimg.com/736x/fc/7d/03/fc7d035abeb24f90fc3479fc23125c0c.jpg",
    icon: Headphones,
    color: "from-purple-600 to-pink-500",
    description: "اكسسوارات أصلية",
  },
  {
    id: "parts",
    label: "قطع غيار",
    image: "https://i.pinimg.com/1200x/77/ff/dc/77ffdcdbe44f5ee9d537ab5b9880a0f9.jpg",
    icon: Wrench,
    color: "from-green-600 to-emerald-500",
    description: "قطع غيار أصلية",
  },
];

export function CategorySlider() {
  const router = useRouter();

  const handleClick = (catId: string) => {
    const routes: Record<string, string> = {
      phones: "/phones",
      accessories: "/accessories",
      parts: "/spare-parts",
    };
    router.push(routes[catId] || "/");
  };

  return (
    <section className="mb-20">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-4xl font-bold text-gray-800">
          تصفح حسب التصنيف
        </h2>
        <p className="text-gray-500">اكتشف مجموعتنا المتنوعة</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden sm:h-56 lg:h-64">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80`} />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white sm:p-5 lg:p-6">
                  <div className="mb-2 rounded-full bg-white/20 p-2.5 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 sm:mb-3 sm:p-3 lg:mb-4 lg:p-4">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold sm:mb-1.5 sm:text-xl lg:mb-2 lg:text-2xl">{cat.label}</h3>
                  <p className="mb-2 text-sm text-white/90 sm:mb-3 sm:text-base lg:mb-4">{cat.description}</p>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30 sm:gap-2 sm:px-4 sm:py-2">
                    <span>تسوق الآن</span>
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1 sm:h-4 sm:w-4" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}