"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAccount } from "@/context/AccountContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { account, getAuthToken } = useAccount();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("السلة فارغة. أضف منتجات قبل إتمام الطلب.");
      return;
    }
    setLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const authToken = getAuthToken();
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          wilaya: wilaya.trim(),
          address: address.trim(),
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            color: i.color || "",
            productType: i.productType || "phone",
          })),
          totalPrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في حفظ الطلب");
      }
      clearCart();
      router.push("/checkout/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 pb-20 pt-28 sm:pt-32">
          <div className="flex flex-col items-center rounded-3xl border-0 bg-white p-10 text-center shadow-lg shadow-slate-200/50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              لا توجد منتجات في السلة
            </h2>
            <p className="mt-2 text-slate-500">
              أضف منتجات من المتجر ثم عد إلى إتمام الطلب.
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة إلى السلة
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            السلة
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            إتمام الطلب
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px,1fr]">
          <div>
            <div className="sticky top-28 rounded-2xl border-0 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-800">
                ملخص الطلب
              </h2>
              <ul className="max-h-64 space-y-3 overflow-y-auto sm:max-h-80">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl bg-slate-50/80 p-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="object-contain"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {item.price.toLocaleString()} دج
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-800">
                      {(item.price * item.quantity).toLocaleString()} دج
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    المجموع الكلي
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {totalPrice.toLocaleString()} دج
                  </span>
                </div>
              </div>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border-0 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"
          >
            {account && (
              <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                أنت مسجّل الدخول كـ{" "}
                <span className="font-bold">
                  {account.role === "grossiste" ? "بائع جملة" : "مصلح"}
                </span>
                {" — "}
                سيُسجّل الطلب تلقائياً بهذا النوع.
              </p>
            )}
            <h2 className="mb-6 text-lg font-bold text-slate-800">
              بيانات التوصيل
            </h2>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="الاسم الكامل"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="0550123456"
                />
              </div>
              <div>
                <label
                  htmlFor="wilaya"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  الولاية
                </label>
                <input
                  id="wilaya"
                  type="text"
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="الولاية"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  العنوان
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="العنوان الكامل للتوصيل"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-full bg-gradient-to-l from-blue-600 to-blue-500 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-xl disabled:opacity-60"
            >
              {loading ? "جاري إرسال الطلب..." : "إرسال الطلب"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
