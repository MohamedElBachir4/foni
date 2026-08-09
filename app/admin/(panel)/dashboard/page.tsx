"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Wrench,
  Loader2,
  ChevronLeft,
  Activity,
  Award,
  CreditCard,
  Target
} from "lucide-react";
import { API_URL, getAuthHeaders, clearToken, getToken } from "@/lib/adminAuth";
import { useRouter } from "next/navigation";

type DashboardStats = {
  stats: {
    salesToday: number;
    salesMonth: number;
    pendingOrders: number;
    completedToday: number;
    totalAccounts: number;
    totalProducts: number;
    phoneModels: number;
    spareParts: number;
  };
  recentOrders: {
    _id: string;
    fullName: string;
    phone: string;
    totalPrice: number;
    status?: string;
    createdAt: string;
  }[];
  topProductsToday: { name: string; totalQty: number }[];
  topProductsMonth: { name: string; totalQty: number }[];
  topProductsAll: { name: string; totalQty: number }[];
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("ar-DZ").format(n) + " دج";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  call_1: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  call_2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  no_answer: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  contacted: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function StatusBadge({ status }: { status?: string }) {
  const s = status || "pending";
  const cls = statusColors[s] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
    call_1: "اتصال 1",
    call_2: "اتصال 2",
    no_answer: "لم يتم الرد",
    contacted: "تم التواصل",
    completed: "مكتمل",
    cancelled: "ملغى",
  };
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${cls}`}>
      {labels[s] || s}
    </span>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  gradientCls,
  iconColor,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradientCls: string;
  iconColor: string;
  delay?: number;
}) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:border-white/40 sm:bg-white/60 sm:p-6 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:backdrop-blur-xl sm:transition-all sm:duration-500 sm:hover:-translate-y-1 sm:hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}
    style={{ animation: `fade-in-up 0.6s ease-out ${delay}s both` }}
  >
    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-15 blur-2xl sm:opacity-20 sm:transition-all sm:duration-500 sm:group-hover:scale-150 sm:group-hover:opacity-40 ${gradientCls}`} />
    
    <div className="relative flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-500 sm:text-sm">{title}</p>
        <h3 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          <span className={gradientCls}>{value}</span>
        </h3>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 sm:h-14 sm:w-14 sm:rounded-2xl sm:bg-white sm:shadow-sm sm:transition-transform sm:duration-500 sm:group-hover:rotate-12 sm:group-hover:scale-110 ${iconColor}`}>
        {icon}
      </div>
    </div>
  </div>
);

type TopPeriod = "today" | "month" | "all";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topPeriod, setTopPeriod] = useState<TopPeriod>("today");

  const fetchStats = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      setError("يجب تسجيل الدخول");
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard-stats`, {
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
          setError("انتهت جلسة الأدمن، يرجى تسجيل الدخول من جديد");
          router.replace("/admin/login");
        } else {
          setError("فشل في جلب الإحصائيات");
        }
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 space-y-5 pb-6 duration-700 ease-out sm:space-y-8 sm:pb-10">
      
      {/* Premium Header Profile Area */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-900 via-indigo-900 to-purple-900 px-4 py-6 shadow-xl sm:rounded-3xl sm:px-12 sm:py-14 sm:shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute -left-20 -top-20 hidden h-[300px] w-[300px] rounded-full bg-sky-500/20 blur-[100px] sm:block" />
        <div className="absolute right-0 top-0 hidden h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-[100px] sm:block" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-sky-200 backdrop-blur-md sm:mb-4 sm:px-3 sm:text-sm">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>نظام إدارة المتجر نشط</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl">
              مرحباً بعودتك
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300 sm:mt-4 sm:text-lg">
              نظرة سريعة على المبيعات والطلبات اليوم.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-3">
            <Link href="/admin/orders" className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-indigo-950 shadow-sm active:scale-[0.98] sm:px-5 sm:py-3 sm:text-sm sm:shadow-[0_0_20px_rgba(255,255,255,0.3)] sm:hover:bg-sky-50 sm:hover:scale-105">
              <ShoppingCart className="h-4 w-4" />
              الطلبات
            </Link>
            <Link href="/admin/phones/create" className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white backdrop-blur-md active:scale-[0.98] sm:px-5 sm:py-3 sm:text-sm sm:hover:bg-white/20 sm:hover:scale-105">
              <Smartphone className="h-4 w-4" />
              إضافة هاتف
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white border-opacity-40 bg-white/50 backdrop-blur-xl py-32 shadow-xl">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 shadow-xl shadow-indigo-500/30">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-lg font-medium text-slate-600 animate-pulse">جاري تحميل البيانات الحية...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 backdrop-blur-md p-8 text-rose-700 shadow-lg flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 hidden sm:flex">
            <Wrench className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">حدث خطأ</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-10">
          
          {/* Main Highlights Stats Grid */}
          <section>
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <h2 className="text-base font-bold text-slate-800 sm:bg-clip-text sm:text-xl sm:text-transparent sm:bg-gradient-to-r sm:from-slate-900 sm:to-slate-600">
                نظرة عامة
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              <StatCard
                title="مبيعات اليوم"
                value={formatPrice(data.stats.salesToday)}
                icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
                gradientCls="from-emerald-400 to-emerald-600"
                iconColor="text-emerald-500 shadow-emerald-500/20"
                delay={0.1}
              />
              <StatCard
                title="مبيعات الشهر"
                value={formatPrice(data.stats.salesMonth)}
                icon={<CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
                gradientCls="from-blue-500 to-indigo-600"
                iconColor="text-indigo-500 shadow-indigo-500/20"
                delay={0.2}
              />
              <StatCard
                title="قيد الانتظار"
                value={data.stats.pendingOrders}
                icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6" />}
                gradientCls="from-amber-400 to-orange-500"
                iconColor="text-amber-500 shadow-amber-500/20"
                delay={0.3}
              />
              <StatCard
                title="مكتمل اليوم"
                value={data.stats.completedToday}
                icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                gradientCls="from-teal-400 to-emerald-500"
                iconColor="text-teal-500 shadow-teal-500/20"
                delay={0.4}
              />
            </div>
          </section>

          <div className="grid gap-5 sm:gap-8 lg:grid-cols-3">
            {/* Recent Orders - Spans 2 columns */}
            <div className="group relative rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl sm:border-white sm:bg-white/70 sm:p-1 sm:shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:backdrop-blur-md lg:col-span-2">
              <div className="flex h-full flex-col sm:rounded-[20px] sm:bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-6">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 sm:h-12 sm:w-12">
                      <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-800 sm:text-lg">أحدث الطلبات</h3>
                      <p className="hidden text-sm text-slate-500 sm:block">الطلبات الواردة مؤخراً للمتجر</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:gap-1.5 sm:px-4 sm:text-sm"
                  >
                    الكل
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </div>
                
                <div className="p-0">
                  {data.recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 sm:py-16">
                      <Package className="mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
                      <p className="text-sm">لا توجد طلبات حديثة</p>
                    </div>
                  ) : (
                    <>
                      {/* بطاقات الجوال */}
                      <div className="divide-y divide-slate-100 md:hidden">
                        {data.recentOrders.map((o) => (
                          <div key={o._id} className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">{o.fullName}</p>
                                <a href={`tel:${o.phone}`} className="mt-0.5 block text-sm font-medium text-sky-600" dir="ltr">
                                  {o.phone}
                                </a>
                              </div>
                              <StatusBadge status={o.status} />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                                {formatPrice(o.totalPrice)}
                              </span>
                              <span className="text-xs text-slate-500">{formatDate(o.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* جدول سطح المكتب */}
                      <div className="admin-table-scroll hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[640px] text-right">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              <th className="p-4 pr-6"># الطلب</th>
                              <th className="p-4">الزبون</th>
                              <th className="p-4">الهاتف</th>
                              <th className="p-4">المبلغ</th>
                              <th className="p-4">الحالة</th>
                              <th className="p-4 pl-6">التاريخ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {data.recentOrders.map((o) => (
                              <tr key={o._id} className="transition-colors hover:bg-slate-50/80">
                                <td className="whitespace-nowrap p-4 pr-6">
                                  <span className="rounded bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                                    {String(o._id).slice(-8)}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap p-4">
                                  <div className="font-semibold text-slate-800">{o.fullName}</div>
                                </td>
                                <td className="whitespace-nowrap p-4">
                                  <a href={`tel:${o.phone}`} className="font-medium text-sky-600 hover:text-sky-700 hover:underline" dir="ltr">
                                    {o.phone}
                                  </a>
                                </td>
                                <td className="whitespace-nowrap p-4">
                                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                                    {formatPrice(o.totalPrice)}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap p-4">
                                  <StatusBadge status={o.status} />
                                </td>
                                <td className="whitespace-nowrap p-4 pl-6 text-sm text-slate-500">
                                  {formatDate(o.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Products - Spans 1 column */}
            <div className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl sm:border-white sm:bg-white/70 sm:p-1 sm:shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:backdrop-blur-md lg:col-span-1">
              <div className="flex h-full flex-1 flex-col sm:rounded-[20px] sm:bg-white">
                <div className="border-b border-slate-100 p-4 sm:p-6">
                  <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 sm:h-12 sm:w-12">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 sm:text-lg">الأكثر مبيعاً</h3>
                      <p className="hidden text-sm text-slate-500 sm:block">المنتجات الأكثر طلباً</p>
                    </div>
                  </div>
                  
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {(["today", "month", "all"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTopPeriod(p)}
                        className={`min-h-[40px] flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-300 sm:px-3 ${
                          topPeriod === p
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 active:bg-slate-200/50"
                        }`}
                      >
                        {p === "today" ? "اليوم" : p === "month" ? "الشهر" : "الكل"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-3 sm:p-4">
                  {(() => {
                    const list =
                      topPeriod === "today"
                        ? data.topProductsToday
                        : topPeriod === "month"
                        ? data.topProductsMonth
                        : data.topProductsAll;
                    return list.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center py-8 text-slate-400 sm:py-10">
                        <Award className="mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm">لا توجد بيانات متاحة هنا</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {list.map((p, i) => (
                          <div
                            key={p.name}
                            className="flex items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 sm:p-3 sm:hover:border-slate-100 sm:hover:bg-slate-50"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold shadow-inner ${
                                i === 0 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" : 
                                i === 1 ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" :
                                i === 2 ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200" :
                                "border border-slate-100 bg-slate-50 text-slate-500"
                              }`}>
                                {i + 1}
                              </div>
                              <span className="line-clamp-1 font-semibold text-slate-700" title={p.name}>{p.name}</span>
                            </div>
                            <span className="shrink-0 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm sm:px-3 sm:py-1.5">
                              {p.totalQty} 
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Grid */}
          <section>
            <h2 className="mb-4 text-base font-bold text-slate-800 sm:mb-6 sm:bg-clip-text sm:text-xl sm:text-transparent sm:bg-gradient-to-r sm:from-slate-900 sm:to-slate-600">
              روابط سريعة
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Link href="/admin/accounts" className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm active:scale-[0.98] sm:flex-row sm:items-center sm:gap-5 sm:border-white sm:bg-white/60 sm:p-5 sm:backdrop-blur-md sm:hover:-translate-y-1 sm:hover:bg-white sm:hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:h-14 sm:w-14 sm:transition-transform sm:group-hover:scale-110 sm:group-hover:bg-violet-600 sm:group-hover:text-white">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">الحسابات</p>
                  <p className="text-xl font-bold text-slate-900 sm:text-2xl">{data.stats.totalAccounts}</p>
                </div>
              </Link>
              
              <Link href="/admin/accessories/create" className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm active:scale-[0.98] sm:flex-row sm:items-center sm:gap-5 sm:border-white sm:bg-white/60 sm:p-5 sm:backdrop-blur-md sm:hover:-translate-y-1 sm:hover:bg-white sm:hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600 sm:h-14 sm:w-14 sm:transition-transform sm:group-hover:scale-110 sm:group-hover:bg-pink-600 sm:group-hover:text-white">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">المنتجات</p>
                  <p className="text-xl font-bold text-slate-900 sm:text-2xl">{data.stats.totalProducts}</p>
                </div>
              </Link>
              
              <Link href="/admin/phones/create" className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm active:scale-[0.98] sm:flex-row sm:items-center sm:gap-5 sm:border-white sm:bg-white/60 sm:p-5 sm:backdrop-blur-md sm:hover:-translate-y-1 sm:hover:bg-white sm:hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 sm:h-14 sm:w-14 sm:transition-transform sm:group-hover:scale-110 sm:group-hover:bg-cyan-600 sm:group-hover:text-white">
                  <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">الهواتف</p>
                  <p className="text-xl font-bold text-slate-900 sm:text-2xl">{data.stats.phoneModels}</p>
                </div>
              </Link>
              
              <Link href="/admin/spare-parts" className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm active:scale-[0.98] sm:flex-row sm:items-center sm:gap-5 sm:border-white sm:bg-white/60 sm:p-5 sm:backdrop-blur-md sm:hover:-translate-y-1 sm:hover:bg-white sm:hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 sm:h-14 sm:w-14 sm:transition-transform sm:group-hover:scale-110 sm:group-hover:bg-rose-600 sm:group-hover:text-white">
                  <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">قطع الغيار</p>
                  <p className="text-xl font-bold text-slate-900 sm:text-2xl">{data.stats.spareParts}</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Inline CSS Animation Definitions */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fade-in-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}} />
        </div>
      ) : null}
    </div>
  );
}

