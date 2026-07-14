"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatPublicFetchError, publicFetch } from "@/lib/publicFetch";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }

    setLoading(true);
    try {
      const res = await publicFetch("/api/accounts/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "تعذّر إرسال الطلب. حاول لاحقاً.");
        return;
      }
      setSuccess(
        data.message ||
          "إذا كان هذا البريد مسجّلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور."
      );
    } catch (err) {
      setError(formatPublicFetchError(err, "تعذّر الاتصال بالخادم."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              استعادة كلمة المرور
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm">
              أدخل البريد الإلكتروني المسجّل في حسابك وسنرسل لك رابط إعادة التعيين إن وُجد.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
              <p className="text-center text-xs text-slate-500">
                تحقق من صندوق الوارد ورسالة البريد غير المرغوب فيه.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href="/accounts"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  العودة لتسجيل الدخول
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess("");
                    setEmail("");
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  إرسال مرة أخرى
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="example@email.com"
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
                {loading ? "جاري الإرسال..." : "إرسال رابط إعادة تعيين كلمة المرور"}
              </button>

              <p className="text-center text-xs text-slate-500">
                <Link
                  href="/accounts"
                  className="font-semibold text-blue-700 underline-offset-4 hover:underline"
                >
                  العودة لتسجيل الدخول
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
