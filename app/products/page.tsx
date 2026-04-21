import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/** نفس بطاقات صفحة العلامة التجارية (مثل /brand/apple) مع روابط الكتالوج العام */
const IMG_PHONES =
  "https://i.pinimg.com/736x/e3/f4/a2/e3f4a286400d050bad935c6853879d6e.jpg";
const IMG_ACCESSORIES =
  "https://i.pinimg.com/736x/a1/f6/e2/a1f6e266de71fe64b1eb4a68b91c00ee.jpg";
const IMG_SPARE_PARTS =
  "https://i.pinimg.com/736x/02/c2/62/02c262e51afde8e065fc64aac01eb378.jpg";

export default function ProductsHubPage() {
  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">المنتجات</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            اختر القسم
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            اختر ما تريد استعراضه: الهواتف، الأكسسوارات، أو قطع الغيار.
          </p>
        </header>

        <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <Link
            href="/phones"
            className="group flex flex-col overflow-hidden rounded-2xl border-0 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_PHONES}
                alt="الهواتف النقالة"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                الهواتف النقالة
              </p>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                اكتشف الهواتف المتوفرة لدينا حسب الماركة.
              </p>
            </div>
          </Link>

          <Link
            href="/accessories"
            className="group flex flex-col overflow-hidden rounded-2xl border-0 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_ACCESSORIES}
                alt="الإكسسوارات"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                اكسسوارات
              </p>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                جرابات، شواحن وسماعات لجميع الهواتف.
              </p>
            </div>
          </Link>

          <Link
            href="/spare-parts"
            className="group flex flex-col overflow-hidden rounded-2xl border-0 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_SPARE_PARTS}
                alt="قطع غيار الهواتف"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                قطع غيار الهواتف
              </p>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                شاشات، بطاريات وقطع داخلية حسب الماركة والموديل.
              </p>
            </div>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
