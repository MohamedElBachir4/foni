"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Package, RefreshCw, Truck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { apiUrl } from "@/lib/apiUrl";
import { useAccount } from "@/context/AccountContext";
import { formatDzd } from "@/lib/pricing";
import type { CustomerOrder, CustomerOrderItem } from "@/components/accounts/MyOrdersTab";

const POLL_MS = 12_000;

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

function OrderTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const isPending = status === "pending";

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
      current: isPending,
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

export default function AccountOrderDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { getAuthToken } = useAccount();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchOrder = useCallback(async () => {
    const t = getAuthToken();
    if (!t || !id) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/orders/mine/${id}`), {
        headers: { Authorization: `Bearer ${t}` },
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
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!id || !getAuthToken()) return;
    const iv = setInterval(() => {
      fetchOrder();
    }, POLL_MS);
    return () => clearInterval(iv);
  }, [id, getAuthToken, fetchOrder]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 pb-12 pt-28 sm:px-4 sm:pt-32">
        <Link
          href="/accounts"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى حسابي
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
                    يُحدَّث تلقائياً كل بضع ثوانٍ
                    {lastSync
                      ? ` — آخر تحديث: ${lastSync.toLocaleTimeString("ar-DZ")}`
                      : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      fetchOrder();
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تحديث الآن
                  </button>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <Package className="h-5 w-5 text-blue-600" />
                مراحل الطلب
              </h2>
              <OrderTimeline status={order.status} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900">تتبع الشحنة</h2>
              {order.yalidineTracking ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-medium text-slate-700">
                    <Truck className="h-4 w-4 text-blue-600" />
                    رقم التتبع
                  </p>
                  <p className="font-mono text-base font-bold text-slate-900" dir="ltr">
                    {order.yalidineTracking}
                  </p>
                  {order.yalidineLabelUrl ? (
                    <a
                      href={order.yalidineLabelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline"
                    >
                      فتح ملصق الشحن
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  لا يوجد رقم تتبع بعد. سيظهر هنا عند إنشاء شحنة التوصيل.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900">المنتجات</h2>
              <ul className="space-y-4">
                {(order.items || []).map((it: CustomerOrderItem, idx: number) => (
                  <li
                    key={`${order._id}-line-${idx}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <p className="font-semibold text-slate-900">{it.name}</p>
                    {it.color ? (
                      <p className="mt-0.5 text-xs text-slate-500">اللون: {it.color}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-600">
                      {it.quantity} × {formatDzd(Number(it.price) || 0)} DA ={" "}
                      <span className="font-bold text-slate-800">
                        {formatDzd(Number(it.price) * Number(it.quantity))} DA
                      </span>
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
