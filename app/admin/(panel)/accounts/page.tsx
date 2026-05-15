"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { User, Phone, MapPin, Mail, Loader2, ChevronLeft, Search } from "lucide-react";
import { AdminPageHeader, AdminButton, AdminModal } from "@/components/admin";

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

type BulkConfirm = { mode: "approved" | "rejected"; count: number } | null;

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirm>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const q =
          approvalFilter === "all"
            ? ""
            : `?approvalStatus=${encodeURIComponent(approvalFilter)}`;
        const res = await fetch(`${API_URL}/api/accounts${q}`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) setError("يجب تسجيل الدخول");
          else setError("فشل في جلب الحسابات");
          return;
        }
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
        setSelectedIds([]);
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
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_URL}/api/accounts/${accountId}/approval-status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ approvalStatus: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل تحديث حالة الحساب");
      if (status === "rejected" || data.deleted === true) {
        setAccounts((prev) => prev.filter((a) => a._id !== accountId));
        setSelectedIds((prev) => prev.filter((id) => id !== accountId));
        return;
      }
      setAccounts((prev) =>
        prev.map((a) => (a._id === accountId ? { ...a, approvalStatus: status } : a))
      );
      setSelectedIds((prev) => prev.filter((id) => id !== accountId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تحديث الحالة");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function executeBulkApproval(status: "approved" | "rejected") {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setError("");
    setSuccessMsg("");
    setBulkConfirm(null);
    try {
      const res = await fetch(`${API_URL}/api/accounts/bulk-approval-status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds, approvalStatus: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل المعالجة الجماعية");

      const processed = new Set<string>(selectedIds);
      if (status === "rejected") {
        setAccounts((prev) => prev.filter((a) => !processed.has(a._id)));
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            processed.has(a._id) ? { ...a, approvalStatus: "approved" } : a
          )
        );
      }
      setSelectedIds([]);
      const extra =
        Array.isArray(data.errors) && data.errors.length > 0
          ? ` (${data.errors.length} فشل)`
          : "";
      setSuccessMsg(`${data.message || "تمت العملية"}${extra}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل المعالجة الجماعية");
    } finally {
      setBulkLoading(false);
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
      return new Date(iso).toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleAccounts = useMemo(() => {
    if (!normalizedSearch) return accounts;
    return accounts.filter((acc) => {
      const fullName = `${acc.firstName || ""} ${acc.lastName || ""}`.trim().toLowerCase();
      const phone = String(acc.phone || "").trim().toLowerCase();
      return fullName.includes(normalizedSearch) || phone.includes(normalizedSearch);
    });
  }, [accounts, normalizedSearch]);

  const selectableAccounts = useMemo(
    () => visibleAccounts.filter((a) => a.approvalStatus !== "approved"),
    [visibleAccounts]
  );

  const allSelectableSelected =
    selectableAccounts.length > 0 &&
    selectableAccounts.every((a) => selectedIds.includes(a._id));

  function selectAllVisible() {
    setSelectedIds(selectableAccounts.map((a) => a._id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  const showBulkBar = selectableAccounts.length > 0;

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

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        title="الحسابات"
        description="حدّد عدة حسابات ثم اقبلها أو ارفضها دفعة واحدة"
        icon={<User className="h-5 w-5" />}
        actions={
          <select
            value={approvalFilter}
            onChange={(e) =>
              setApprovalFilter(e.target.value as "all" | "pending" | "approved" | "rejected")
            }
            className="admin-select w-auto min-w-[160px]"
          >
            <option value="pending">قيد المراجعة</option>
            <option value="approved">المفعّلة</option>
            <option value="rejected">المرفوضة</option>
            <option value="all">الكل</option>
          </select>
        }
      />

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {successMsg ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن زبون بالاسم أو رقم الهاتف"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {showBulkBar ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={allSelectableSelected}
              onChange={() => (allSelectableSelected ? clearSelection() : selectAllVisible())}
              className="h-4 w-4 rounded border-slate-300"
            />
            تحديد الكل ({selectableAccounts.length})
          </label>
          {selectedIds.length > 0 ? (
            <>
              <span className="text-sm font-semibold text-violet-800">
                {selectedIds.length} محدّد
              </span>
              <AdminButton
                size="sm"
                variant="success"
                loading={bulkLoading}
                disabled={bulkLoading}
                onClick={() => setBulkConfirm({ mode: "approved", count: selectedIds.length })}
              >
                قبول المحدّد
              </AdminButton>
              <AdminButton
                size="sm"
                variant="danger"
                loading={bulkLoading}
                disabled={bulkLoading}
                onClick={() => setBulkConfirm({ mode: "rejected", count: selectedIds.length })}
              >
                رفض المحدّد
              </AdminButton>
              <AdminButton size="sm" variant="outline" onClick={clearSelection} disabled={bulkLoading}>
                إلغاء التحديد
              </AdminButton>
            </>
          ) : null}
        </div>
      ) : null}

      {visibleAccounts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <User className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">
            {accounts.length === 0 ? "لا توجد حسابات حتى الآن." : "لا يوجد زبون مطابق لاسم البحث."}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {visibleAccounts.map((acc) => {
            const canSelect = acc.approvalStatus !== "approved";
            const isSelected = selectedIds.includes(acc._id);
            return (
              <div
                key={acc._id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                  isSelected
                    ? "border-violet-400 ring-2 ring-violet-200"
                    : "border-slate-200 hover:border-violet-200 hover:shadow-md"
                }`}
              >
                <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {canSelect ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(acc._id)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300"
                          aria-label={`تحديد ${acc.firstName} ${acc.lastName}`}
                        />
                      ) : (
                        <span className="w-4" />
                      )}
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <User className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {acc.firstName} {acc.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {acc.role === "reparateur" ? "تاجر أو صاحب محل" : "Grossiste"}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(acc.approvalStatus)}`}
                        >
                          {statusLabel(acc.approvalStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                      <p>تاريخ الإنشاء: {formatDate(acc.createdAt)}</p>
                      <Link
                        href={`/admin/accounts/${acc._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-violet-600 hover:text-violet-800"
                      >
                        طلبات الحساب
                        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                      </Link>
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
                    {acc.wilaya ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span>{acc.wilaya}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    {acc.shopName ? (
                      <p>
                        <span className="font-semibold">المحل: </span>
                        {acc.shopName}
                      </p>
                    ) : null}
                    {acc.address ? (
                      <p>
                        <span className="font-semibold">العنوان: </span>
                        {acc.address}
                      </p>
                    ) : null}
                    {acc.approvalStatus !== "approved" ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === acc._id || bulkLoading}
                          onClick={() => updateStatus(acc._id, "approved")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          قبول
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === acc._id || bulkLoading}
                          onClick={() => updateStatus(acc._id, "rejected")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          رفض
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        open={!!bulkConfirm}
        onClose={() => !bulkLoading && setBulkConfirm(null)}
        title="تأكيد العملية الجماعية"
        size="sm"
      >
        <p className="text-sm text-slate-700">
          {bulkConfirm?.mode === "approved"
            ? `هل تريد قبول ${bulkConfirm?.count} حساباً وتفعيلها؟`
            : `هل تريد رفض ${bulkConfirm?.count} حساباً وحذفها من القائمة؟`}
        </p>
        <div className="mt-4 flex gap-2">
          <AdminButton
            variant="outline"
            className="flex-1"
            disabled={bulkLoading}
            onClick={() => setBulkConfirm(null)}
          >
            إلغاء
          </AdminButton>
          <AdminButton
            variant={bulkConfirm?.mode === "approved" ? "success" : "danger"}
            className="flex-1"
            loading={bulkLoading}
            disabled={bulkLoading}
            onClick={() => bulkConfirm && executeBulkApproval(bulkConfirm.mode)}
          >
            تأكيد
          </AdminButton>
        </div>
      </AdminModal>
    </div>
  );
}
