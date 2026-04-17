"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone,
  Package,
  ShoppingCart,
  LayoutDashboard,
  TrendingUp,
  Calendar,
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
import { AdminCard, AdminTable } from "@/components/admin";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";

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
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function StatusBadge({ status }: { status?: string }) {
  const s = status || "pending";
  const cls = statusColors[s] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
  const labels: Record<string, string> = {
    pending: "قيد الانتظار",
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
    className={`group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}
    style={{ animation: `fade-in-up 0.6s ease-out ${delay}s both` }}
  >
    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40 ${gradientCls}`} />
    
    <div className="relative flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wide text-slate-500">{title}</p>
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 group-hover:bg-gradient-to-l group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300" 
            style={{ backgroundImage: `linear-gradient(to left, var(--tw-gradient-stops))` }}>
          <span className={gradientCls}>{value}</span>
        </h3>
      </div>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${iconColor}`}>
        {icon}
      </div>
    </div>
  </div>
);

type TopPeriod = "today" | "month" | "all";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topPeriod, setTopPeriod] = useState<TopPeriod>("today");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard-stats`, {
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (!res.ok) {
        if (res.status === 401) setError("يجب تسجيل الدخول");
        else setError("فشل في جلب الإحصائيات");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8 pb-10">
      
      {/* Premium Header Profile Area */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-sky-900 via-indigo-900 to-purple-900 px-8 py-10 shadow-2xl sm:px-12 sm:py-14">
        {/* Decorative background elements */}
        <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-sky-500/20 blur-[100px]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-20 h-[200px] w-[200px] rounded-full bg-rose-500/20 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-sky-200 backdrop-blur-md border border-white/10 mb-4 shadow-xl">
              <Activity className="h-4 w-4" />
              <span>نظام إدارة المتجر نشط</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-lg">
              مرحباً بعودتك، <span className="text-transparent bg-clip-text bg-gradient-to-l from-sky-400 to-emerald-400">أدمن</span> 👋
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300 leading-relaxed drop-shadow-sm">
              إليك نظرة شاملة على أداء المتجر، المبيعات الأخيرة، وإحصائيات المنتجات لهذا اليوم.
            </p>
          </div>
          
          <div className="flex shrink-0 gap-3">
            <Link href="/admin/orders" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition-all hover:bg-sky-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95">
              <ShoppingCart className="h-4 w-4" />
              عرض الطلبات
            </Link>
            <Link href="/admin/phones/create" className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105 active:scale-95">
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
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                نظرة عامة على المبيعات والأداء
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="مبيعات اليوم"
                value={formatPrice(data.stats.salesToday)}
                icon={<TrendingUp className="h-6 w-6" />}
                gradientCls="from-emerald-400 to-emerald-600"
                iconColor="text-emerald-500 shadow-emerald-500/20"
                delay={0.1}
              />
              <StatCard
                title="مبيعات هذا الشهر"
                value={formatPrice(data.stats.salesMonth)}
                icon={<CreditCard className="h-6 w-6" />}
                gradientCls="from-blue-500 to-indigo-600"
                iconColor="text-indigo-500 shadow-indigo-500/20"
                delay={0.2}
              />
              <StatCard
                title="الطلبات قيد الانتظار"
                value={data.stats.pendingOrders}
                icon={<Clock className="h-6 w-6" />}
                gradientCls="from-amber-400 to-orange-500"
                iconColor="text-amber-500 shadow-amber-500/20"
                delay={0.3}
              />
              <StatCard
                title="الطلبات المكتملة (اليوم)"
                value={data.stats.completedToday}
                icon={<CheckCircle className="h-6 w-6" />}
                gradientCls="from-teal-400 to-emerald-500"
                iconColor="text-teal-500 shadow-teal-500/20"
                delay={0.4}
              />
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Orders - Spans 2 columns */}
            <div className="lg:col-span-2 group relative rounded-3xl border border-white bg-white/70 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:bg-white/90">
              <div className="flex flex-col h-full rounded-[20px] bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">أحدث الطلبات</h3>
                      <p className="text-sm text-slate-500">الطلبات الواردة مؤخراً للمتجر</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="group/link flex items-center gap-1.5 rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    عرض الكل
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover/link:-translate-x-1" />
                  </Link>
                </div>
                
                <div className="p-0">
                  {data.recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Package className="h-12 w-12 mb-4 opacity-50" />
                      <p>لا توجد طلبات حديثة في الوقت الحالي</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
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
                                <a href={`tel:${o.phone}`} className="text-sky-600 hover:text-sky-700 hover:underline font-medium" dir="ltr">
                                  {o.phone}
                                </a>
                              </td>
                              <td className="whitespace-nowrap p-4">
                                <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-sm">
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
                  )}
                </div>
              </div>
            </div>

            {/* Top Products - Spans 1 column */}
            <div className="lg:col-span-1 group relative rounded-3xl border border-white bg-white/70 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:bg-white/90 flex flex-col">
              <div className="flex flex-col h-full rounded-[20px] bg-white flex-1">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">الأكثر مبيعاً</h3>
                      <p className="text-sm text-slate-500">المنتجات الأكثر طلباً</p>
                    </div>
                  </div>
                  
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {(["today", "month", "all"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTopPeriod(p)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 ${
                          topPeriod === p
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                      >
                        {p === "today" ? "اليوم" : p === "month" ? "هذا الشهر" : "الكل"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 flex-1">
                  {(() => {
                    const list =
                      topPeriod === "today"
                        ? data.topProductsToday
                        : topPeriod === "month"
                        ? data.topProductsMonth
                        : data.topProductsAll;
                    return list.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400 py-10">
                        <Award className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">لا توجد بيانات متاحة هنا</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {list.map((p, i) => (
                          <div
                            key={p.name}
                            className="group/item flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-slate-100 hover:bg-slate-50 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold shadow-inner ${
                                i === 0 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" : 
                                i === 1 ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" :
                                i === 2 ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200" :
                                "bg-slate-50 text-slate-500 border border-slate-100"
                              }`}>
                                {i + 1}
                              </div>
                              <span className="font-semibold text-slate-700 group-hover/item:text-slate-900 line-clamp-1 max-w-[140px]" title={p.name}>{p.name}</span>
                            </div>
                            <span className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
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
            <h2 className="mb-6 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              إحصائيات إضافية وروابط سريعة
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/accounts" className="group flex items-center gap-5 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-violet-200 group-hover:bg-violet-600 group-hover:text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">إجمالي الحسابات</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.totalAccounts}</p>
                </div>
              </Link>
              
              <Link href="/admin/products" className="group flex items-center gap-5 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-pink-200 group-hover:bg-pink-600 group-hover:text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.totalProducts}</p>
                </div>
              </Link>
              
              <Link href="/admin/phones" className="group flex items-center gap-5 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-200 group-hover:bg-cyan-600 group-hover:text-white">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">موديلات الهواتف</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.phoneModels}</p>
                </div>
              </Link>
              
              <Link href="/admin/spare-parts" className="group flex items-center gap-5 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-rose-200 group-hover:bg-rose-600 group-hover:text-white">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">قطع الغيار</p>
                  <p className="text-2xl font-bold text-slate-900">{data.stats.spareParts}</p>
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

