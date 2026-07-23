import Link from "next/link";
import { NotFoundRecovery } from "@/components/NotFoundRecovery";

/**
 * صفحة 404 مخصّصة — مع محاولة استعادة واحدة عند 404 زائف بعد التنقّل soft / نشر جديد.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <NotFoundRecovery />
      <p className="text-6xl font-extrabold tracking-tight text-slate-300">404</p>
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">الصفحة غير موجودة</h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
        قد يكون الرابط غير صحيح، أو أن الصفحة نُقلت. إن ظهرت هذه الرسالة بالخطأ أثناء التصفح،
        أعد تحميل الصفحة.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          العودة للرئيسية
        </Link>
        <a
          href="."
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          إعادة التحميل
        </a>
      </div>
    </div>
  );
}
