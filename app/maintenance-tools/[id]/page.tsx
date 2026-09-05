import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata, slugifyProductName } from "@/lib/seo";
import { publicFetch } from "@/lib/publicFetch";

export const dynamic = "force-dynamic";

async function fetchTool(id: string) {
  try {
    const res = await publicFetch(`/api/maintenance-tools/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { _id: string; name?: string; description?: string; image?: string };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tool = await fetchTool(id);
  if (!tool) {
    return buildMetadata({
      title: "أداة صيانة | Foni",
      path: `/maintenance-tools/${id}`,
    });
  }
  const slug = slugifyProductName(tool.name || "tool");
  return buildMetadata({
    title: `${tool.name} | أدوات الصيانة`,
    description: tool.description?.trim() || `تفاصيل ${tool.name} في متجر Foni`,
    path: `/product/${tool._id}/${slug}`,
    image: tool.image || "/LOGO.jpeg",
  });
}

/** توجيه إلى صفحة المنتج الموحدة (نفس تجربة باقي المنتجات) */
export default async function MaintenanceToolDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await fetchTool(id);
  if (!tool) notFound();
  redirect(`/product/${tool._id}/${slugifyProductName(tool.name || "tool")}`);
}
