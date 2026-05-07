"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, Loader2, ChevronDown, ChevronLeft, Calendar, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";

type ArchiveMonth = {
  year: number;
  month: number;
  totalOrders: number;
  totalSales: number;
  daysCount: number;
};

type ArchiveDay = {
  day: number;
  date: string;
  orderCount: number;
  totalSales: number;
};

type ArchivedOrder = {
  orderId: string;
  fullName: string;
  phone: string;
  wilaya: string;
  address: string;
  status: string;
  paymentMethod: string;
  totalPrice: number;
  completedAt: string;
  items: { name: string; quantity: number; price: number }[];
};

type DayOrdersResponse = {
  orders: ArchivedOrder[];
  total: number;
  page: number;
  totalPages: number;
};

const MONTH_NAMES: Record<number, string> = {
  1: "يناير",
  2: "فبراير",
  3: "مارس",
  4: "أبريل",
  5: "مايو",
  6: "يونيو",
  7: "يوليو",
  8: "أغسطس",
  9: "سبتمبر",
  10: "أكتوبر",
  11: "نوفمبر",
  12: "ديسمبر",
};

function formatPrice(n: number) {
  return `${new Intl.NumberFormat("ar-DZ").format(n || 0)} دج`;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-DZ", {
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

export default function ArchivePage() {
  const [months, setMonths] = useState<ArchiveMonth[]>([]);
  const [daysByMonth, setDaysByMonth] = useState<Record<string, ArchiveDay[]>>({});
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [dayOrders, setDayOrders] = useState<Record<string, DayOrdersResponse>>({});
  const [daySearch, setDaySearch] = useState<Record<string, string>>({});
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingDaysKey, setLoadingDaysKey] = useState<string | null>(null);
  const [loadingOrdersKey, setLoadingOrdersKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMonths = useCallback(async () => {
    setLoadingMonths(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/archive/months`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) setError("يجب تسجيل الدخول");
        else setError("فشل في جلب الأشهر");
        return;
      }
      const json = await res.json();
      const loadedMonths = Array.isArray(json?.months) ? json.months : [];
      setMonths(loadedMonths);
      if (loadedMonths.length > 0) {
        const firstMonthKey = `${loadedMonths[0].year}-${loadedMonths[0].month}`;
        setExpandedMonth(firstMonthKey);
      }
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoadingMonths(false);
      setLoading(false);
    }
  }, []);

  const fetchDays = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (daysByMonth[key]) return;
    setLoadingDaysKey(key);
    try {
      const res = await fetch(`${API_URL}/api/admin/archive/${year}/${month}/days`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      const days = Array.isArray(json?.days) ? json.days : [];
      setDaysByMonth((prev) => ({ ...prev, [key]: days }));
    } finally {
      setLoadingDaysKey(null);
    }
  }, [daysByMonth]);

  const fetchOrdersByDay = useCallback(
    async (year: number, month: number, day: number, page = 1) => {
      const key = `${year}-${month}-${day}`;
      setLoadingOrdersKey(key);
      const search = (daySearch[key] || "").trim();
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (search) params.set("search", search);

      try {
        const res = await fetch(
          `${API_URL}/api/admin/archive/${year}/${month}/${day}/orders?${params.toString()}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (!res.ok) return;
        const json = await res.json();
        setDayOrders((prev) => ({
          ...prev,
          [key]: {
            orders: Array.isArray(json?.orders) ? json.orders : [],
            total: Number(json?.total) || 0,
            page: Number(json?.page) || 1,
            totalPages: Number(json?.totalPages) || 1,
          },
        }));
      } finally {
        setLoadingOrdersKey(null);
      }
    },
    [daySearch]
  );

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  useEffect(() => {
    if (!expandedMonth) return;
    const [year, month] = expandedMonth.split("-").map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    fetchDays(year, month);
  }, [expandedMonth, fetchDays]);

  if (loading || loadingMonths) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader
          title="أرشيف المبيعات"
          description="بيانات المبيعات التاريخية منظّمة حسب السنة والشهر واليوم"
          icon={<Archive className="h-5 w-5" />}
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-20 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
          <p className="text-slate-500">جاري تحميل الأرشيف...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader title="أرشيف المبيعات" icon={<Archive className="h-5 w-5" />} />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHeader
        title="أرشيف المبيعات"
        description="أرشيف احترافي: شهر → يوم → طلبات مكتملة مع بحث وترتيب من الأحدث"
        icon={<Archive className="h-5 w-5" />}
      />

      {months.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Archive className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">لا توجد بيانات أرشيف بعد</p>
          <p className="mt-1 text-sm text-slate-500">
            سيتم تخزين البيانات تلقائياً عند وضع الطلبات كمكتملة
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {months.map((monthData) => {
            const monthKey = `${monthData.year}-${monthData.month}`;
            const isMonthExpanded = expandedMonth === monthKey;
            const monthDays = daysByMonth[monthKey] || [];
            return (
            <div
              key={monthKey}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setExpandedMonth(isMonthExpanded ? null : monthKey)}
                className="flex w-full items-center justify-between px-6 py-4 text-right transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition ${
                      isMonthExpanded ? "rotate-180" : ""
                    }`}
                  />
                  <span className="text-lg font-bold text-slate-800">
                    {MONTH_NAMES[monthData.month] || monthData.month} {monthData.year}
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  {monthData.totalOrders} طلب • {formatPrice(monthData.totalSales)}
                </span>
              </button>
              {isMonthExpanded && (
                <div className="border-t border-slate-100 p-4">
                  {loadingDaysKey === monthKey ? (
                    <div className="flex items-center gap-2 py-6 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري تحميل أيام الشهر...
                    </div>
                  ) : monthDays.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">لا توجد أيام فيها طلبات مكتملة.</p>
                  ) : (
                    <div className="space-y-3">
                      {monthDays.map((dayInfo) => {
                        const dayKey = `${monthData.year}-${monthData.month}-${dayInfo.day}`;
                        const isDayExpanded = expandedDay === dayKey;
                        const dayData = dayOrders[dayKey];
                        return (
                          <div key={dayKey} className="rounded-lg border border-slate-200 bg-slate-50/50">
                            <button
                              type="button"
                              onClick={() => {
                                if (isDayExpanded) {
                                  setExpandedDay(null);
                                  return;
                                }
                                setExpandedDay(dayKey);
                                fetchOrdersByDay(monthData.year, monthData.month, dayInfo.day, 1);
                              }}
                              className="flex w-full items-center justify-between px-4 py-3"
                            >
                              <span className="flex items-center gap-2 font-semibold text-slate-800">
                                <ChevronLeft className={`h-4 w-4 transition ${isDayExpanded ? "-rotate-90" : ""}`} />
                                <Calendar className="h-4 w-4 text-slate-500" />
                                {formatDateTime(dayInfo.date)}
                              </span>
                              <span className="text-sm text-slate-600">
                                {dayInfo.orderCount} طلب • {formatPrice(dayInfo.totalSales)}
                              </span>
                            </button>

                            {isDayExpanded && (
                              <div className="space-y-4 border-t border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                      type="text"
                                      value={daySearch[dayKey] || ""}
                                      onChange={(e) =>
                                        setDaySearch((prev) => ({ ...prev, [dayKey]: e.target.value }))
                                      }
                                      placeholder="بحث داخل طلبات هذا اليوم (اسم، هاتف، منتج...)"
                                      className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      fetchOrdersByDay(monthData.year, monthData.month, dayInfo.day, 1)
                                    }
                                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                  >
                                    بحث
                                  </button>
                                </div>

                                {loadingOrdersKey === dayKey ? (
                                  <div className="flex items-center gap-2 py-6 text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جاري تحميل الطلبات...
                                  </div>
                                ) : !dayData || dayData.orders.length === 0 ? (
                                  <p className="text-sm text-slate-500">لا توجد طلبات مطابقة.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {dayData.orders.map((order, index) => (
                                      <div key={order.orderId || index} className="rounded-xl border border-slate-200 p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                          <div className="font-bold text-slate-800">
                                            ORDER #{String(order.orderId || "").slice(-8) || "------"}
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <span>مكتمل</span>
                                            <span>•</span>
                                            <span>الدفع عند الاستلام</span>
                                          </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                          <div className="rounded-lg bg-slate-50 p-3 text-sm">
                                            <div className="mb-1 font-semibold text-slate-700">معلومات الزبون</div>
                                            <div>{order.fullName}</div>
                                            <div dir="ltr">{order.phone}</div>
                                            <div>{order.wilaya}</div>
                                            <div>{order.address}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                              {formatDateTime(order.completedAt)}
                                            </div>
                                          </div>

                                          <div className="rounded-lg bg-slate-50 p-3 text-sm">
                                            <div className="mb-1 font-semibold text-slate-700">المنتجات</div>
                                            <ul className="space-y-1">
                                              {order.items.map((item, idx) => (
                                                <li key={`${item.name}-${idx}`} className="flex justify-between gap-3">
                                                  <span>{item.name} ×{item.quantity}</span>
                                                  <span>{formatPrice(item.price * item.quantity)}</span>
                                                </li>
                                              ))}
                                            </ul>
                                            <div className="mt-2 border-t border-slate-200 pt-2 text-left font-bold text-emerald-700">
                                              {formatPrice(order.totalPrice)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-xs text-slate-500">
                                        الصفحة {dayData.page} من {dayData.totalPages} • {dayData.total} طلب
                                      </span>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          disabled={dayData.page <= 1}
                                          onClick={() =>
                                            fetchOrdersByDay(
                                              monthData.year,
                                              monthData.month,
                                              dayInfo.day,
                                              dayData.page - 1
                                            )
                                          }
                                          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                                        >
                                          السابق
                                        </button>
                                        <button
                                          type="button"
                                          disabled={dayData.page >= dayData.totalPages}
                                          onClick={() =>
                                            fetchOrdersByDay(
                                              monthData.year,
                                              monthData.month,
                                              dayInfo.day,
                                              dayData.page + 1
                                            )
                                          }
                                          className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                                        >
                                          التالي
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
