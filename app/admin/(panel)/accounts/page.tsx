"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { User, Phone, MapPin, Mail, Loader2, ChevronLeft, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";

type Account = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  wilaya?: string;
  shopName?: string;
  address?: string;
  role: "reparateur" | "grossiste";
  approvalStatus?: "pending" | "approved" | "rejected";
  approvalNote?: string;
  createdAt: string;
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q =
          approvalFilter === "all"
            ? ""
            : `?approvalStatus=${encodeURIComponent(approvalFilter)}`;
        const res = await fetch(`${API_URL}/api/accounts${q}`, {
          headers: getAuthHeaders(), credentials: 'include',
         });
        if (!res.ok) {
          if (res.status === 401) setError("يجب تسجيل الدخول");
          else setError("فشل في جلب الحسابات");
          return;
        }
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
      } catch {
        setError("خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [approvalFilter]);

  async function updateStatus(accountId: string, status: "approved" | "rejected") {
    setActionLoadingId(accountId);
    try {
      const res = await fetch(`${API_URL}/api/accounts/${accountId}/approval-status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ approvalStatus: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تحديث حالة الحساب");
      setAccounts((prev) =>
        prev.map((a) =>
          a._id === accountId ? { ...a, approvalStatus: status } : a
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحديث الحالة");
    } finally {
      setActionLoadingId(null);
    }
  }

  function statusLabel(s?: string) {
    if (s === "approved") return "مفعّل";
    if (s === "rejected") return "مرفوض";
    return "قيد المراجعة";
  }

  function statusClass(s?: string) {
    if (s === "approved") return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (s === "rejected") return "bg-rose-50 text-rose-800 border-rose-200";
    return "bg-amber-50 text-amber-900 border-amber-200";
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  const normalizedSearch = nameSearch.trim().toLowerCase();
  const visibleAccounts = normalizedSearch
    ? accounts.filter((acc) => {
        const fullName = `${acc.firstName || ""} ${acc.lastName || ""}`.trim().toLowerCase();
        return fullName.includes(normalizedSearch);
      })
    : accounts;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader
          title="الحسابات"
          description="جميع الحسابات المسجلة من صفحة /accounts"
          icon={<User className="h-5 w-5" />}
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
          <p className="text-slate-500">جاري تحميل الحسابات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminPageHeader title="الحسابات" icon={<User className="h-5 w-5" />} />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title="الحسابات"
        description="الحسابات الجديدة والمعلقة مع إمكانية قبول أو رفض التفعيل"
        icon={<User className="h-5 w-5" />}
        actions={
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
            className="admin-select w-auto min-w-[160px]"
          >
            <option value="pending">قيد المراجعة</option>
            <option value="approved">المفعّلة</option>
            <option value="rejected">المرفوضة</option>
            <option value="all">الكل</option>
          </select>
        }
      />

      <div className="mt-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="ابحث عن زبون بالاسم الكامل"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {visibleAccounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <User className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">
            {accounts.length === 0 ? "لا توجد حسابات حتى الآن." : "لا يوجد زبون مطابق لاسم البحث."}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {visibleAccounts.map((acc) => (
            <Link
              key={acc._id}
              href={`/admin/accounts/${acc._id}`}
              className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {acc.firstName} {acc.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {acc.role === "reparateur" ? "Réparateur" : "Grossiste"}
                      </p>
                      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(acc.approvalStatus)}`}>
                        {statusLabel(acc.approvalStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-left text-xs text-slate-500">
                    <p>تاريخ الإنشاء: {formatDate(acc.createdAt)}</p>
                    <span className="inline-flex items-center gap-1 font-semibold text-violet-600 group-hover:text-violet-800">
                      طلبات الحساب
                      <ChevronLeft className="h-3.5 w-3.5 rotate-180 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span dir="ltr">{acc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{acc.email}</span>
                  </div>
                  {acc.wilaya && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>{acc.wilaya}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm text-slate-700">
                  {acc.shopName && (
                    <p>
                      <span className="font-semibold">المحل: </span>
                      {acc.shopName}
                    </p>
                  )}
                  {acc.address && (
                    <p>
                      <span className="font-semibold">العنوان: </span>
                      {acc.address}
                    </p>
                  )}
                  {acc.approvalStatus !== "approved" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoadingId === acc._id}
                        onClick={(e) => {
                          e.preventDefault();
                          updateStatus(acc._id, "approved");
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        قبول
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === acc._id}
                        onClick={(e) => {
                          e.preventDefault();
                          updateStatus(acc._id, "rejected");
                        }}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

