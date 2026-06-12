"use client";

import { useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { User, Phone, MapPin, Package, Calendar, Loader2, Send } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";

const YALIDINE_MAX_PRICE = 150000;

type OrderVariantLine = { label: string; price: number; quantity: number };
type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  color?: string;
  option?: string;
  variantSelections?: OrderVariantLine[];
};
type Order = {
  _id: string;
  fullName: string;
  phone: string;
  wilaya: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  totalPrice: number;
  status?: string;
  customerType?: string;
  yalidineTracking?: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const customerTypeLabels: Record<string, string> = {
  retail: "زبون عادي",
  wholesale: "بائع جملة",
  repairer: "تاجر أو صاحب محل",
};

function orderItemLineTotal(item: OrderItem): number {
  const vs = item.variantSelections;
  if (Array.isArray(vs) && vs.length > 0) {
    return vs.reduce(
      (sum, v) => sum + (Number(v.price) || 0) * (Number(v.quantity) || 0),
      0
    );
  }
  return (Number(item.price) || 0) * (Number(item.quantity) || 0);
}

/** كمية آمنة قبل الإرسال إلى Yalidine (الحد الأدنى 1، حد أعلى معقول) */
function clampOrderQty(raw: string | number): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99999, Math.floor(n));
}

const customerTypeClasses: Record<string, string> = {
  retail: "bg-slate-100 text-slate-700",
  wholesale: "bg-violet-100 text-violet-800",
  repairer: "bg-teal-100 text-teal-800",
};

function canSendOrderToYalidine(order: Order): boolean {
  return (
    !order.yalidineTracking &&
    (Number(order.totalPrice) || 0) <= YALIDINE_MAX_PRICE
  );
}

