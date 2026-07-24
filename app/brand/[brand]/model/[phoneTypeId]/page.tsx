import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ModelHubProductGrids } from "@/components/ModelHubProductGrids";
import { publicFetch } from "@/lib/publicFetch";
import { logServerError } from "@/lib/serverLog";

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

  // فشل الشبكة/5xx ≠ «غير موجود» — وإلا يظهر 404 متقطع أثناء التنقّل على LTE
  let res: Response;
  try {
    res = await publicFetch(`/api/phone-types/${phoneTypeId}`, {
      cache: "no-store",
    });
  } catch (err) {
    logServerError(err, {
      route: "app/brand/[brand]/model/[phoneTypeId]/page.tsx",
      pathname: `/brand/${brandParam}/model/${phoneTypeId}`,
      params: { brand: brandParam, phoneTypeId },
      extra: { stage: "fetch-throw" },
    });
    throw new Error("تعذّر الاتصال بالخادم أثناء تحميل الموديل");
  }
  if (res.status === 404) notFound();
  if (!res.ok) {
    logServerError(new Error(`upstream ${res.status} for /api/phone-types/${phoneTypeId}`), {
      route: "app/brand/[brand]/model/[phoneTypeId]/page.tsx",
      pathname: `/brand/${brandParam}/model/${phoneTypeId}`,
      params: { brand: brandParam, phoneTypeId },
      extra: { stage: "non-ok-response", status: res.status },
    });
    throw new Error(`تعذّر تحميل الموديل (HTTP ${res.status})`);
  }
  const pt = (await res.json()) as PhoneTypeOne;
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
            {modelName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            كل المنتجات المرتبطة بهذا الموديل في صفحة واحدة: الهواتف ثم قطع الغيار ثم الإكسسوارات.
          </p>
        </header>

        <ModelHubProductGrids brandMongoId={brandMongoId} phoneTypeId={phoneTypeId} />
      </main>
      <Footer />
    </div>
  );
}
