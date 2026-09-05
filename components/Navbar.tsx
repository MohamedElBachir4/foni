"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Menu,
  CircleUserRound,
  Search,
  X,
  ListOrdered,
  User,
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { useAccount } from "@/context/AccountContext";
import { getPricingAccount } from "@/lib/pricing";
import { isMerchantRole, roleLabelAr } from "@/lib/accountRoles";
import type { AccountInfo } from "@/context/AccountContext";

function isClickInsideAccountMenu(
  e: MouseEvent,
  refs: Array<RefObject<HTMLDivElement | null>>
) {
  const nodes = refs.map((ref) => ref.current).filter(Boolean) as HTMLDivElement[];
  if (nodes.length === 0) return false;
  const path = typeof e.composedPath === "function" ? e.composedPath() : [];
  return nodes.some((node) =>
    path.length > 0 ? path.includes(node) : node.contains(e.target as Node)
  );
}

type AccountMenuDropdownProps = {
  account: AccountInfo | null;
  onClose: () => void;
  onNavigate: (href: string) => void;
  logout: () => void;
  setUseWholesalePricing: (enabled: boolean) => Promise<void>;
};

function AccountMenuDropdown({
  account,
  onClose,
  onNavigate,
  logout,
  setUseWholesalePricing,
}: AccountMenuDropdownProps) {
  return (
    <div
      role="menu"
      className="absolute end-0 top-[calc(100%+0.5rem)] z-[1400] w-64 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-xl sm:w-72 sm:text-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {account ? (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white shadow-sm ring-2 ring-white">
                {`${(account.firstName || "").charAt(0)}${(account.lastName || "").charAt(0)}`.toUpperCase()}
              </span>
              <span
                className="absolute bottom-0 end-0 z-10 h-3 w-3 rounded-full border-[2.5px] border-white bg-emerald-500 shadow-sm ring-1 ring-emerald-600/30"
                title="نشط"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">
                {account.firstName} {account.lastName}
              </p>
              <p className="text-[11px] text-slate-500 sm:text-xs">
                {roleLabelAr(account.role)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="menuitem"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-center text-[11px] font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-900 sm:text-xs"
              onClick={() => {
                onClose();
                onNavigate("/accounts?tab=profile");
              }}
            >
              <User className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
              الحساب
            </button>
            <button
              type="button"
              role="menuitem"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 px-2 py-2.5 text-center text-[11px] font-bold text-blue-900 shadow-sm transition hover:bg-blue-100 sm:text-xs"
              onClick={() => {
                onClose();
                onNavigate("/accounts?tab=orders");
              }}
            >
              <ListOrdered className="h-3.5 w-3.5 shrink-0" aria-hidden />
              طلباتي
            </button>
          </div>
          {isMerchantRole(account.role) && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-amber-900 sm:text-xs">
                عرض خاص للتاجر أو صاحب المحل: أسعار الجملة
              </p>
              <button
                type="button"
                onClick={() => {
                  setUseWholesalePricing(!account.useWholesalePricing).catch(() => {});
                }}
                className={`mt-2 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold ${
                  account.useWholesalePricing
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700"
                    : "bg-amber-600 text-white shadow-sm hover:bg-amber-700"
                }`}
              >
                {account.useWholesalePricing
                  ? "مفعّل: أسعار الجملة"
                  : "تفعيل أسعار الجملة"}
              </button>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout();
              onClose();
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            تسجيل الخروج
          </button>
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 sm:text-sm">
            قم بإنشاء حساب زبون أو حساب تاجر للاستفادة من أسعار خاصة.
          </p>
          <button
            type="button"
            role="menuitem"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => {
              onClose();
              onNavigate("/accounts");
            }}
          >
            إنشاء / تسجيل الدخول
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuDesktopRef = useRef<HTMLDivElement | null>(null);
  const accountMenuMobileRef = useRef<HTMLDivElement | null>(null);
  const { account, logout, setUseWholesalePricing } = useAccount();
  const approvedB2B = useMemo(() => getPricingAccount(account), [account]);

  const closeAccountMenu = () => setIsAccountMenuOpen(false);
  const navigateFromAccountMenu = (href: string) => router.push(href);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isClickInsideAccountMenu(e, [accountMenuDesktopRef, accountMenuMobileRef])
      ) {
        return;
      }
      setIsAccountMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="glass fixed top-0 left-0 z-[1100] w-full overflow-visible border-b border-white/20 shadow-md">
      {approvedB2B && isMerchantRole(approvedB2B.role) && (
        <div
          className={`border-b px-3 py-2 sm:px-4 ${
            approvedB2B.useWholesalePricing
              ? "border-red-200/80 bg-red-50"
              : "border-amber-200/80 bg-amber-50"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={!!approvedB2B.useWholesalePricing}
              aria-label={
                approvedB2B.useWholesalePricing
                  ? "إيقاف أسعار الجملة"
                  : "تفعيل أسعار الجملة"
              }
              onClick={() => {
                setUseWholesalePricing(!approvedB2B.useWholesalePricing).catch(() => {});
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                approvedB2B.useWholesalePricing
                  ? "bg-red-600 focus-visible:outline-red-600"
                  : "bg-slate-300 focus-visible:outline-amber-500"
              }`}
            >
              <span
                className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow-md transition-[left] duration-200 ${
                  approvedB2B.useWholesalePricing ? "left-[calc(100%-1.875rem)]" : "left-0.5"
                }`}
                aria-hidden
              />
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop: شعار + روابط | بحث | حساب */}
        <div className="hidden h-20 items-center gap-4 overflow-visible lg:grid lg:grid-cols-[1fr_minmax(240px,420px)_1fr]">
          <div className="flex min-w-0 items-center justify-start gap-5 xl:gap-8">
            <Link
              href="/"
              className="group flex h-14 shrink-0 items-center overflow-hidden rounded-xl border-2 border-white/40 shadow-md transition-all duration-300 hover:scale-105 hover:border-white/60 hover:shadow-lg"
            >
              <Image
                src="/LOGO.jpeg"
                alt="FONI"
                width={140}
                height={56}
                priority
                className="block h-full w-auto max-h-14 max-w-[140px] object-contain"
              />
            </Link>
            <nav className="flex min-w-0 items-center gap-4 xl:gap-6" aria-label="التنقل الرئيسي">
              <Link
                href="/"
                className="group relative shrink-0 text-base font-medium text-gray-700 transition hover:text-blue-600 xl:text-lg"
              >
                الرئيسية
                <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/products"
                className="group relative shrink-0 text-base font-medium text-gray-700 transition hover:text-blue-600 xl:text-lg"
              >
                المنتجات
                <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/services"
                className="group relative shrink-0 text-base font-medium text-gray-700 transition hover:text-blue-600 xl:text-lg"
              >
                خدماتنا
                <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/contact"
                className="group relative shrink-0 text-base font-medium text-gray-700 transition hover:text-blue-600 xl:text-lg"
              >
                تواصل معنا
                <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            </nav>
          </div>

          <div className="min-w-0 px-1">
            <SearchBar />
          </div>

          <div
            className={`relative flex items-center justify-end gap-2 overflow-visible ${isAccountMenuOpen ? "z-[1400]" : ""}`}
          >
            <div
              className="relative flex items-center gap-2 overflow-visible"
              ref={accountMenuDesktopRef}
            >
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((v) => !v)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-2.5 py-2 text-gray-700 shadow-md transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
              >
                {account ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9">
                    {`${(account.firstName || "").charAt(0)}${(account.lastName || "").charAt(0)}`.toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound className="h-5 w-5" strokeWidth={2.5} />
                )}
                <span className="hidden max-w-[140px] truncate text-xs font-semibold sm:inline sm:text-sm">
                  {account
                    ? `${account.firstName} ${account.lastName}`
                    : "حسابي"}
                </span>
              </button>
              {isAccountMenuOpen && (
                <AccountMenuDropdown
                  account={account}
                  onClose={closeAccountMenu}
                  onNavigate={navigateFromAccountMenu}
                  logout={logout}
                  setUseWholesalePricing={setUseWholesalePricing}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile header — شريط علوي بسيط */}
        <div className="flex h-14 items-center justify-between gap-2 overflow-visible lg:hidden">
          {/* لوجو */}
          <Link
            href="/"
            className="flex h-10 shrink-0 items-center overflow-hidden"
          >
            <Image
              src="/LOGO.jpeg"
              alt="FONI"
              width={90}
              height={40}
              priority
              className="block h-full w-auto max-h-10 object-contain"
            />
          </Link>

          {/* أدوات اليمين */}
          <div
            className={`relative flex items-center gap-1.5 overflow-visible ${isAccountMenuOpen ? "z-[1400]" : ""}`}
          >
            {/* بحث */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              aria-label="بحث"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* حساب */}
            <div
              className="relative flex items-center overflow-visible"
              ref={accountMenuMobileRef}
            >
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((v) => !v)}
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                aria-label="حسابي"
              >
                {account ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-xs font-bold text-white">
                    {`${(account.firstName || "").charAt(0)}${(account.lastName || "").charAt(0)}`.toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
              {isAccountMenuOpen && (
                <AccountMenuDropdown
                  account={account}
                  onClose={closeAccountMenu}
                  onNavigate={navigateFromAccountMenu}
                  logout={logout}
                  setUseWholesalePricing={setUseWholesalePricing}
                />
              )}
            </div>

            {/* زر القائمة (هامبرغر) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
            </button>
          </div>
        </div>

      </div>
      {/* قائمة الهامبرغر */}
      {isMobileMenuOpen && (
        <div className="absolute inset-x-0 top-full z-[1200] border-t border-slate-100 bg-white shadow-lg lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="space-y-1 text-right">
              {[
                { href: "/", label: "الرئيسية" },
                { href: "/products", label: "جميع المنتجات" },
                { href: "/phones", label: "الهواتف" },
                { href: "/accessories", label: "اكسسوارات" },
                { href: "/spare-parts", label: "قطع غيار" },
                { href: "/maintenance-tools", label: "أدوات الصيانة" },
                { href: "/services", label: "خدماتنا" },
                { href: "/contact", label: "تواصل معنا" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {account && (
                <Link
                  href="/accounts?tab=orders"
                  className="block rounded-xl px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  طلباتي
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {isMobileSearchOpen && (
        <div
          className="fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSearchOpen(false)}
        >
          <div
            className="absolute inset-x-0 top-20 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-white p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  ابحث عن منتج
                </span>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  aria-label="إغلاق البحث"
                  onClick={() => setIsMobileSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SearchBar />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
