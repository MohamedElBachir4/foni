import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ModelHubProductGrids } from "@/components/ModelHubProductGrids";
import { ModelHubBackButton } from "@/components/ModelHubBackButton";
import { loadModelHubContext } from "@/lib/loadModelHubContext";

const CATEGORIES = {
  "spare-parts": {
    title: "قطع الغيار",
    description: "جميع قطع الغيار المتوفرة لهذا الموديل.",
  },
  accessories: {
    title: "الإكسسوارات",
    description: "جميع الإكسسوارات المتوافقة مع هذا الموديل.",
  },
  phones: {
    title: "الهواتف",
    description: "جميع الهواتف المسجّلة تحت هذا الموديل.",
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

function isCategoryKey(value: string): value is CategoryKey {
  return value in CATEGORIES;
}

export default async function ModelCategoryProductsPage({
  params,
}: {
  params: Promise<{ brand: string; phoneTypeId: string; category: string }>;
}) {
  const { brand, phoneTypeId, category } = await params;
  if (!isCategoryKey(category)) notFound();

  const ctx = await loadModelHubContext(brand, phoneTypeId);
  const meta = CATEGORIES[category];

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <ModelHubBackButton
          href={`/brand/${ctx.brandParam}/model/${ctx.phoneTypeId}`}
          label={`العودة إلى ${ctx.modelName}`}
        />
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span className="mx-1">/</span>
            <Link href={`/brand/${ctx.brandParam}/models`} className="hover:text-blue-600">
              {ctx.brandName}
            </Link>
            <span className="mx-1">/</span>
            <Link
              href={`/brand/${ctx.brandParam}/model/${ctx.phoneTypeId}`}
              className="hover:text-blue-600"
            >
              {ctx.modelName}
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-slate-700">{meta.title}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {meta.title} — {ctx.modelName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {meta.description}
          </p>
        </header>

        <ModelHubProductGrids
          brandMongoId={ctx.brandMongoId}
          phoneTypeId={ctx.phoneTypeId}
          only={category}
        />
      </main>
      <Footer />
    </div>
  );
}
