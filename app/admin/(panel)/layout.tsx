"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken, getAuthHeaders, API_URL } from "@/lib/adminAuth";
import { LayoutDashboard, Smartphone, LogOut, Package, ShoppingCart, User, Archive, Settings, ChevronRight, Tags } from "lucide-react";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/pending-orders-count`, {
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (res.status === 401) {
        clearToken();
        setHasToken(false);
        router.replace("/admin/login");
        return;
      }
      if (res.ok) {
        const { count } = await res.json();
        setPendingCount(count ?? 0);
      }
    } catch {
      setPendingCount(0);
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
    fetchPendingCount();
  }, [mounted, router, fetchPendingCount]);

  useEffect(() => {
    const onOrdersUpdated = () => fetchPendingCount();
    const onFocus = () => fetchPendingCount();
    window.addEventListener("admin-orders-updated", onOrdersUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("admin-orders-updated", onOrdersUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchPendingCount]);

  function handleLogout() {
    clearToken();
    router.replace("/admin/login");
    router.refresh();
  }

  if (!mounted || !hasToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 shadow-xl shadow-indigo-500/30">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
        <div className="mt-4 text-slate-500 animate-pulse font-medium">جاري تهيئة لوحة التحكم...</div>
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
        className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${active
            ? "bg-indigo-50/80 text-indigo-700 shadow-[inset_0_1px_4px_rgba(0,0,0,0.03)]"
            : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
          }`}
      >
        {active && (
          <div className="absolute right-0 top-1/2 -mt-2 h-4 w-1 rounded-l-full bg-indigo-600" />
        )}
        <div className={`transition-colors duration-300 ${active ? "text-indigo-600" : colorClass}`}>
          {icon}
        </div>
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 && (
          <span
            className={`flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-sm ${active ? "bg-indigo-600 text-white" : "bg-rose-500 text-white"
              }`}
            style={{ animation: 'bounce-light 2s infinite' }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-indigo-100 selection:text-indigo-900">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bounce-light {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-slate-200/60 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out shadow-[0_0_40px_rgba(0,0,0,0.02)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-hover hover:text-indigo-600 hover:shadow"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex h-20 shrink-0 items-center justify-between gap-2 border-b border-slate-100/80 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <span className="text-xl font-black tracking-tighter">F</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none">FONI</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-1">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          <div className="mb-6 space-y-1">
            {navLink(
              "/admin/dashboard",
              <LayoutDashboard className="h-5 w-5 shrink-0" />,
              "لوحة التحكم",
              undefined,
              "text-sky-500 group-hover:text-sky-600"
            )}
          </div>

          <div className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">المنتجات</div>
          <div className="space-y-1 mb-6">
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

          <div className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">قطع الغيار</div>
          <div className="space-y-1 mb-6">
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

          <div className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">إدارة النظام</div>
          <div className="space-y-1">
            {navLink(
              "/admin/orders",
              <ShoppingCart className="h-5 w-5 shrink-0" />,
              "الطلبات السارية",
              pendingCount,
              "text-sky-500 group-hover:text-sky-600"
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

        {/* User / Logout */}
        <div className="border-t border-slate-100 p-4">
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

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'mr-72 p-6 lg:p-10' : 'p-6 lg:p-10'} relative`}>
        {/* Decorative ambient background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-gradient-to-tr from-sky-100/40 to-indigo-100/40 blur-[100px]" />
          <div className="absolute -bottom-[10%] flex h-[40%] w-[40%] rounded-full bg-gradient-to-tr from-rose-100/30 to-purple-100/30 blur-[100px] left-[20%]" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