function buildItemsPayload(order: Order) {
  return order.items.map((item) => {
    const base = {
      name: String(item.name || "").trim(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Math.max(0, Number(item.price) || 0),
    };
    const vs = item.variantSelections;
    if (Array.isArray(vs) && vs.length > 0) {
      return {
        ...base,
        variantSelections: vs.map((v) => ({
          label: String(v.label || "").trim(),
          price: Math.max(0, Number(v.price) || 0),
          quantity: Math.max(1, Number(v.quantity) || 1),
        })),
      };
    }
    return base;
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkMessage, setBulkMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  async function updateOrderStatus(orderId: string, status: string) {
    // التحقق من أن المعرف موجود وصحيح
    const cleanId = String(orderId || "").trim();
    if (!cleanId) {
      console.error("Order ID is missing or empty");
      alert("خطأ: معرف الطلب غير صحيح");
      return;
    }

    console.log("Updating order status:", { orderId: cleanId, status });

    setUpdatingId(cleanId);
    try {
      const url = `${API_URL}/api/orders/${cleanId}/status`;
      console.log("PATCH URL:", url);

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        // عند تحديث الحالة إلى "completed"، حذف الطلب من الصفحة ونقله إلى الأرشيف
        if (status === "completed") {
          console.log("Order completed, removing from list");
          setOrders((prev) => prev.filter((o) => o._id !== cleanId));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o._id === cleanId ? { ...o, ...data } : o))
          );
        }
        window.dispatchEvent(new CustomEvent("admin-orders-updated"));
      } else {
        let errorMsg = `خطأ ${res.status}: `;
        try {
          const errData = await res.json();
          errorMsg += errData.error || "فشل التحديث";
        } catch {
          errorMsg += "فشل التحديث";
        }
        console.error("Update failed:", errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(`خطأ في الاتصال بالخادم: ${err}`);
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) setError("يجب تسجيل الدخول");
          else setError("فشل في جلب الطلبات");
          return;
        }
        const data = await res.json();
        const list = data.orders ?? (Array.isArray(data) ? data : []);
        console.log("Loaded orders:", list);
        if (list.length > 0) {
          console.log("First order structure:", list[0]);
        }
        setOrders(list);
      } catch (err) {
        console.error("Load error:", err);
        setError("خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateOrderItemField(
    orderId: string,
    idx: number,
    field: "name" | "price",
    value: string
  ) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;
        const nextItems = order.items.map((item, itemIdx) => {
          if (itemIdx !== idx) return item;
          if (field === "name") return { ...item, name: value };
          return { ...item, price: Math.max(0, Number(value) || 0) };
        });
        const nextTotal = nextItems.reduce((sum, i) => sum + orderItemLineTotal(i), 0);
        return { ...order, items: nextItems, totalPrice: nextTotal };
      })
    );
  }

  function updateOrderItemQuantity(orderId: string, idx: number, value: string) {
    const qty = clampOrderQty(value);
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;
        const nextItems = order.items.map((item, itemIdx) => {
          if (itemIdx !== idx) return item;
          return { ...item, quantity: qty };
        });
        const nextTotal = nextItems.reduce((sum, i) => sum + orderItemLineTotal(i), 0);
        return { ...order, items: nextItems, totalPrice: nextTotal };
      })
    );
  }

  function updateOrderVariantQuantity(
    orderId: string,
    itemIdx: number,
    variantLabel: string,
    value: string
  ) {
    const qty = clampOrderQty(value);
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;
        const nextItems = order.items.map((item, i) => {
          if (i !== itemIdx) return item;
          const vs = item.variantSelections;
          if (!Array.isArray(vs) || vs.length === 0) return item;
          const nextVs = vs.map((v) =>
            v.label === variantLabel ? { ...v, quantity: qty } : v
          );
          const sumQty = nextVs.reduce((s, v) => s + clampOrderQty(v.quantity), 0);
          return { ...item, variantSelections: nextVs, quantity: sumQty };
        });
        const nextTotal = nextItems.reduce((sum, it) => sum + orderItemLineTotal(it), 0);
        return { ...order, items: nextItems, totalPrice: nextTotal };
      })
    );
  }

  const eligibleForYalidine = orders.filter(canSendOrderToYalidine);
  const selectedCount = selectedIds.size;

  function toggleOrderSelection(orderId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function selectAllEligible() {
    setSelectedIds(new Set(eligibleForYalidine.map((o) => o._id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function sendOrderToYalidine(order: Order) {
    if (!canSendOrderToYalidine(order)) {
      return;
    }
    setSendingId(order._id);
    setBulkMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/orders/${order._id}/send-to-yalidine`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: buildItemsPayload(order) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل الإرسال إلى Yalidine");
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, ...data } : o)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل الإرسال";
      setBulkMessage({ type: "error", text: msg });
      console.error("sendOrderToYalidine error:", err);
    } finally {
      setSendingId(null);
    }
  }

  async function sendSelectedToYalidine() {
    const selected = orders.filter((o) => selectedIds.has(o._id) && canSendOrderToYalidine(o));
    if (selected.length === 0) {
      setBulkMessage({ type: "error", text: "حدّد طلباً واحداً على الأقل قابلاً للإرسال" });
      return;
    }
    if (
      !confirm(
        `إرسال ${selected.length} طلب إلى Yalidine دفعة واحدة؟\nسيتم استخدام الأسعار والكميات المعروضة حالياً.`
      )
    ) {
      return;
    }

    setSendingBulk(true);
    setBulkMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/orders/bulk-send-to-yalidine`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orders: selected.map((o) => ({ id: o._id, items: buildItemsPayload(o) })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const succeeded = Array.isArray(data.succeeded) ? data.succeeded : [];
      const failed = Array.isArray(data.failed) ? data.failed : [];

      if (succeeded.length > 0) {
        const byId = new Map(
          succeeded.map((s: { id: string; order?: Order; yalidineTracking?: string }) => [
            s.id,
            s.order || { yalidineTracking: s.yalidineTracking },
          ])
        );
        setOrders((prev) =>
          prev.map((o) => {
            const patch = byId.get(o._id);
            if (!patch) return o;
            return { ...o, ...patch, yalidineTracking: patch.yalidineTracking || o.yalidineTracking };
          })
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const s of succeeded) next.delete(s.id);
          return next;
        });
      }

      if (succeeded.length === 0 && failed.length === 0 && !res.ok) {
        throw new Error(data.error || "فشل الإرسال إلى Yalidine");
      }

      if (failed.length === 0) {
        setBulkMessage({
          type: "success",
          text: `تم إرسال ${succeeded.length} طلب إلى Yalidine بنجاح`,
        });
      } else if (succeeded.length === 0) {
        setBulkMessage({
          type: "error",
          text: `فشل إرسال جميع الطلبات (${failed.length}). ${failed[0]?.error || ""}`,
        });
      } else {
        setBulkMessage({
          type: "info",
          text: `نجح ${succeeded.length} طلب، وفشل ${failed.length}. راجع الطلبات الفاشلة وحاول مجدداً.`,
        });
      }
    } catch (err) {
      setBulkMessage({
        type: "error",
        text: err instanceof Error ? err.message : "فشل الإرسال الجماعي",
      });
    } finally {
      setSendingBulk(false);
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ar-DZ", {
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader
          title="الطلبات"
          description="جميع الطلبات القادمة من الموقع"
          icon={<Package className="h-5 w-5" />}
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
          <p className="text-slate-500">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader title="الطلبات" icon={<Package className="h-5 w-5" />} />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title="الطلبات"
        description="حدّد عدة طلبات وأرسلها دفعة واحدة إلى Yalidine، أو عدّل الكمية/السعر ثم أرسل — التعديلات تُحفظ عند نجاح الإرسال."
        icon={<Package className="h-5 w-5" />}
      />

      {bulkMessage ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            bulkMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : bulkMessage.type === "error"
              ? "bg-rose-50 text-rose-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          {bulkMessage.text}
        </div>
      ) : null}

      {orders.length > 0 && eligibleForYalidine.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={
                eligibleForYalidine.length > 0 &&
                eligibleForYalidine.every((o) => selectedIds.has(o._id))
              }
              onChange={(e) => (e.target.checked ? selectAllEligible() : clearSelection())}
              disabled={sendingBulk || Boolean(sendingId)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            تحديد الكل القابل للإرسال ({eligibleForYalidine.length})
          </label>
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={clearSelection}
              disabled={sendingBulk}
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline disabled:opacity-50"
            >
              إلغاء التحديد
            </button>
          ) : null}
          <button
            type="button"
            onClick={sendSelectedToYalidine}
            disabled={selectedCount === 0 || sendingBulk || Boolean(sendingId)}
            className="mr-auto inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {sendingBulk ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {sendingBulk
              ? "جاري الإرسال الجماعي..."
              : `إرسال المحدد إلى Yalidine (${selectedCount})`}
          </button>
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">لا توجد طلبات حتى الآن</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {canSendOrderToYalidine(order) ? (
                      <label
                        className="inline-flex cursor-pointer items-center"
                        title="تحديد للإرسال الجماعي إلى Yalidine"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order._id)}
                          onChange={() => toggleOrderSelection(order._id)}
                          disabled={sendingBulk || sendingId === order._id}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ) : null}
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                      <User className="h-4 w-4" />
                      {order.fullName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600" dir="ltr">
                      <Phone className="h-4 w-4" />
                      {order.phone}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${customerTypeClasses[order.customerType || "retail"] ||
                        "bg-slate-100 text-slate-700"
                        }`}
                      title="نوع الزبون (يُحدد عند الطلب حسب تسجيل العميل)"
                    >
                      {customerTypeLabels[order.customerType || "retail"]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-500">
                      <Calendar className="mr-1 inline h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </span>
                    <select
                      value={order.status || "pending"}
                      data-order-id={order._id}
                      onChange={(e) => {
                        const selectElement = e.currentTarget as HTMLSelectElement;
                        const id = selectElement.getAttribute("data-order-id");
                        const newStatus = e.target.value;
                        console.log("Select changed - orderId:", id, "newStatus:", newStatus);
                        if (id) {
                          updateOrderStatus(id, newStatus);
                        }
                      }}
                      disabled={updatingId === order._id}
                      className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses[order.status || "pending"] || "bg-slate-100 text-slate-700"
                        } border-0 focus:ring-2 focus:ring-sky-500`}
                    >
                      {(["pending", "completed", "cancelled"] as const).map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => sendOrderToYalidine(order)}
                      disabled={
                        sendingId === order._id ||
                        sendingBulk ||
                        Boolean(order.yalidineTracking) ||
                        (Number(order.totalPrice) || 0) > YALIDINE_MAX_PRICE
                      }
                      className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                      title={
                        (Number(order.totalPrice) || 0) > YALIDINE_MAX_PRICE
                          ? "خفّض مجموع الأسعار إلى 150000 دج أو أقل قبل الإرسال"
                          : undefined
                      }
                    >
                      {order.yalidineTracking
                        ? "تم الإرسال"
                        : sendingId === order._id
                        ? "جاري الإرسال..."
                        : "إرسال إلى Yalidine"}
                    </button>
                    <span className="rounded-full bg-blue-600 px-4 py-1.5 text-lg font-bold text-white">
                      {order.totalPrice.toLocaleString()} دج
                    </span>
                  </div>
                </div>
                {(Number(order.totalPrice) || 0) > YALIDINE_MAX_PRICE ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                    Yalidine تقبل مبلغ تحصيل حتى {YALIDINE_MAX_PRICE.toLocaleString()} دج فقط.
                    عدّل أسعار المنتجات قبل الإرسال.
                  </div>
                ) : null}
              </div>
              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    العنوان
                  </h3>
                  <p className="text-slate-600">{order.wilaya}</p>
                  <p className="mt-1 text-slate-600">{order.address}</p>
                  {order.notes?.trim() ? (
                    <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                      <span className="font-bold">ملاحظة الزبون: </span>
                      {order.notes.trim()}
                    </p>
                  ) : null}
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Package className="h-4 w-4 text-slate-500" />
                    المنتجات
                  </h3>
                  <ul className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex flex-col justify-center rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="flex-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                updateOrderItemField(order._id, i, "name", e.target.value)
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-slate-800"
                            />
                            <span className="mt-1 inline-block text-xs text-slate-500">
                              {item.variantSelections?.length ? (
                                <span className="block space-y-1.5">
                                  {item.variantSelections.map((v) => (
                                    <span
                                      key={v.label}
                                      className="flex flex-wrap items-center gap-2 rounded border border-slate-200/80 bg-white px-2 py-1.5"
                                    >
                                      <span className="min-w-0 flex-1 font-medium text-slate-700">
                                        {v.label}
                                      </span>
                                      <label className="flex shrink-0 items-center gap-1 text-slate-600">
                                        <span className="whitespace-nowrap">كمية</span>
                                        <input
                                          type="number"
                                          min={1}
                                          step={1}
                                          disabled={Boolean(order.yalidineTracking)}
                                          value={v.quantity}
                                          onChange={(e) =>
                                            updateOrderVariantQuantity(
                                              order._id,
                                              i,
                                              v.label,
                                              e.target.value
                                            )
                                          }
                                          className="w-16 rounded border border-slate-300 px-1 py-0.5 text-center text-slate-800"
                                        />
                                      </label>
                                      <span className="shrink-0 text-slate-500">
                                        {(Number(v.price) * Number(v.quantity)).toLocaleString()} دج
                                      </span>
                                    </span>
                                  ))}
                                  <span className="font-semibold text-slate-600">
                                    المجموع: {orderItemLineTotal(item).toLocaleString()} دج
                                  </span>
                                </span>
                              ) : (
                                <span className="flex flex-wrap items-center gap-2">
                                  <label className="flex items-center gap-1 text-slate-600">
                                    <span>الكمية</span>
                                    <input
                                      type="number"
                                      min={1}
                                      step={1}
                                      disabled={Boolean(order.yalidineTracking)}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateOrderItemQuantity(order._id, i, e.target.value)
                                      }
                                      className="w-16 rounded border border-slate-300 px-1 py-0.5 text-center text-slate-800"
                                    />
                                  </label>
                                  {item.option ? (
                                    <span className="text-slate-600">— الخيار: {item.option}</span>
                                  ) : null}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="font-semibold text-slate-700">
                            <input
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={(e) =>
                                updateOrderItemField(order._id, i, "price", e.target.value)
                              }
                              className="w-24 rounded border border-slate-300 px-2 py-1 text-right"
                            />
                            <span className="mr-1 text-xs text-slate-500">دج</span>
                          </span>
                        </div>
                        {item.color && (
                          <span className="text-xs text-slate-500 mt-0.5">
                            اللون: {
                              {
                                white: "أبيض",
                                black: "أسود",
                                gold: "ذهبي",
                                silver: "فضي",
                                purple: "بنفسجي",
                                red: "أحمر",
                                blue: "أزرق",
                                green: "أخضر",
                                gray: "رمادي",
                                brown: "بني",
                              }[item.color] || item.color
                            }
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
