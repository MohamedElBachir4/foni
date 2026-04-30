"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAccount } from "@/context/AccountContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { formatDzd } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Wilaya = { id: number; name: string };
type Commune = { id: number; name: string; wilaya_id?: number };
type Center = {
  center_id: number;
  name: string;
  address?: string;
  commune_name?: string;
};

type FeesResponse = {
  from_wilaya_name?: string;
  to_wilaya_name?: string;
  per_commune?: Record<
    string,
    { express_home?: number; express_desk?: number; commune_name?: string }
  >;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { account, getAuthToken } = useAccount();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [communeName, setCommuneName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "stopdesk">("home");
  const [stopdeskId, setStopdeskId] = useState<number | "">("");

  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pendingStopdeskRestore = useRef<number | null>(null);
  const [restoredShippingHint, setRestoredShippingHint] = useState(false);

  useEffect(() => {
    if (!account) return;
    const token = getAuthToken();
    if (!token) return;
    let cancelled = false;
    pendingStopdeskRestore.current = null;
    fetch(`${API_URL}/api/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { account?: Record<string, unknown> } | null) => {
        if (cancelled || !data?.account) return;
        const a = data.account;
        const checkoutName = String(a.checkoutFullName || "").trim();
        const regName = `${String(a.firstName || "").trim()} ${String(a.lastName || "").trim()}`.trim();
        const full = checkoutName || regName;
        if (full) setFullName(full);
        const checkoutPhone = String(a.checkoutPhone || "").trim();
        const phoneVal = checkoutPhone || String(a.phone || "").trim();
        if (phoneVal) setPhone(phoneVal);
        const checkoutAddr = String(a.checkoutAddress || "").trim();
        const addrVal = checkoutAddr || String(a.address || "").trim();
        if (addrVal) setAddress(addrVal);
        const wid = a.checkoutWilayaId;
        if (wid != null && wid !== "" && Number.isFinite(Number(wid))) {
          setWilayaId(Number(wid));
        }
        const commune = String(a.checkoutCommune || "").trim();
        if (commune) setCommuneName(commune);
        const dt = a.checkoutDeliveryType;
        if (dt === "home" || dt === "stopdesk") setDeliveryType(dt);
        const sid = a.checkoutStopdeskId;
        if (dt === "stopdesk" && sid != null && sid !== "" && Number.isFinite(Number(sid))) {
          pendingStopdeskRestore.current = Number(sid);
        }
        const hadSavedCheckout =
          !!(checkoutName || checkoutPhone || checkoutAddr || commune || (wid != null && wid !== ""));
        if (hadSavedCheckout) setRestoredShippingHint(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [account, getAuthToken]);

  useEffect(() => {
    if (deliveryType !== "stopdesk") return;
    const want = pendingStopdeskRestore.current;
    if (want == null || centers.length === 0) return;
    if (centers.some((c) => c.center_id === want)) {
      setStopdeskId(want);
      pendingStopdeskRestore.current = null;
    }
  }, [deliveryType, centers]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/yalidine/wilayas`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setWilayas(
          list
            .map((w: any) => ({ id: Number(w.id), name: String(w.name || "") }))
            .filter((w: Wilaya) => w.id && w.name)
        );
      })
      .catch(() => setWilayas([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCommunes([]);
    setCenters([]);
    setCommuneName("");
    setStopdeskId("");
    setFees(null);
    if (!wilayaId) return;
    let cancelled = false;

    fetch(`${API_URL}/api/yalidine/communes?wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCommunes(
          list.map((c: any) => ({
            id: Number(c.id),
            name: String(c.name || ""),
            wilaya_id: Number(c.wilaya_id ?? 0),
          }))
        );
      })
      .catch(() => setCommunes([]));

    setFeesLoading(true);
    fetch(`${API_URL}/api/yalidine/fees?to_wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setFees(data || null);
      })
      .catch(() => setFees(null))
      .finally(() => {
        if (!cancelled) setFeesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wilayaId]);

  useEffect(() => {
    if (deliveryType !== "stopdesk" || !wilayaId) {
      setCenters([]);
      setStopdeskId("");
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/api/yalidine/centers?wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCenters(
          list.map((c: any) => ({
            center_id: Number(c.center_id ?? c.id),
            name: String(c.name || ""),
            address: c.address || "",
            commune_name: c.commune_name || "",
          }))
        );
      })
      .catch(() => setCenters([]));
    return () => {
      cancelled = true;
    };
  }, [deliveryType, wilayaId]);

  const deliveryFee = useMemo(() => {
    if (!fees || !communeName) return 0;
    const perCommune = fees.per_commune || {};
    const entry =
      perCommune[communeName] ||
      Object.values(perCommune).find((e: any) => e?.commune_name === communeName);
    if (!entry) return 0;
    const fee = deliveryType === "stopdesk" ? entry.express_desk : entry.express_home;
    return Number(fee) || 0;
  }, [fees, communeName, deliveryType]);

  const grandTotal = (Number(totalPrice) || 0) + (Number(deliveryFee) || 0);

  const selectedWilayaName = useMemo(() => {
    return wilayas.find((w) => w.id === Number(wilayaId))?.name || "";
  }, [wilayas, wilayaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("السلة فارغة. أضف منتجات قبل إتمام الطلب.");
      return;
    }
    if (!wilayaId) {
      setError("اختر الولاية");
      return;
    }
    if (!communeName) {
      setError("اختر البلدية");
      return;
    }
    if (deliveryType === "stopdesk" && !stopdeskId) {
      setError("اختر مركز التسليم");
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
          wilaya: selectedWilayaName,
          wilayaId: Number(wilayaId),
          commune: communeName,
          deliveryType,
          stopdeskId: deliveryType === "stopdesk" ? Number(stopdeskId) : null,
          deliveryFee,
          address: address.trim(),
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            color: i.color || "",
            productType: i.productType || "phone",
            image: i.image || "",
          })),
          totalPrice: grandTotal,
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
              <h2 className="mb-4 text-lg font-bold text-slate-800">ملخص الطلب</h2>
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
                        {item.quantity} × {formatDzd(item.price)} DA
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-800">
                      {formatDzd(item.price * item.quantity)} DA
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>مجموع المنتجات</span>
                  <span className="font-semibold">
                    {formatDzd(totalPrice)} DA
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>
                    سعر التوصيل
                    {deliveryType === "stopdesk" ? " (Stop desk)" : " (للمنزل)"}
                  </span>
                  <span className="font-semibold">
                    {feesLoading
                      ? "..."
                      : deliveryFee > 0
                      ? `${formatDzd(deliveryFee)} DA`
                      : wilayaId
                      ? "—"
                      : "اختر الولاية"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-semibold text-slate-700">
                    المجموع الكلي
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatDzd(grandTotal)} DA
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
              <>
                <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  أنت مسجّل الدخول كـ{" "}
                  <span className="font-bold">
                    {account.role === "grossiste" ? "بائع جملة" : "مصلح"}
                  </span>
                  {" — "}
                  سيُسجّل الطلب تلقائياً بهذا النوع.
                </p>
                {restoredShippingHint && (
                  <p className="mb-4 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-900">
                    تم ملء بيانات التوصيل من آخر طلب سجّلته في حسابك. يمكنك تعديلها قبل الإرسال.
                  </p>
                )}
              </>
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="wilaya"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    الولاية
                  </label>
                  <select
                    id="wilaya"
                    value={wilayaId}
                    onChange={(e) =>
                      setWilayaId(e.target.value ? Number(e.target.value) : "")
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">اختر الولاية</option>
                    {wilayas.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="commune"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    البلدية
                  </label>
                  <select
                    id="commune"
                    value={communeName}
                    onChange={(e) => setCommuneName(e.target.value)}
                    disabled={!wilayaId || communes.length === 0}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {wilayaId ? "اختر البلدية" : "اختر الولاية أولاً"}
                    </option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  نوع التوصيل
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("home")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      deliveryType === "home"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    توصيل للمنزل
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("stopdesk")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      deliveryType === "stopdesk"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Stop desk
                  </button>
                </div>
              </div>

              {deliveryType === "stopdesk" && (
                <div>
                  <label
                    htmlFor="stopdesk"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    مركز التسليم
                  </label>
                  <select
                    id="stopdesk"
                    value={stopdeskId}
                    onChange={(e) =>
                      setStopdeskId(e.target.value ? Number(e.target.value) : "")
                    }
                    disabled={!wilayaId || centers.length === 0}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {centers.length === 0 ? "لا توجد مراكز" : "اختر المركز"}
                    </option>
                    {centers.map((c) => (
                      <option key={c.center_id} value={c.center_id}>
                        {c.name}
                        {c.commune_name ? ` — ${c.commune_name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
