import type { Metadata } from "next";
import { SearchView } from "./SearchView";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const p = await searchParams;
  const q = (p.q || "").trim();
  return {
    title: q ? `نتائج البحث عن ${q}` : "البحث",
    description: q
      ? `نتائج البحث عن ${q} — هواتف، موديلات، أكسسوارات، قطع غيار`
      : "البحث في متجر FONI",
  };
}

export default function SearchPage() {
  return <SearchView />;
}
