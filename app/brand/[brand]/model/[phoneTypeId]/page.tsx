import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ModelHubCategoryCards } from "@/components/ModelHubCategoryCards";
import { ModelHubBackButton } from "@/components/ModelHubBackButton";
import { loadModelHubContext } from "@/lib/loadModelHubContext";

export default async function ModelHubPage({
  params,
}: {
  params: Promise<{ brand: string; phoneTypeId: string }>;
}) {
  const { brand, phoneTypeId } = await params;
  const ctx = await loadModelHubContext(brand, phoneTypeId);

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <ModelHubBackButton
          href={`/brand/${ctx.brandParam}/models`}
          label={`العودة إلى موديلات ${ctx.brandName}`}
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
            <span className="font-medium text-slate-700">{ctx.modelName}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {ctx.modelName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            اختر القسم لعرض كل المنتجات المرتبطة بهذا الموديل.
          </p>
        </header>

        <ModelHubCategoryCards brandParam={ctx.brandParam} phoneTypeId={ctx.phoneTypeId} />
      </main>
      <Footer />
    </div>
  );
}
