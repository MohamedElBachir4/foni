"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, CircleUserRound, Search, X } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { useCart } from "@/context/CartContext";
import { useAccount } from "@/context/AccountContext";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { totalItems } = useCart();
  const { account, logout } = useAccount();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="glass fixed top-0 left-0 z-50 w-full border-b border-white/30 shadow-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex h-14 shrink-0 items-center overflow-hidden rounded-xl border-2 border-white/40 shadow-md transition-all duration-300 hover:scale-105 hover:border-white/60 hover:shadow-lg"
          >
            <img
              src="/LOGO.jpeg"
              alt="FONI"
              className="block h-full w-auto max-h-14 max-w-[140px] object-contain"
            />
          </Link>

          <div className="hidden flex-1 justify-center px-4 md:flex">
            <SearchBar />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="group relative text-lg font-medium text-gray-700 transition hover:text-blue-600"
            >
              الرئيسية
              <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/products"
              className="group relative text-lg font-medium text-gray-700 transition hover:text-blue-600"
            >
              المنتجات
              <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/services"
              className="group relative text-lg font-medium text-gray-700 transition hover:text-blue-600"
            >
              خدماتنا
              <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/contact"
              className="group relative text-lg font-medium text-gray-700 transition hover:text-blue-600"
            >
              تواصل معنا
              <span className="absolute bottom-0 right-0 h-0.5 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>

          <div className="flex flex-1 items-center gap-2 md:flex-none">
            <div className="flex-1 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-blue-600 to-blue-400 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <span className="tracking-wider">بحث</span>
                <Search className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <Link
              href="/cart"
              className="group relative flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-3 py-2 text-blue-600 shadow-md transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:shadow-lg"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
              <span className="hidden font-semibold sm:inline">سلة الشراء</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <div className="relative flex items-center gap-2" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((v) => !v)}
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
                <div className="absolute left-0 top-[120%] w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-800 shadow-xl sm:w-72 sm:text-sm">
                  {account ? (
                    <>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white shadow-sm">
                          {`${(account.firstName || "").charAt(0)}${(account.lastName || "").charAt(0)}`.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {account.firstName} {account.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 sm:text-xs">
                            {account.role === "reparateur" ? "حساب Réparateur" : "حساب Grossiste"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px] sm:text-xs">
                        <p>
                          <span className="font-semibold">الهاتف: </span>
                          <span dir="ltr">{account.phone}</span>
                        </p>
                        <p className="truncate">
                          <span className="font-semibold">البريد: </span>
                          {account.email}
                        </p>
                        {account.wilaya && (
                          <p>
                            <span className="font-semibold">الولاية: </span>
                            {account.wilaya}
                          </p>
                        )}
                        {account.address && (
                          <p>
                            <span className="font-semibold">العنوان: </span>
                            {account.address}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                        }}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600"
                      >
                        تسجيل الخروج
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 sm:text-sm">
                        قم بإنشاء حساب Réparateur أو Grossiste للاستفادة من التخفيضات.
                      </p>
                      <Link
                        href="/accounts"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        إنشاء / تسجيل الدخول
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-2 text-gray-700 shadow-md transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 md:hidden"
              aria-label="فتح القائمة"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="absolute inset-x-0 top-20 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <nav className="space-y-1 text-right">
                <Link
                  href="/"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الرئيسية
                </Link>
                <Link
                  href="/products"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  المنتجات
                </Link>
                <Link
                  href="/services"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  خدماتنا
                </Link>
                <Link
                  href="/contact"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  تواصل معنا
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
      {isMobileSearchOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm md:hidden"
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
