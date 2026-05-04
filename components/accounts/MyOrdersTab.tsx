"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Package,
  Truck,
  RefreshCw,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
} from "lucide-react";
import { apiUrl } from "@/lib/apiUrl";
import { publicFetch } from "@/lib/publicFetch";
import { useAccount } from "@/context/AccountContext";
import { formatDzd } from "@/lib/pricing";

export type CustomerOrderItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  option?: string;
  productType?: string;
};

export type CustomerOrder = {
  _id: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  items: CustomerOrderItem[];
  yalidineTracking?: string;
  yalidineLabelUrl?: string;
  yalidineStatus?: string;
};

type TrackingHistoryRow = {
  id: string;
  status: string;
  description?: string;
  location?: string;
  at?: string | null;
};

type TrackingResponse = {
  tracking: string;
  status: string;
  labelUrl: string;
  history: TrackingHistoryRow[];
  lastUpdate?: string | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "completed":
      return "مكتمل";
    case "cancelled":
      return "ملغى";
    case "pending":
    default:
      return "قيد المعالجة";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-800 ring-emerald-500/25";
    case "cancelled":
      return "bg-rose-500/10 text-rose-800 ring-rose-500/25";
    default:
      return "bg-amber-500/10 text-amber-950 ring-amber-500/25";
  }
}

function orderRef(id: string) {
  if (!id || id.length < 10) return id;
  return `…${id.slice(-10)}`;
}

function normalizeStatus(status: string) {
  return String(status || "").toLowerCase().trim();
}

