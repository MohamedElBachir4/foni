"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, Sparkles, ShoppingBag, ExternalLink } from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";

const shopLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/phones", label: "الهواتف" },
  { href: "/accessories", label: "الإكسسوارات" },
  { href: "/spare-parts", label: "قطع الغيار" },
];

const serviceLinks = [
  { href: "/services", label: "خدماتنا" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/accounts", label: "حساب الجملة / المصلّح" },
  { href: "/cart", label: "سلة الشراء" },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 border-b border-blue-600/25 pb-2 text-sm font-bold text-[var(--color-luxury-blue)]">
      <span className="h-1 w-8 rounded-full bg-gradient-to-l from-blue-600 to-sky-400" aria-hidden />
      {children}
    </p>
  );
}

function FooterLinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="inline-flex rounded-lg px-2 py-1 text-[15px] text-slate-600 transition-colors hover:bg-sky-50 hover:text-[var(--color-luxury-blue-light)] focus-visible:bg-sky-50"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-20">
      {/* تمويه خفيف متواصل مع خلفية الصفحة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-32 bg-gradient-to-b from-transparent to-sky-100/35"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <div className="glass overflow-hidden rounded-[2rem] border border-white/50 shadow-[0_-8px_40px_-12px_rgba(12,74,110,0.12),0_20px_50px_-24px_rgba(37,99,235,0.15)] ring-1 ring-blue-100/40">
          <div
            className="h-[5px] w-full bg-gradient-to-l from-[var(--color-luxury-blue)] via-blue-600 to-[var(--color-luxury-blue-light)]"
            aria-hidden
          />

          <div className="grid gap-10 p-8 sm:p-10 lg:gap-14 lg:p-11">
            {/* صف العلامة */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-lg">
                <div className="mb-5 flex flex-wrap items-center gap-4">
                  <Link
                    href="/"
                    className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white to-sky-50 shadow-md shadow-blue-500/10 ring-2 ring-blue-600/15 transition hover:scale-[1.02] hover:ring-blue-500/35"
                    aria-label="العودة إلى الصفحة الرئيسية"
                  >
                    <Image
                      src="/LOGO.jpeg"
                      alt="FONI"
                      width={60}
                      height={60}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </Link>
                  <div>
                    <p className="bg-gradient-to-l from-[var(--color-luxury-blue)] to-[var(--color-luxury-blue-light)] bg-clip-text text-3xl font-black tracking-tight text-transparent">
                      FONI
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-slate-700">عالم الهواتف بين يديك</p>
                  </div>
                </div>
                <p className="text-[15px] leading-relaxed text-[var(--color-luxury-muted)]">
                  بيع وتجهيز وصيانة — منصّة واحدة لهواتف ذكية وإكسسوارات وقطع غيار بجودة تناسب توقعاتك.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <a
                    href="https://www.tiktok.com/@foni.belfort?_r=1&_t=ZS-95lEifD1SGS"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تيك توك FONI"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <SiTiktok className="h-[18px] w-[18px]" />
                  </a>
                  <a
                    href="https://t.me/+QpoXZALMQ1ZkODk0"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="قناة FONI على تيليغرام"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <SiTelegram className="h-[18px] w-[18px]" />
                  </a>
                </div>
              </div>

              {/* شريطة دعوة — نفس روح أزرار النافبار */}
              <div className="w-full shrink-0 rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-600/[0.07] via-white to-sky-50 p-6 shadow-inner shadow-blue-500/10 sm:max-w-sm lg:w-80">
                <div className="mb-4 flex items-center gap-2 text-[var(--color-luxury-blue)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/15">
                    <Sparkles className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="font-bold text-[var(--color-luxury-slate)]">للمهنيّين والكميات</span>
                </div>
                <p className="mb-5 text-[14px] leading-relaxed text-slate-600">
                  أسعار Réparateur و Grossiste بعد الموافقة — تسريع الشراء وفوائد حساب موحّد.
                </p>
                <Link
                  href="/accounts"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-400 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/28 transition hover:from-blue-500 hover:to-sky-400 hover:shadow-blue-400/35"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  الدخول والتسجيل B2B
                </Link>
              </div>
            </div>

            {/* أعمدة الروابط + الاتصال */}
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <nav aria-label="تسوق">
                <SectionLabel>تسوق</SectionLabel>
                <FooterLinkList links={shopLinks} />
              </nav>
              <nav aria-label="المساعدة والحساب">
                <SectionLabel>مساعدة وحساب</SectionLabel>
                <FooterLinkList links={serviceLinks} />
              </nav>

              <div className="sm:col-span-2 lg:col-span-1">
                <SectionLabel>معلومات الاتصال</SectionLabel>
                <address className="not-italic">
                  <ul className="space-y-3 text-[15px] text-[var(--color-luxury-muted)]">
                    <li className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-luxury-blue-light)] ring-1 ring-blue-600/15">
                        <MapPin className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="pt-1 leading-relaxed text-slate-700">الجزائر العاصمة · متجر أونلاين</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--color-luxury-blue-light)] ring-1 ring-blue-600/15">
                        <Phone className="h-4 w-4" aria-hidden />
                      </span>
                      <a href="tel:+213542458175" className="pt-1 font-semibold text-slate-900 hover:text-[var(--color-luxury-blue-light)]" dir="ltr">
                        +213 542 45 81 75
                      </a>
                    </li>
                    <li className="flex items-center gap-3 text-slate-600">
                      <Clock className="h-5 w-5 shrink-0 text-blue-600/80" aria-hidden />
                      الطلب متاح على مدار الساعة
                    </li>
                  </ul>
                </address>
              </div>

              <div className="rounded-2xl border border-dashed border-blue-300/55 bg-blue-50/40 p-5 text-center sm:col-span-2 lg:col-span-1">
                <p className="mb-3 text-[13px] font-semibold text-[var(--color-luxury-blue)]">
                  لمتابعة الجديد والعروض
                </p>
                <p className="text-[13px] leading-relaxed text-slate-600">شاهد المحتوى على تيك توك وانضم لقناة تيليغرام.</p>
              </div>
            </div>
          </div>

          {/* الشريط السفلي */}
          <div className="flex flex-col items-center gap-4 border-t border-blue-950/10 bg-gradient-to-r from-slate-50/90 via-blue-50/30 to-slate-50/90 px-6 py-5 sm:flex-row sm:justify-between sm:gap-6 sm:px-10">
            <p className="text-center text-[13px] text-slate-600 sm:text-right">
              © {new Date().getFullYear()} FONI — جميع الحقوق محفوظة
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium">
              <Link href="#" className="text-[var(--color-luxury-muted)] transition-colors hover:text-blue-700">
                سياسة الخصوصية
              </Link>
              <span className="hidden h-3 w-px bg-slate-300 sm:inline-block" aria-hidden />
              <Link href="#" className="text-[var(--color-luxury-muted)] transition-colors hover:text-blue-700">
                الشروط والأحكام
              </Link>
            </div>
          </div>
          <div className="-mt-px border-t border-blue-950/10 bg-gradient-to-r from-slate-50/90 via-blue-50/30 to-slate-50/90 px-6 py-4">
            <div className="mx-auto flex max-w-lg flex-col items-center gap-2.5 text-center">
              <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                تم برمجة وتطوير هذا الموقع من قِبل شركة التطوير{" "}
                <strong className="font-bold text-slate-900">Codeasy</strong>. الرابط التالي يفتح{" "}
                <strong className="font-bold text-slate-900">موقع المُطوِّر</strong> في نافذة جديدة (ليس صفحة
                من متجر FONI).
              </p>
              <a
                href="https://codeasy.site"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فتح موقع المطور Codeasy في نافذة جديدة (codeasy.site)"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-900"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden />
                <span>Codeasy — موقع المُطور</span>
              </a>
              <p className="text-[11px] text-slate-500">
                الرابط الخارجي:{" "}
                <span dir="ltr" className="font-medium text-slate-600">
                  https://codeasy.site
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
