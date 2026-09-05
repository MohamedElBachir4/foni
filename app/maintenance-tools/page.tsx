import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MaintenanceToolsGrid } from "@/components/maintenance/MaintenanceToolsGrid";
import { buildMetadata } from "@/lib/seo";
import { publicFetch } from "@/lib/publicFetch";

type MaintenanceTool = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "أدوات الصيانة | متجر Foni",
  description:
    "تصفح أدوات الصيانة المتوفرة في متجر Foni مع صور ووصف واضح لكل أداة.",
  path: "/maintenance-tools",
});

async function fetchTools(): Promise<MaintenanceTool[]> {
  try {
    const res = await publicFetch("/api/maintenance-tools", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function MaintenanceToolsPage() {
  const tools = await fetchTools();

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-blue-600">
              المنتجات
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-700">أدوات الصيانة</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            أدوات الصيانة
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            استعرض أدوات الصيانة المتوفرة مع الصور والوصف.
          </p>
        </header>

        {tools.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            لا توجد أدوات صيانة مضافة بعد.
          </p>
        ) : (
          <MaintenanceToolsGrid tools={tools} />
        )}
      </main>
      <Footer />
    </div>
  );
}
