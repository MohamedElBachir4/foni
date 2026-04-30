"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { User, Phone, MapPin, Mail, Loader2, ChevronLeft } from "lucide-react";
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
  createdAt: string;
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/accounts`, {
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
  }, []);

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
        description="جميع الحسابات المسجلة من صفحة /accounts"
        icon={<User className="h-5 w-5" />}
      />

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <User className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 font-medium text-slate-600">لا توجد حسابات حتى الآن.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {accounts.map((acc) => (
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

