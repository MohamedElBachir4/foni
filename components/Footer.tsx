"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-32">
      <div className="absolute left-0 top-0 w-full -translate-y-full overflow-hidden">
        <svg
          className="relative block h-12 w-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white opacity-90"
          />
        </svg>
      </div>

      <div className="rounded-[40px] border border-white/30 bg-white p-12 shadow-2xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Link
                href="/"
                className="group flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40 bg-gradient-to-br from-blue-600 to-blue-400 shadow-xl transition-all duration-300 hover:scale-105 hover:border-white/60 hover:shadow-2xl"
                aria-label="العودة إلى الصفحة الرئيسية"
              >
                <Image
                  src="/LOGO.jpeg"
                  alt="FONI"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  priority
                />
              </Link>
              <span className="bg-gradient-to-l from-blue-600 to-blue-400 bg-clip-text text-3xl font-black text-transparent">
                FONI
              </span>
            </div>
            <div className="mb-6 space-y-1.5 leading-relaxed text-gray-700">
              <p className="text-lg font-extrabold text-slate-900">عالم الهواتف بين يديك</p>
              <p className="font-semibold text-gray-700">بيع، صيانة، وتجهيز</p>
              <p className="text-gray-600">هواتف ذكية، إكسسوارات، وقطع غيار أصلية في مكان واحد</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white"
              >
                <span className="text-xl">💬</span>
              </Link>
              <Link
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white"
              >
                <span className="text-xl">♪</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="relative mb-6 inline-block text-xl font-bold text-gray-800">
              روابط سريعة
              <span className="absolute bottom-0 right-0 h-1 w-12 rounded-full bg-gradient-to-l from-blue-600 to-blue-400" />
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="group flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 transition-all group-hover:w-3" />
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/products" className="group flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 transition-all group-hover:w-3" />
                  المنتجات
                </Link>
              </li>
              <li>
                <Link href="/services" className="group flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 transition-all group-hover:w-3" />
                  خدماتنا
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 transition-all group-hover:w-3" />
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link href="#" className="group flex items-center gap-2 text-gray-600 transition hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 transition-all group-hover:w-3" />
                  الأسئلة الشائعة
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="relative mb-6 inline-block text-xl font-bold text-gray-800">
              معلومات الاتصال
              <span className="absolute bottom-0 right-0 h-1 w-12 rounded-full bg-gradient-to-l from-blue-600 to-blue-400" />
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-blue-500" />
                <span className="text-gray-600">
                  
                   الجزائر العاصمة . اونلاين
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <span className="text-gray-600" dir="ltr">
                   +213 542 45 81 75 
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <a
                  href="mailto:Walid.walass@gmail.com"
                  className="text-gray-600 transition hover:text-blue-600"
                >
                  Walid.walass@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-gray-600">
                  24/24
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="relative mb-6 inline-block text-xl font-bold text-gray-800">
              النشرة البريدية
              <span className="absolute bottom-0 right-0 h-1 w-12 rounded-full bg-gradient-to-l from-blue-600 to-blue-400" />
            </h3>
            <p className="mb-4 text-gray-600">للطلبات التجارية والتعاون</p>
            <a
              href="mailto:Walid.walass@gmail.com?subject=%D8%B7%D9%84%D8%A8%20%D8%A7%D9%84%D8%A8%D9%8A%D8%B9%20%D8%A8%D8%A7%D9%84%D8%AC%D9%85%D9%84%D8%A9"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-400 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <Send className="h-5 w-5" />
              البيع بالجملة
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t-2 border-gray-100 pt-8 md:flex-row">
          <p className="text-center text-gray-600 md:text-right">
            © 2026 FONI. جميع الحقوق محفوظة. تصميم وتطوير بأعلى معايير الجودة
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-500 transition hover:text-blue-600">
              سياسة الخصوصية
            </Link>
            <Link href="#" className="text-gray-500 transition hover:text-blue-600">
              الشروط والأحكام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
