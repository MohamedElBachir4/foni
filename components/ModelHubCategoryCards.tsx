import Link from "next/link";
import Image from "next/image";
import { Smartphone, Headphones, Wrench } from "lucide-react";

const CATEGORIES = [
  {
    id: "phones",
    label: "الهواتف",
    description: "هواتف هذا الموديل",
    image: "https://i.pinimg.com/736x/4d/eb/00/4deb0070c186156633bd7888d3b8337b.jpg",
    icon: Smartphone,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "accessories",
    label: "اكسسوارات",
    description: "إكسسوارات متوافقة",
    image: "https://i.pinimg.com/736x/fc/7d/03/fc7d035abeb24f90fc3479fc23125c0c.jpg",
    icon: Headphones,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "spare-parts",
    label: "قطع غيار",
    description: "قطع متوفرة للموديل",
    image: "https://i.pinimg.com/1200x/77/ff/dc/77ffdcdbe44f5ee9d537ab5b9880a0f9.jpg",
    icon: Wrench,
    color: "from-emerald-500 to-green-700",
  },
] as const;

export function ModelHubCategoryCards({
  brandParam,
  phoneTypeId,
}: {
  brandParam: string;
  phoneTypeId: string;
}) {
  const base = `/brand/${brandParam}/model/${phoneTypeId}`;

  return (
    <section>
      <div className="mb-5 px-1 sm:mb-7">
        <h2 className="text-base font-bold text-slate-800 sm:text-xl">تصفح حسب التصنيف</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">اختر القسم لعرض المنتجات</p>
      </div>

      {/* موبايل: دوائر أكبر وأوضح من الصفحة الرئيسية */}
      <div className="flex justify-center gap-5 sm:hidden">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              href={`${base}/${cat.id}`}
              className="flex w-[30%] max-w-[7.5rem] flex-col items-center gap-2.5"
            >
              <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full shadow-md ring-2 ring-offset-2 ring-blue-200 transition-transform active:scale-95">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${cat.color} opacity-55`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-9 w-9 text-white drop-shadow-md" strokeWidth={2.2} />
                </div>
              </div>
              <span className="text-center text-sm font-bold leading-tight text-slate-800">
                {cat.label}
              </span>
              <span className="text-center text-[10px] font-medium leading-snug text-slate-500">
                {cat.description}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ديسكتوب: بطاقات أوضح مع عنوان ووصف */}
      <div className="hidden grid-cols-3 gap-4 sm:grid lg:gap-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              href={`${base}/${cat.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-36 overflow-hidden lg:h-44">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/25 p-3.5 backdrop-blur-sm">
                    <Icon className="h-8 w-8 text-white lg:h-9 lg:w-9" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3.5 text-center">
                <h3 className="text-base font-bold text-slate-800 lg:text-lg">{cat.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
