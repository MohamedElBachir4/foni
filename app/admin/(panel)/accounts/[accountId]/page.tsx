"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { AdminPageHeader, AdminCard, AdminTable } from "@/components/admin";
import { isMerchantRole, roleLabelAr } from "@/lib/accountRoles";

type AccountDetail = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "customer" | "merchant" | "reparateur" | "grossiste";
  useWholesalePricing?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvalNote?: string;
  approvalReviewedAt?: string | null;
  wilaya?: string;
  address?: string;
  shopName?: string;
  createdAt: string;
};

type OrderRow = {
  _id: string;
  fullName: string;
  phone: string;
  totalPrice: number;
  status?: string;
  createdAt: string;
  completedAt?: string | null;
  items?: { name: string; quantity: number }[];
};

const statusLabels: Record<string, string> = {
  pending: "قيد المعالجة",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  cancelled: "bg-rose-100 text-rose-900 ring-rose-200",
};

function formatMoney(n: number) {
  return (Number(n) || 0).toLocaleString("ar-DZ");
}

export default function AdminAccountOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = typeof params?.accountId === "string" ? params.accountId : "";

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/accounts/${accountId}/orders`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "فشل في جلب البيانات");
      }
      setAccount(data.account || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
      setAccount(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const completedCount = orders.filter((o) => o.status === "completed").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  function approvalLabel(s?: string) {
    if (s === "approved") return "مفعّل";
    if (s === "rejected") return "مرفوض";
    return "قيد المراجعة";
  }

  function approvalClass(s?: string) {
    if (s === "approved") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    if (s === "rejected") return "bg-rose-100 text-rose-900 ring-rose-200";
    return "bg-amber-100 text-amber-950 ring-amber-200";
  }

  async function setApprovalStatus(status: "approved" | "rejected") {
    if (!account?._id) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/accounts/${account._id}/approval-status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ approvalStatus: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تحديث حالة الحساب");
      if (status === "rejected" || data.deleted === true) {
        router.push("/admin/accounts");
        return;
      }
      setAccount(data.account || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحديث حالة الحساب");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <AdminPageHeader
          title="طلبات الحساب"
          description="جاري التحميل…"
          icon={<Package className="h-5 w-5" />}
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-slate-500">جاري تحميل الطلبات…</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/accounts"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى الحسابات
        </Link>
        <AdminPageHeader title="طلبات الحساب" icon={<Package className="h-5 w-5" />} />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          {error || "الحساب غير موجود"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى قائمة الحسابات
      </Link>

      <AdminPageHeader
        title={`طلبات: ${account.firstName} ${account.lastName}`}
        description="جميع الطلبات المرتبطة بهذا الحساب (بالربط أو بنفس رقم الهاتف) وحالة الإنجاز"
        icon={<User className="h-5 w-5" />}
      />

      <AdminCard title="بيانات الحساب" icon={<User className="h-5 w-5 text-violet-600" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{account.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span dir="ltr">{account.phone}</span>
            </p>
            <p className="text-xs text-slate-500">
              النوع: {roleLabelAr(account.role)}
              {isMerchantRole(account.role) && account.useWholesalePricing
                ? " — شراء بالجملة مفعّل"
                : ""}
            </p>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${approvalClass(
                account.approvalStatus
              )}`}
            >
              حالة التفعيل: {approvalLabel(account.approvalStatus)}
            </span>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            {account.wilaya && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                {account.wilaya}
              </p>
            )}
            {account.shopName && (
              <p>
                <span className="font-semibold">المحل: </span>
                {account.shopName}
              </p>
            )}
            {account.address && (
              <p className="text-xs leading-relaxed text-slate-600">{account.address}</p>
            )}
            {account.approvalReviewedAt && (
              <p className="text-xs text-slate-500">
                آخر مراجعة:{" "}
                {new Date(account.approvalReviewedAt).toLocaleString("ar-DZ", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>
        {account.approvalStatus !== "approved" && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setApprovalStatus("approved")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              قبول الحساب
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setApprovalStatus("rejected")}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              رفض الحساب
            </button>
          </div>
        )}
      </AdminCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-center shadow-sm">
          <p className="text-xs font-bold text-emerald-800">مكتملة</p>
          <p className="text-2xl font-black text-emerald-900">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center shadow-sm">
          <p className="text-xs font-bold text-amber-900">قيد المعالجة</p>
          <p className="text-2xl font-black text-amber-950">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-center shadow-sm">
          <p className="text-xs font-bold text-rose-800">ملغاة</p>
          <p className="text-2xl font-black text-rose-900">{cancelledCount}</p>
        </div>
      </div>

      <AdminCard
        title={`سجل الطلبات (${orders.length})`}
        icon={<Package className="h-5 w-5 text-sky-600" />}
      >
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            لا توجد طلبات مسجّلة لهذا الحساب بعد.
          </p>
        ) : (
          <AdminTable
            columns={[
              { key: "id", label: "رقم الطلب", className: "min-w-[120px]" },
              { key: "date", label: "التاريخ" },
              { key: "items", label: "المنتجات" },
              { key: "total", label: "المجموع" },
              { key: "status", label: "الحالة / الإنجاز" },
            ]}
            rows={orders.map((o) => {
              const st = o.status || "pending";
              const done = st === "completed";
              const itemsCount = (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
              const preview = (o.items || [])
                .slice(0, 2)
                .map((it) => `${it.name} ×${it.quantity}`)
                .join("، ");
              const more = (o.items?.length || 0) > 2 ? ` +${(o.items?.length || 0) - 2}` : "";
              return {
                _id: o._id,
                id: (
                  <span className="font-mono text-xs font-semibold text-slate-800" dir="ltr">
                    {o._id.slice(-12)}
                  </span>
                ),
                date: (
                  <span className="text-xs text-slate-600">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString("ar-DZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </span>
                ),
                items: (
                  <span className="line-clamp-2 text-xs text-slate-700" title={preview + more}>
                    {preview || "—"}
                    {more}
                    {itemsCount > 0 && (
                      <span className="mt-1 block text-[11px] text-slate-400">
                        إجمالي القطع: {itemsCount}
                      </span>
                    )}
                  </span>
                ),
                total: (
                  <span className="font-bold text-slate-900" dir="ltr">
                    {formatMoney(o.totalPrice)} DA
                  </span>
                ),
                status: (
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                        statusBadge[st] || statusBadge.pending
                      }`}
                    >
                      {st === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {st === "pending" && <Clock className="h-3.5 w-3.5" />}
                      {st === "cancelled" && <XCircle className="h-3.5 w-3.5" />}
                      {statusLabels[st] || st}
                    </span>
                    {done && o.completedAt && (
                      <span className="text-[10px] text-emerald-700">
                        أُنجز:{" "}
                        {new Date(o.completedAt).toLocaleString("ar-DZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                    {st === "pending" && (
                      <span className="text-[10px] text-amber-700">لم يُنجز بعد</span>
                    )}
                    {st === "cancelled" && (
                      <span className="text-[10px] text-rose-700">ملغى</span>
                    )}
                  </div>
                ),
              };
            })}
            keyExtractor={(r) => r._id as string}
            emptyMessage="لا توجد طلبات."
          />
        )}
      </AdminCard>
    </div>
  );
}
