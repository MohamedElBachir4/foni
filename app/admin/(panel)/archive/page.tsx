"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, Loader2, ChevronDown, ChevronLeft, Calendar, TrendingUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";

type DayData = {
  day: number;
  date: string;
  totalSales: number;
  orderCount: number;
  products: { name: string; quantity: number }[];
};

type MonthData = {
  month: number;
  totalSales: number;
  orderCount: number;
  topProducts: { name: string; quantity: number }[];
  days: DayData[];
};

type YearData = {
  year: number;
  months: MonthData[];
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
  return new Intl.NumberFormat("ar-DZ").format(n) + " دج";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ArchivePage() {
  const [data, setData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const fetchArchive = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/archive`, {
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (!res.ok) {
        if (res.status === 401) setError("يجب تسجيل الدخول");
        else setError("فشل في جلب الأرشيف");
        return;
      }
      const json = await res.json();
      setData(json);
      if (json.length > 0) setExpandedYear(json[0].year);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  if (loading) {
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
        description="بيانات المبيعات التاريخية من الطلبات المكتملة، منظّمة حسب السنة → الشهر → اليوم"
        icon={<Archive className="h-5 w-5" />}
      />

      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Archive className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">لا توجد بيانات أرشيف بعد</p>
          <p className="mt-1 text-sm text-slate-500">
            سيتم تخزين البيانات تلقائياً عند وضع الطلبات كمكتملة
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((yearData) => (
            <div
              key={yearData.year}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedYear(expandedYear === yearData.year ? null : yearData.year)
                }
                className="flex w-full items-center justify-between px-6 py-4 text-right transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition ${
                      expandedYear === yearData.year ? "rotate-180" : ""
                    }`}
                  />
                  <span className="text-lg font-bold text-slate-800">{yearData.year}</span>
                </span>
                <span className="text-sm text-slate-500">
                  {yearData.months.length} شهر
                </span>
              </button>
              {expandedYear === yearData.year && (
                <div className="border-t border-slate-100 p-4">
                  {yearData.months.map((monthData) => {
                    const monthKey = `${yearData.year}-${monthData.month}`;
                    const isExpanded = expandedMonth === monthKey;
                    return (
                      <div
                        key={monthKey}
                        className="mb-4 rounded-lg border border-slate-100 bg-slate-50/50 last:mb-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMonth(isExpanded ? null : monthKey)
                          }
                          className="flex w-full items-center justify-between px-4 py-3 text-right"
                        >
                          <span className="flex items-center gap-2">
                            <ChevronLeft
                              className={`h-4 w-4 text-slate-500 transition ${
                                isExpanded ? "-rotate-90" : "rotate-0"
                              }`}
                            />
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="font-semibold text-slate-800">
                              {MONTH_NAMES[monthData.month] || monthData.month}
                            </span>
                          </span>
                          <span className="text-sm text-slate-600">
                            {formatPrice(monthData.totalSales)} • {monthData.orderCount} طلب
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="space-y-4 border-t border-slate-200 px-4 py-3">
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                أكثر المنتجات مبيعاً
                              </h4>
                              {monthData.topProducts.length === 0 ? (
                                <p className="text-sm text-slate-500">لا توجد بيانات</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {monthData.topProducts.slice(0, 5).map((p, i) => (
                                    <div
                                      key={p.name}
                                      className="flex justify-between rounded bg-white px-3 py-2 text-sm"
                                    >
                                      <span className="text-slate-800">
                                        {i + 1}. {p.name}
                                      </span>
                                      <span className="font-medium text-emerald-600">
                                        {p.quantity} وحدة
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                الأيام
                              </h4>
                              <div className="space-y-2">
                                {monthData.days.map((dayData) => (
                                  <div
                                    key={dayData.day}
                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                  >
                                    <div className="flex justify-between">
                                      <span className="font-medium text-slate-800">
                                        {formatDate(dayData.date)}
                                      </span>
                                      <span className="text-sm text-slate-600">
                                        {formatPrice(dayData.totalSales)} • {dayData.orderCount}{" "}
                                        طلب
                                      </span>
                                    </div>
                                    {dayData.products.length > 0 && (
                                      <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                                        {dayData.products.map((p) => (
                                          <li
                                            key={p.name}
                                            className="flex justify-between text-xs text-slate-600"
                                          >
                                            <span>{p.name}</span>
                                            <span>{p.quantity} وحدة</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
