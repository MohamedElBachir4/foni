"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Package, RefreshCw, Truck, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { apiUrl } from "@/lib/apiUrl";
import { publicFetch } from "@/lib/publicFetch";
import { useAccount } from "@/context/AccountContext";
import { formatDzd } from "@/lib/pricing";
import type { CustomerOrder, CustomerOrderItem } from "@/components/accounts/MyOrdersTab";

const POLL_MS = 20_000;

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
    case "call_1":
      return "اتصال 1";
    case "call_2":
      return "اتصال 2";
    case "no_answer":
      return "لم يتم الرد";
    case "contacted":
      return "تم التواصل";
    case "pending":
    default:
      return "قيد الانتظار";
  }
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

function OrderTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const isInProgress =
    status === "pending" ||
    status === "call_1" ||
    status === "call_2" ||
    status === "no_answer" ||
    status === "contacted" ||
    !status;

  const steps = [
    {
      key: "placed",
      title: "تم تسجيل الطلب",
      desc: "تم استلام طلبك بنجاح",
      done: true,
      current: false,
      danger: false,
    },
    {
      key: "process",
      title: "قيد المعالجة",
      desc: "يتم تجهيز الطلب لدى المتجر",
      done: isCompleted || isCancelled,
      current: isInProgress && !isCompleted && !isCancelled,
      danger: false,
    },
    {
      key: "final",
      title: isCancelled ? "تم الإلغاء" : "اكتمال الطلب",
      desc: isCancelled
        ? "تم إلغاء هذا الطلب"
        : isCompleted
          ? "تم إكمال الطلب"
          : "بانتظار تأكيد الإكمال من المتجر",
      done: isCompleted || isCancelled,
      current: false,
      danger: isCancelled,
    },
  ];

  return (
    <ol className="relative space-y-0 border-r-2 border-slate-200 pr-6">
      {steps.map((step) => {
        const dotClass = step.danger
          ? "bg-rose-500 ring-rose-200"
          : step.done
            ? "bg-emerald-500 ring-emerald-200"
            : step.current
              ? "bg-amber-500 ring-amber-200"
              : "bg-slate-200 ring-slate-100";
        return (
          <li key={step.key} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -right-[9px] top-1 flex h-4 w-4 rounded-full border-2 border-white ring-2 ${dotClass}`}
            />
            <div className={step.current ? "rounded-xl bg-blue-50/80 px-3 py-2" : ""}>
              <p
                className={`text-sm font-bold ${
                  step.danger ? "text-rose-800" : step.done ? "text-emerald-900" : "text-slate-800"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-slate-600">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ShippingTimeline({ status, cancelled }: { status: string; cancelled?: boolean }) {
  const stage = shippingStepFromStatus(status);
  const steps = ["تم الطلب", "قيد التحضير", "في الطريق", "تم التسليم"];

  return (
    <div>
      {cancelled ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          تم إلغاء الطلب، لذلك تتبع الشحنة متوقف.
        </div>
      ) : null}
      <ol className="relative space-y-0 border-r-2 border-slate-200 pr-6">
        {steps.map((step, idx) => {
          const done = idx <= stage;
          const current = idx === stage;
          return (
            <li key={step} className="relative pb-7 last:pb-0">
              <span
                className={`absolute -right-[9px] top-1 flex h-4 w-4 rounded-full border-2 border-white ring-2 ${
                  done ? "bg-emerald-500 ring-emerald-200" : "bg-slate-200 ring-slate-100"
                }`}
              />
              <div className={current ? "rounded-xl bg-blue-50 px-3 py-2" : ""}>
                <p className={`text-sm font-bold ${done ? "text-emerald-900" : "text-slate-700"}`}>
                  {done ? "✔ " : ""}
                  {step}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function AccountOrderDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { getAuthToken } = useAccount();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const fetchTracking = useCallback(async () => {
    const t = getAuthToken();
    if (!t || !id) return;
    setTrackingLoading(true);
    setTrackingError("");
    try {
      const res = await publicFetch(apiUrl(`/api/orders/${id}/tracking`), {
        headers: { Authorization: `Bearer ${t}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر تحميل تتبع الشحنة من ياليدين");
      setTracking(data as TrackingResponse);
    } catch (e) {
      setTrackingError(e instanceof Error ? e.message : "خطأ في التتبع");
    } finally {
      setTrackingLoading(false);
    }
  }, [getAuthToken, id]);

  const fetchOrder = useCallback(async () => {
    const t = getAuthToken();
    if (!t || !id) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const res = await publicFetch(apiUrl(`/api/orders/mine/${id}`), {
        headers: { Authorization: `Bearer ${t}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر تحميل الطلب");
      setOrder(data as CustomerOrder);
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, id]);

  useEffect(() => {
    setLoading(true);
    fetchOrder().then(() => fetchTracking());
  }, [fetchOrder, fetchTracking]);

  useEffect(() => {
    if (!id || !getAuthToken()) return;
    const iv = setInterval(() => {
      fetchOrder();
      fetchTracking();
    }, POLL_MS);
    return () => clearInterval(iv);
  }, [id, getAuthToken, fetchOrder, fetchTracking]);

  const shippingStatus =
    tracking?.status || order?.yalidineStatus || "";
  const trackingNumber =
    tracking?.tracking || order?.yalidineTracking || "";
  const labelUrl = tracking?.labelUrl || order?.yalidineLabelUrl || "";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 pb-24 pt-28 sm:px-4 sm:pt-32">
        <Link
          href="/accounts?tab=orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى طلباتي
        </Link>

        {loading && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
            جاري تحميل تفاصيل الطلب…
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {!loading && order && (
          <div className="space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">رقم الطلب</p>
                  <h1 className="font-mono text-lg font-bold text-slate-900 sm:text-xl" dir="ltr">
                    {order._id}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString("ar-DZ", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : ""}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                      order.status === "completed"
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : order.status === "cancelled"
                          ? "bg-rose-50 text-rose-800 ring-rose-200"
                          : "bg-amber-50 text-amber-900 ring-amber-200"
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <p className="mt-2 text-2xl font-black text-blue-600">
                    {formatDzd(Number(order.totalPrice) || 0)} DA
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    يُحدَّث التتبع تلقائياً
                    {lastSync
                      ? ` — آخر تحديث: ${lastSync.toLocaleTimeString("ar-DZ")}`
                      : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      fetchOrder().then(() => fetchTracking());
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تحديث الآن
                  </button>
                </div>
              </div>
            </header>

            {/* تتبع ياليدين */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Truck className="h-5 w-5 text-blue-600" />
                  تتبع الشحنة عبر ياليدين
                </h2>
                <button
                  type="button"
                  onClick={() => fetchTracking()}
                  disabled={trackingLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${trackingLoading ? "animate-spin" : ""}`} />
                  تحديث التتبع
                </button>
              </div>

              {trackingLoading && !tracking ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                  جاري جلب بيانات التتبع من ياليدين…
                </p>
              ) : null}

              {trackingError && !trackingNumber ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {trackingError}
                </p>
              ) : null}

              {!trackingNumber ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  لا يوجد رقم تتبع بعد. سيظهر هنا تلقائياً بعد إرسال الطلب إلى ياليدين من المتجر.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">رقم التتبع</p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900" dir="ltr">
                        {trackingNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">حالة الشحنة</p>
                      <p className="mt-1 text-sm font-bold text-blue-800">
                        {shippingStatus || "قيد المعالجة"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">آخر تحديث</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {tracking?.lastUpdate
                          ? new Date(tracking.lastUpdate).toLocaleString("ar-DZ", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {labelUrl ? (
                      <a
                        href={labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        ملصق الشحن
                      </a>
                    ) : null}
                    <a
                      href={`https://www.yalidine.app/tracking?tracking=${encodeURIComponent(trackingNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      تتبع على موقع ياليدين
                    </a>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-4 text-sm font-extrabold text-slate-900">مسار الشحنة</h3>
                    <ShippingTimeline
                      status={shippingStatus}
                      cancelled={order.status === "cancelled"}
                    />
                  </div>

                  {tracking?.history && tracking.history.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <h3 className="mb-3 text-sm font-extrabold text-slate-900">سجل التتبع (ياليدين)</h3>
                      <ul className="space-y-2">
                        {[...tracking.history].reverse().map((row) => (
                          <li
                            key={row.id}
                            className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
                          >
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
                  ) : trackingLoading ? (
                    <p className="text-xs text-slate-500">جاري تحديث سجل التتبع…</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      سيظهر سجل حركة الشحنة هنا بعد بدء معالجتها لدى ياليدين.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <Package className="h-5 w-5 text-blue-600" />
                مراحل الطلب لدى المتجر
              </h2>
              <OrderTimeline status={order.status} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900">المنتجات</h2>
              <ul className="space-y-4">
                {(order.items || []).map((it: CustomerOrderItem, idx: number) => (
                  <li
                    key={`${order._id}-line-${idx}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <p className="font-semibold text-slate-900">
                      {it.option ? `${it.name} - ${it.option}` : it.name}
                    </p>
                    {it.variantSelections && it.variantSelections.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {it.variantSelections.map((v) => (
                          <li key={v.label}>
                            {v.label} × {v.quantity} —{" "}
                            {formatDzd(Number(v.price) * Number(v.quantity))} DA
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {it.color ? (
                      <p className="mt-0.5 text-xs text-slate-500">اللون: {it.color}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-600">
                      {it.variantSelections && it.variantSelections.length > 0 ? (
                        <>
                          المجموع:{" "}
                          <span className="font-bold text-slate-800">
                            {formatDzd(
                              it.variantSelections.reduce(
                                (s, v) => s + Number(v.price) * Number(v.quantity),
                                0
                              )
                            )}{" "}
                            DA
                          </span>
                        </>
                      ) : (
                        <>
                          {it.quantity} × {formatDzd(Number(it.price) || 0)} DA ={" "}
                          <span className="font-bold text-slate-800">
                            {formatDzd(Number(it.price) * Number(it.quantity))} DA
                          </span>
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
