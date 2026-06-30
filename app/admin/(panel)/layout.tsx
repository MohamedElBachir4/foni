"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken, getAuthHeaders, API_URL } from "@/lib/adminAuth";
import {
  LayoutDashboard,
  Smartphone,
  LogOut,
  Package,
  ShoppingCart,
  User,
  Archive,
  Settings,
  ChevronRight,
  Tags,
  Wrench,
  Menu,
  X,
} from "lucide-react";

const LG_BREAKPOINT = 1024;

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [partRequestsCount, setPartRequestsCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const fetchNavBadges = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setPendingCount(0);
      setPartRequestsCount(0);
      return;
    }
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/pending-orders-count`, {
        headers,
        credentials: "include",
      });
      if (res.status === 401) {
        clearToken();
        setHasToken(false);
        router.replace("/admin/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.count ?? 0);
        if (typeof data.partRequestsCount === "number") {
          setPartRequestsCount(data.partRequestsCount);
        } else {
          try {
            const prRes = await fetch(`${API_URL}/api/part-requests`, {
              headers,
              credentials: "include",
            });
            if (prRes.ok) {
              const prData = await prRes.json();
              const pending = (Array.isArray(prData.requests) ? prData.requests : []).filter(
                (r: { status?: string }) => r.status === "pending"
              ).length;
              setPartRequestsCount(pending);
            }
          } catch {
            setPartRequestsCount(0);
          }
        }
      }
    } catch {
      setPendingCount(0);
      setPartRequestsCount(0);
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
    setHasToken(!!getToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    setHasToken(true);
    fetchNavBadges();
  }, [mounted, router, fetchNavBadges]);

  useEffect(() => {
    const onBadgesUpdated = () => fetchNavBadges();
    const onFocus = () => fetchNavBadges();
    window.addEventListener("admin-orders-updated", onBadgesUpdated);
    window.addEventListener("admin-part-requests-updated", onBadgesUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("admin-orders-updated", onBadgesUpdated);
      window.removeEventListener("admin-part-requests-updated", onBadgesUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNavBadges]);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [pathname, isDesktop]);

  useEffect(() => {
    if (!isDesktop && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, isSidebarOpen]);

  function handleLogout() {
    clearToken();
    router.replace("/admin/login");
    router.refresh();
  }

  if (!mounted || !hasToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 shadow-xl shadow-indigo-500/30">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
        <div className="mt-4 animate-pulse text-center font-medium text-slate-500">
          جاري تهيئة لوحة التحكم...
        </div>
      </div>
    );
  }

  const navLink = (
    href: string,
    icon: React.ReactNode,
    label: string,
    badge?: number,
    colorClass: string = "text-slate-500 group-hover:text-indigo-600"
  ) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => {
          if (!isDesktop) setIsSidebarOpen(false);
        }}
        className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
          active
            ? "bg-indigo-50/80 text-indigo-700 shadow-[inset_0_1px_4px_rgba(0,0,0,0.03)]"
            : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
        }`}
      >
        {active && (
          <div className="absolute right-0 top-1/2 -mt-2 h-4 w-1 rounded-l-full bg-indigo-600" />
        )}
        <div
          className={`transition-colors duration-300 ${active ? "text-indigo-600" : colorClass}`}
        >
          {icon}
        </div>
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 && (
          <span
            className={`flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-sm ${
              active ? "bg-indigo-600 text-white" : "bg-rose-500 text-white"
            }`}
            style={{ animation: "bounce-light 2s infinite" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarOpenOnDesktop = isDesktop && isSidebarOpen;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bounce-light {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `,
        }}
      />

      {/* خلفية معتمة — جوال فقط */}
      {!isDesktop && isSidebarOpen ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(88vw,18rem)] flex-col border-l border-slate-200/60 bg-white/95 shadow-[0_0_40px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-transform duration-300 ease-in-out lg:w-72 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {isDesktop ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "طي القائمة" : "فتح القائمة"}
            className="absolute -left-4 top-6 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-indigo-600 hover:shadow lg:flex"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${!isSidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="إغلاق القائمة"
            className="absolute left-3 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex h-16 shrink-0 items-center border-b border-slate-100/80 px-5 sm:h-20 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <span className="text-xl font-black tracking-tighter">F</span>
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none tracking-tight text-slate-800">
                FONI
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          <div className="mb-4 space-y-1 sm:mb-6">
            {navLink(
              "/admin/dashboard",
              <LayoutDashboard className="h-5 w-5 shrink-0" />,
              "لوحة التحكم",
              undefined,
              "text-sky-500 group-hover:text-sky-600"
            )}
          </div>

          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:px-4">
            المنتجات
          </div>
          <div className="mb-4 space-y-1 sm:mb-6">
            {navLink(
              "/admin/brands",
              <Tags className="h-5 w-5 shrink-0" />,
              "الماركات",
              undefined,
              "text-indigo-500 group-hover:text-indigo-600"
            )}
            {navLink(
              "/admin/phones/create",
              <Smartphone className="h-5 w-5 shrink-0" />,
              "إنشاء الهواتف",
              undefined,
              "text-emerald-500 group-hover:text-emerald-600"
            )}
            {navLink(
              "/admin/accessory-types",
              <Settings className="h-5 w-5 shrink-0" />,
              "أنواع الأكسسوارات",
              undefined,
              "text-slate-400 group-hover:text-slate-600"
            )}
            {navLink(
              "/admin/accessories/create",
              <Package className="h-5 w-5 shrink-0" />,
              "منتجات الأكسسوارات",
              undefined,
              "text-purple-500 group-hover:text-purple-600"
            )}
          </div>

          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:px-4">
            قطع الغيار
          </div>
          <div className="mb-4 space-y-1 sm:mb-6">
            {navLink(
              "/admin/spare-models",
              <Smartphone className="h-5 w-5 shrink-0" />,
              "هواتف قطع الغيار",
              undefined,
              "text-amber-500 group-hover:text-amber-600"
            )}
            {navLink(
              "/admin/spare-parts",
              <Package className="h-5 w-5 shrink-0" />,
              "قطع الغيار",
              undefined,
              "text-rose-500 group-hover:text-rose-600"
            )}
          </div>

          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:px-4">
            إدارة النظام
          </div>
          <div className="space-y-1">
            {navLink(
              "/admin/orders",
              <ShoppingCart className="h-5 w-5 shrink-0" />,
              "الطلبات السارية",
              pendingCount,
              "text-sky-500 group-hover:text-sky-600"
            )}
            {navLink(
              "/admin/part-requests",
              <Wrench className="h-5 w-5 shrink-0" />,
              "طلبات القطع",
              partRequestsCount,
              "text-amber-500 group-hover:text-amber-600"
            )}
            {navLink(
              "/admin/archive",
              <Archive className="h-5 w-5 shrink-0" />,
              "الأرشيف",
              undefined,
              "text-slate-500 group-hover:text-slate-600"
            )}
            {navLink(
              "/admin/accounts",
              <User className="h-5 w-5 shrink-0" />,
              "الحسابات والعملاء",
              undefined,
              "text-violet-500 group-hover:text-violet-600"
            )}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3 sm:p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-rose-500" />
              تسجيل الخروج
            </div>
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
          sidebarOpenOnDesktop ? "lg:mr-72" : ""
        }`}
      >
        {/* شريط علوي — جوال */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="فتح القائمة"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-sm font-black text-white">
              F
            </div>
            <span className="truncate text-sm font-bold text-slate-800">لوحة التحكم</span>
          </div>
          {pendingCount > 0 ? (
            <Link
              href="/admin/orders"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
              aria-label={`${pendingCount} طلبات معلقة`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -left-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            </Link>
          ) : (
            <div className="w-10 shrink-0" aria-hidden />
          )}
        </header>

        <main className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-gradient-to-tr from-sky-100/40 to-indigo-100/40 blur-[100px]" />
            <div className="absolute -bottom-[10%] left-[20%] flex h-[40%] w-[40%] rounded-full bg-gradient-to-tr from-rose-100/30 to-purple-100/30 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
