"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { AdminPageHeader } from "@/components/admin";
import { PackageSearch, Trash2, Truck, Loader2 } from "lucide-react";

type PartRequest = {
  _id: string;
  productName: string;
  description?: string;
  customerName: string;
  phone: string;
  wilaya: string;
  address: string;
  status: "pending" | "contacted" | "completed";
  deliveryStatus: "not_sent" | "sent";
  yalidineTrackingId?: string;
  createdAt: string;
};

type Toast = { type: "success" | "error"; text: string } | null;

const statusLabel: Record<PartRequest["status"], string> = {
  pending: "قيد الانتظار",
  contacted: "تم التواصل",
  completed: "مكتمل",
};

const deliveryLabel: Record<PartRequest["deliveryStatus"], string> = {
  not_sent: "غير مرسل",
  sent: "تم الإرسال",
};

export default function AdminPartRequestsPage() {
  const [rows, setRows] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  async function loadRows() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/part-requests`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل في تحميل الطلبات");
      setRows(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "خطأ غير متوقع" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function updateStatus(id: string, status: PartRequest["status"]) {
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/api/part-requests/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تحديث الحالة");
      setRows((prev) => prev.map((r) => (r._id === id ? data.request : r)));
      setToast({ type: "success", text: "تم تحديث الحالة" });
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "فشل التحديث" });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("هل تريد حذف هذا الطلب؟")) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/api/part-requests/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      setRows((prev) => prev.filter((r) => r._id !== id));
      setToast({ type: "success", text: "تم حذف الطلب" });
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "فشل الحذف" });
    } finally {
      setBusyId(null);
    }
  }

  async function sendToYalidine(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/api/part-requests/${id}/send-to-yalidine`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل الإرسال إلى Yalidine");
      setRows((prev) => prev.map((r) => (r._id === id ? data.request : r)));
      setToast({ type: "success", text: "تم إرسال الطلب إلى Yalidine" });
    } catch (err) {
      setToast({ type: "error", text: err instanceof Error ? err.message : "فشل الإرسال" });
    } finally {
      setBusyId(null);
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        title="طلبات القطع"
        description="إدارة طلبات القطع غير المتوفرة في الموقع"
        icon={<PackageSearch className="h-5 w-5" />}
      />

      {toast ? (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          لا توجد طلبات قطع حالياً
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-3">اسم القطعة</th>
                <th className="px-3 py-3">الزبون</th>
                <th className="px-3 py-3">الهاتف</th>
                <th className="px-3 py-3">الولاية</th>
                <th className="px-3 py-3">التاريخ</th>
                <th className="px-3 py-3">status</th>
                <th className="px-3 py-3">deliveryStatus</th>
                <th className="px-3 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row._id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-800">{row.productName}</div>
                    {row.description ? (
                      <div className="mt-1 text-xs text-slate-500">{row.description}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{row.customerName}</td>
                  <td className="px-3 py-3" dir="ltr">
                    {row.phone}
                  </td>
                  <td className="px-3 py-3">{row.wilaya}</td>
                  <td className="px-3 py-3">{new Date(row.createdAt).toLocaleString("ar-DZ")}</td>
                  <td className="px-3 py-3">
                    <select
                      value={row.status}
                      onChange={(e) => updateStatus(row._id, e.target.value as PartRequest["status"])}
                      disabled={busyId === row._id}
                      className="rounded-lg border border-slate-300 px-2 py-1"
                    >
                      <option value="pending">{statusLabel.pending}</option>
                      <option value="contacted">{statusLabel.contacted}</option>
                      <option value="completed">{statusLabel.completed}</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{deliveryLabel[row.deliveryStatus]}</div>
                    {row.yalidineTrackingId ? (
                      <div className="text-xs text-blue-700">Tracking: {row.yalidineTrackingId}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => sendToYalidine(row._id)}
                        disabled={busyId === row._id || row.deliveryStatus === "sent"}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        إرسال إلى Yalidine
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(row._id)}
                        disabled={busyId === row._id}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">العنوان: {row.address}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
