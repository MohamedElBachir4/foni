"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";
import { User, Phone, MapPin, Package, Calendar, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type OrderItem = { name: string; price: number; quantity: number; color?: string };
type Order = {
  _id: string;
  fullName: string;
  phone: string;
  wilaya: string;
  address: string;
  items: OrderItem[];
  totalPrice: number;
  status?: string;
  customerType?: string;
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
  repairer: "مصلح",
};

const customerTypeClasses: Record<string, string> = {
  retail: "bg-slate-100 text-slate-700",
  wholesale: "bg-violet-100 text-violet-800",
  repairer: "bg-teal-100 text-teal-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateOrderStatus(orderId: string, status: string) {
    // التحقق من أن المعرف موجود وصحيح
    const cleanId = String(orderId || "").trim();
    if (!cleanId) {
      console.error("Order ID is missing or empty");
      alert("خطأ: معرف الطلب غير صحيح");
      return;
    }

    console.log("Updating order status:", { orderId: cleanId, status });

    // إذا تم اختيار "cancelled"، عرض رسالة تأكيد
    if (status === "cancelled") {
      if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذه العملية.")) {
        return;
      }
      // حذف الطلب
      setUpdatingId(cleanId);
      try {
        const url = `${API_URL}/api/orders/${cleanId}`;
        console.log("DELETE URL:", url);
        const headers = getAuthHeaders();
        console.log("Request headers:", { ...headers, Authorization: "Cookie [TOKEN]" });

        const res = await fetch(url, {
          method: "DELETE",
          headers: headers,
          credentials: "include"
         });

        console.log("Response status:", res.status);

        if (res.ok) {
          console.log("Order deleted successfully");
          setOrders((prev) => prev.filter((o) => o._id !== cleanId));
          window.dispatchEvent(new CustomEvent("admin-orders-updated"));
          alert("تم حذف الطلب بنجاح");
        } else {
          let errorMsg = `خطأ ${res.status}: `;
          try {
            const errData = await res.json();
            errorMsg += errData.error || "فشل حذف الطلب";
          } catch {
            errorMsg += "فشل حذف الطلب";
          }
          console.error("Delete failed:", errorMsg);
          alert(errorMsg);
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert(`خطأ في الاتصال بالخادم: ${err}`);
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    setUpdatingId(cleanId);
    try {
      const url = `${API_URL}/api/orders/${cleanId}/status`;
      console.log("PATCH URL:", url);

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), credentials: 'include', "Content-Type": "application/json"  },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        // عند تحديث الحالة إلى "completed"، حذف الطلب من الصفحة ونقله إلى الأرشيف
        if (status === "completed") {
          console.log("Order completed, removing from list");
          setOrders((prev) => prev.filter((o) => o._id !== cleanId));
          alert("تم نقل الطلب إلى الأرشيف");
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
          headers: getAuthHeaders(), credentials: 'include',
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
        description="جميع الطلبات القادمة من الموقع"
        icon={<Package className="h-5 w-5" />}
      />

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
                    <span className="rounded-full bg-blue-600 px-4 py-1.5 text-lg font-bold text-white">
                      {order.totalPrice.toLocaleString()} دج
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    العنوان
                  </h3>
                  <p className="text-slate-600">{order.wilaya}</p>
                  <p className="mt-1 text-slate-600">{order.address}</p>
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
                          <span className="text-slate-800">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {(item.price * item.quantity).toLocaleString()} دج
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
