import { redirect } from "next/navigation";

/** التدفق الجديد: الماركة → موديلات الهواتف (وليس اختيار القسم مباشرة) */
export default async function BrandEntryPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  redirect(`/brand/${brand.toLowerCase()}/models`);
}
