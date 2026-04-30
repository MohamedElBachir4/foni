"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
              <div className="relative h-64 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80`} />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-12 w-12" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">{cat.label}</h3>
                  <p className="mb-4 text-white/90">{cat.description}</p>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                    <span>تسوق الآن</span>
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
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