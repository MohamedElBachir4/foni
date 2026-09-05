import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Smartphone, Headphones, Wrench, Hammer } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "المنتجات | هواتف واكسسوارات وقطع غيار وأدوات صيانة في الجزائر",
  description:
    "استعرض جميع أقسام المنتجات في متجر Foni: الهواتف النقالة، الاكسسوارات، قطع الغيار، وأدوات الصيانة في الجزائر.",
  path: "/products",
});

const CATEGORIES = [
  {
    href: "/phones",
    label: "الهواتف",
    description: "تصفح الماركات والموديلات",
    image: "https://i.pinimg.com/736x/4d/eb/00/4deb0070c186156633bd7888d3b8337b.jpg",
    icon: Smartphone,
    color: "from-blue-500 to-blue-700",
  },
  {
    href: "/accessories",
    label: "اكسسوارات",
    description: "شواحن، حافظات والمزيد",
    image: "https://i.pinimg.com/736x/fc/7d/03/fc7d035abeb24f90fc3479fc23125c0c.jpg",
    icon: Headphones,
    color: "from-purple-500 to-pink-600",
  },
  {
    href: "/spare-parts",
    label: "قطع غيار",
    description: "اختر الماركة ثم الموديل",
    image: "https://i.pinimg.com/1200x/77/ff/dc/77ffdcdbe44f5ee9d537ab5b9880a0f9.jpg",
    icon: Wrench,
    color: "from-emerald-500 to-green-700",
  },
  {
    href: "/maintenance-tools",
    label: "أدوات الصيانة",
    description: "أدوات ومعدات الصيانة",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
    icon: Hammer,
    color: "from-amber-500 to-orange-700",
  },
] as const;

export default function ProductsHubPage() {
  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">المنتجات</span>
          </nav>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">اختر القسم</h1>
          <p className="mt-1 text-sm text-slate-500">
            هواتف، اكسسوارات، قطع غيار، أو أدوات صيانة
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-4 sm:hidden">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex w-[42%] max-w-[9rem] flex-col items-center gap-2.5"
              >
                <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full shadow-md ring-2 ring-offset-2 ring-blue-200 transition-transform active:scale-95">
                  <Image src={cat.image} alt={cat.label} fill sizes="88px" className="object-cover" />
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

        <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-4 lg:gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-36 overflow-hidden lg:h-44">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
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
                  <h2 className="text-base font-bold text-slate-800 lg:text-lg">{cat.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
