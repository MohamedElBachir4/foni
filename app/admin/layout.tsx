/** لوحة التحكم: لا تُولَّد مسبقاً ولا تُخزَّن — تتجنب 404/تعارض بعد النشر */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
