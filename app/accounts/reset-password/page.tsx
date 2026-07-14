"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatPublicFetchError, publicFetch } from "@/lib/publicFetch";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      if (!token) {
        if (!cancelled) {
          setTokenValid(false);
          setTokenError("رابط إعادة التعيين غير مكتمل. اطلب رابطاً جديداً.");
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      try {
        const res = await publicFetch(
          `/api/accounts/reset-password/validate?token=${encodeURIComponent(token)}`
        );
        const data = (await res.json().catch(() => ({}))) as {
          valid?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (data.valid) {
          setTokenValid(true);
          setTokenError("");
        } else {
          setTokenValid(false);
          setTokenError(
            data.error ||
              "الرابط غير صالح أو منتهي الصلاحية. يمكنك طلب رابط جديد."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
          setTokenError(
            formatPublicFetchError(err, "تعذّر التحقق من الرابط. حاول لاحقاً.")
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("كلمة السر يجب أن تكون 6 أحرف أو أكثر");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      const res = await publicFetch("/api/accounts/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "تعذّر تحديث كلمة المرور.");
        if (res.status === 400) {
          setTokenValid(false);
          setTokenError(data.error || "الرابط غير صالح أو منتهي الصلاحية.");
        }
        return;
      }
      setSuccess(
        data.message || "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
      );
      setTokenValid(false);
    } catch (err) {
      setError(formatPublicFetchError(err, "تعذّر الاتصال بالخادم."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
          إعادة تعيين كلمة المرور
        </h1>
        <p className="text-xs text-slate-600 sm:text-sm">
          اختر كلمة مرور جديدة لحسابك على FONI.
        </p>
      </div>

      {checking && (
        <p className="text-center text-sm text-slate-500">جاري التحقق من الرابط...</p>
      )}

      {!checking && success && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
          <Link
            href="/accounts"
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            تسجيل الدخول الآن
          </Link>
        </div>
      )}

      {!checking && !success && !tokenValid && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {tokenError || "الرابط غير صالح أو منتهي الصلاحية."}
          </div>
          <Link
            href="/accounts/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            طلب رابط جديد
          </Link>
          <p className="text-center text-xs text-slate-500">
            <Link
              href="/accounts"
              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      )}

      {!checking && !success && tokenValid && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 sm:text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-xl">
              جاري التحميل...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
