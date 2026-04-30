import Link from "next/link";
import { notFound } from "next/navigation";
import { Smartphone, Headphones, Wrench, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const MONGO_ID = /^[a-f0-9]{24}$/i;

type PhoneTypeOne = {
  _id: string;
  name: string;
  image?: string;
  brand?: { _id: string; name: string; slug?: string } | null;
};

function brandParamMatchesPhoneType(brandParam: string, pt: PhoneTypeOne) {
  const b = pt.brand;
  if (!b) return true;
  const slug = (b.slug || "").toLowerCase().trim();
  if (slug && slug === brandParam) return true;
  const name = (b.name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return name === brandParam;
}

export default async function ModelHubPage({
  params,
}: {
  params: Promise<{ brand: string; phoneTypeId: string }>;
}) {
  const { brand, phoneTypeId } = await params;
  const brandParam = brand.toLowerCase();
  if (!MONGO_ID.test(phoneTypeId)) notFound();

  let pt: PhoneTypeOne | null = null;
  try {
    const res = await fetch(`${API_URL}/api/phone-types/${phoneTypeId}`, {
      cache: "no-store",
    });
    if (!res.ok) notFound();
    pt = (await res.json()) as PhoneTypeOne;
  } catch {
    notFound();
  }
  if (!pt || !pt.brand?._id) notFound();
  if (!brandParamMatchesPhoneType(brandParam, pt)) notFound();

  const brandName = pt.brand?.name ?? brandParam;
  const modelName = pt.name;
  const brandMongoId = pt.brand._id;

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <Link href={`/brand/${brandParam}/models`} className="hover:text-blue-600">
              {brandName}
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">{modelName}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            اختر القسم — {modelName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            اختر ما تريد استعراضه لهذا الموديل: الهواتف النقّالة، الأكسسوارات، أو قطع الغيار.
          </p>
        </header>

        <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/brand/${brandParam}/phones?phoneType=${phoneTypeId}`}
            className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-64 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pinimg.com/736x/e3/f4/a2/e3f4a286400d050bad935c6853879d6e.jpg"
                alt={`هواتف ${modelName}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                  <Smartphone className="h-12 w-12" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">الهواتف النقّالة</h3>
                <p className="mb-4 text-white/90">هواتف متوافقة مع هذا الموديل.</p>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                  <span>تسوق الآن</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/brand/${brandParam}/accessories?phoneType=${phoneTypeId}`}
            className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-64 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pinimg.com/736x/a1/f6/e2/a1f6e266de71fe64b1eb4a68b91c00ee.jpg"
                alt={`أكسسوارات ${modelName}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600 to-pink-500 opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                  <Headphones className="h-12 w-12" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">اكسسوارات</h3>
                <p className="mb-4 text-white/90">جرابات وشواحن وغيرها المرتبطة بهذا الموديل.</p>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                  <span>تسوق الآن</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/spare-parts/${brandMongoId}/${phoneTypeId}`}
            className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-64 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pinimg.com/736x/02/c2/62/02c262e51afde8e065fc64aac01eb378.jpg"
                alt={`قطع غيار ${modelName}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-600 to-emerald-500 opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                  <Wrench className="h-12 w-12" />
                </div>
                <h3 className="mb-2 text-2xl font-bold">قطع غيار الهواتف</h3>
                <p className="mb-4 text-white/90">شاشات، بطاريات وقطع لهذا الموديل.</p>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                  <span>تسوق الآن</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