function shippingStepFromStatus(status: string) {
  const s = normalizeStatus(status);
  if (!s) return 0;
  if (
    s.includes("delivered") ||
    s.includes("livr") ||
    s.includes("تم التسليم") ||
    s.includes("وصل")
  ) {
    return 3;
  }
  if (
    s.includes("route") ||
    s.includes("transit") ||
    s.includes("exped") ||
    s.includes("dispatch") ||
    s.includes("shipping") ||
    s.includes("in way") ||
    s.includes("في الطريق")
  ) {
    return 2;
  }
  if (
    s.includes("created") ||
    s.includes("pickup") ||
    s.includes("received") ||
    s.includes("accepted") ||
    s.includes("prepar") ||
    s.includes("تم إنشاء") ||
    s.includes("قيد التحضير")
  ) {
    return 1;
  }
  return 0;
}

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded-full bg-slate-200" />
          <div className="h-4 w-40 rounded-lg bg-slate-200" />
          <div className="h-3 w-28 rounded-full bg-slate-100" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          <div className="h-7 w-24 rounded-lg bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full max-w-xs rounded bg-slate-100" />
        <div className="h-3.5 w-full max-w-sm rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function MyOrdersTab() {
  const { getAuthToken } = useAccount();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<CustomerOrder | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);

  const load = useCallback(async () => {
    const t = getAuthToken();
    if (!t) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await publicFetch(apiUrl("/api/orders/mine?limit=50"), {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر تحميل الطلبات");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!trackingModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [trackingModalOpen]);

  const openTracking = useCallback(
    async (order: CustomerOrder) => {
      const t = getAuthToken();
      if (!t) return;
      setTrackingModalOpen(true);
      setTrackingOrder(order);
      setTrackingLoading(true);
      setTrackingError("");
      setTrackingData(null);
      try {
        const res = await publicFetch(apiUrl(`/api/orders/${order._id}/tracking`), {
          headers: { Authorization: `Bearer ${t}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "تعذر تحميل تتبع الطلب");
        setTrackingData(data as TrackingResponse);
      } catch (e) {
        setTrackingError(e instanceof Error ? e.message : "حدث خطأ أثناء جلب التتبع");
      } finally {
        setTrackingLoading(false);
      }
    },
    [getAuthToken]
  );

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const totalSpent = orders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
    return { pending, completed, totalSpent, count: orders.length };
  }, [orders]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] sm:rounded-3xl">
      {/* رأس القسم */}
      <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 px-5 py-7 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-[11px] font-bold text-blue-800 ring-1 ring-blue-600/15">
              <Receipt className="h-3.5 w-3.5" aria-hidden />
              سجل المشتريات
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              طلباتي
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600">
              راقب حالة طلباتك، أرقام التتبع، والتفاصيل في أي وقت. اضغط على أي طلب
              للاطلاع على المسار الكامل.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/80 hover:text-blue-900 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            تحديث القائمة
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:grid-cols-4 sm:gap-4 sm:px-6">
          <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              إجمالي الطلبات
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{stats.count}</p>
          </div>
          <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[11px] font-semibold text-amber-700">قيد المعالجة</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-amber-900">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-white bg-white/90 px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[11px] font-semibold text-emerald-700">مكتملة</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-emerald-900">{stats.completed}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white bg-gradient-to-l from-blue-600/5 to-indigo-600/5 px-3 py-3 shadow-sm sm:col-span-1 sm:px-4">
            <p className="text-[11px] font-semibold text-slate-600">إجمالي المبالغ (الظاهر)</p>
            <p className="mt-1 text-lg font-black text-blue-700 sm:text-xl" dir="ltr">
              {formatDzd(stats.totalSpent)} <span className="text-sm font-bold text-blue-600/80">DA</span>
            </p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {loading && (
          <div className="space-y-4">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-white px-5 py-8 text-center shadow-inner">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <XCircle className="h-8 w-8" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-rose-900">{error}</p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
              <Package className="h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-slate-900">لا توجد طلبات بعد</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              عند إتمام عملية شراء وأنت مسجّل الدخول، ستظهر طلباتك هنا مع إمكانية
              التتبع والاطلاع على التفاصيل.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-blue-600"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                تصفح المتجر
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                سلة الشراء
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((o) => {
              const date = o.createdAt ? new Date(o.createdAt) : null;
              const preview = (o.items || []).slice(0, 4);
              const nItems = o.items?.length || 0;
              const statusBorder =
                o.status === "completed"
                  ? "from-emerald-500"
                  : o.status === "cancelled"
                  ? "from-rose-500"
                  : "from-amber-500";

              return (
                <li key={o._id}>
                  <Link
                    href={`/accounts/orders/${o._id}`}
                    className="group relative flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-blue-200/80 hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.18)]"
                  >
                    <div
                      className={`absolute inset-y-3 right-0 w-1 rounded-full bg-gradient-to-b ${statusBorder} to-transparent opacity-90`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 p-4 pr-5 sm:p-5 sm:pr-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            رقم الطلب
                          </p>
                          <p
                            className="mt-1 font-mono text-sm font-bold text-slate-900 sm:text-base"
                            dir="ltr"
                            title={o._id}
                          >
                            {orderRef(o._id)}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                            {date && !Number.isNaN(date.getTime())
                              ? date.toLocaleString("ar-DZ", {
                                  dateStyle: "long",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${statusBadgeClass(
                              o.status
                            )}`}
                          >
                            {o.status === "completed" && (
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {o.status === "cancelled" && (
                              <XCircle className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {o.status === "pending" && (
                              <Clock className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {statusLabel(o.status)}
                          </span>
                          <div className="text-left sm:text-right">
                            <p className="text-[11px] font-medium text-slate-500">المجموع</p>
                            <p className="text-xl font-black tracking-tight text-blue-600 sm:text-2xl">
                              {formatDzd(Number(o.totalPrice) || 0)}{" "}
                              <span className="text-sm font-bold text-blue-500/90">DA</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold text-slate-500">
                          المنتجات ({nItems})
                        </p>
                        <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
                          {preview.map((it, idx) => (
                            <li
                              key={`${o._id}-${idx}`}
                              className="min-w-0 max-w-full rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 sm:max-w-[min(100%,20rem)] sm:px-3"
                            >
                              <p className="text-xs font-semibold text-slate-900">
                                {it.option ? `${it.name} - ${it.option}` : it.name}
                                <span className="me-1.5 text-[11px] font-normal text-slate-500">
                                  ×{it.quantity}
                                </span>
                              </p>
                            </li>
                          ))}
                          {nItems > 4 && (
                            <li className="flex min-h-9 items-center self-start rounded-lg border border-dashed border-slate-200 bg-white/60 px-2.5 text-xs font-semibold text-slate-500 sm:px-3">
                              +{nItems - 4} أخرى
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 pt-4">
                        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Truck className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            {o.yalidineTracking ? (
                              <span dir="ltr" className="font-mono font-medium text-slate-800">
                                {o.yalidineTracking}
                              </span>
                            ) : (
                              <span className="text-slate-500">بانتظار رقم التتبع</span>
                            )}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition group-hover:gap-2">
                          عرض التفاصيل
                          <ChevronLeft className="h-4 w-4 rotate-180 transition" aria-hidden />
                        </span>
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openTracking(o);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          تتبع الطلب
                        </button>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {trackingModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setTrackingModalOpen(false)}
            aria-label="إغلاق نافذة التتبع"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">تتبع الطلب</h3>
                <p className="text-xs text-slate-500" dir="ltr">
                  {trackingOrder?._id || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {trackingLoading && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                جاري تحميل بيانات التتبع...
              </p>
            )}

            {!trackingLoading && trackingError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800">
                {trackingError}
              </p>
            )}

            {!trackingLoading && !trackingError && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">رقم التتبع</p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900" dir="ltr">
                      {trackingData?.tracking || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">الحالة الحالية</p>
                    <p className="mt-1 text-sm font-bold text-blue-800">
                      {trackingData?.status || trackingOrder?.yalidineStatus || "قيد المعالجة"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">آخر تحديث</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {trackingData?.lastUpdate
                        ? new Date(trackingData.lastUpdate).toLocaleString("ar-DZ", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                {trackingData?.labelUrl ? (
                  <a
                    href={trackingData.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    فتح ملصق الشحن
                  </a>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-4 text-sm font-extrabold text-slate-900">حالة الشحنة</h4>
                  {trackingOrder?.status === "cancelled" ? (
                    <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                      تم إلغاء الطلب، لذلك تتبع الشحنة متوقف.
                    </div>
                  ) : null}
                  {(() => {
                    const stage = shippingStepFromStatus(
                      trackingData?.status || trackingOrder?.yalidineStatus || ""
                    );
                    const steps = [
                      "تم الطلب",
                      "قيد التحضير",
                      "في الطريق",
                      "تم التسليم",
                    ];
                    return (
                      <ol className="relative space-y-0 border-r-2 border-slate-200 pr-6">
                        {steps.map((step, idx) => {
                          const done = idx <= stage;
                          const current = idx === stage;
                          return (
                            <li key={step} className="relative pb-7 last:pb-0">
                              <span
                                className={`absolute -right-[9px] top-1 flex h-4 w-4 rounded-full border-2 border-white ring-2 ${
                                  done
                                    ? "bg-emerald-500 ring-emerald-200"
                                    : "bg-slate-200 ring-slate-100"
                                }`}
                              />
                              <div className={current ? "rounded-xl bg-blue-50 px-3 py-2" : ""}>
                                <p
                                  className={`text-sm font-bold ${
                                    done ? "text-emerald-900" : "text-slate-700"
                                  }`}
                                >
                                  {done ? "✔ " : ""}
                                  {step}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    );
                  })()}
                </div>

                {trackingData?.history && trackingData.history.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <h4 className="mb-3 text-sm font-extrabold text-slate-900">سجل التتبع</h4>
                    <ul className="space-y-2">
                      {trackingData.history.slice(-6).reverse().map((row) => (
                        <li key={row.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                          <p className="font-bold text-slate-800">{row.status}</p>
                          {(row.description || row.location) && (
                            <p className="mt-0.5 text-slate-600">
                              {[row.description, row.location].filter(Boolean).join(" — ")}
                            </p>
                          )}
                          {row.at ? (
                            <p className="mt-1 text-[11px] text-slate-500">
                              {new Date(row.at).toLocaleString("ar-DZ", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
