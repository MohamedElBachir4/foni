import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
            تواصل معنا
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            نحن هنا للإجابة عن استفساراتك، الطلبات، والتعاون التجاري. لا تتردد
            في مراسلتنا أو الاتصال بنا.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              معلومات الاتصال
            </h2>
            <ul className="space-y-5 text-slate-700">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <span>الجزائر العاصمة · أونلاين</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                <a
                  href="tel:+213542458175"
                  className="transition hover:text-blue-600"
                  dir="ltr"
                >
                  +213 542 45 81 75
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-blue-500" />
                <a
                  href="mailto:Walid.walass@gmail.com"
                  className="break-all transition hover:text-blue-600"
                >
                  Walid.walass@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-blue-500" />
                <span>متاحون على مدار الساعة 24/24</span>
              </li>
            </ul>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    البيع بالجملة والتعاون
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    لطلبات الجملة والشراكات، أنشئ حساب تاجر أو صاحب محل وفعّل
                    «الشراء بالجملة» من ملفك بعد الموافقة.
                  </p>
                  <Link
                    href="/accounts"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-l from-blue-600 to-blue-400 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
                  >
                    إرسال طلب بالجملة
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              نفضّل الرد السريع عبر الهاتف أو البريد الإلكتروني. يمكنك أيضاً
              تصفح{" "}
              <Link href="/products" className="font-semibold text-blue-600 hover:underline">
                المنتجات
              </Link>{" "}
              أو{" "}
              <Link href="/services" className="font-semibold text-blue-600 hover:underline">
                خدماتنا
              </Link>{" "}
              قبل التواصل.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
