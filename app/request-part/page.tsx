"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { publicFetch } from "@/lib/publicFetch";

type Wilaya = { id: number; name: string };
type Commune = { id: number; name: string; wilaya_id?: number };
type Center = { center_id: number; name: string; commune_name?: string };
type YalidineWilayaRow = { id?: number | string; name?: string };
type YalidineCommuneRow = {
  id?: number | string;
  name?: string;
  wilaya_id?: number | string;
};
type YalidineCenterRow = {
  center_id?: number | string;
  id?: number | string;
  name?: string;
  commune_name?: string;
};
type FeesResponse = {
  per_commune?: Record<
    string,
    { express_home?: number; express_desk?: number; commune_name?: string }
  >;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export default function RequestPartPage() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilayaId, setWilayaId] = useState<number | "">("");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [communeName, setCommuneName] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "stopdesk">("home");
  const [stopdeskId, setStopdeskId] = useState<number | "">("");
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    let cancelled = false;
    publicFetch("/api/yalidine/wilayas")
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
            .map((w: YalidineWilayaRow) => ({
              id: Number(w?.id),
              name: String(w?.name || ""),
            }))
            .filter((w: Wilaya) => w.id && w.name)
        );
      })
      .catch(() => setWilayas([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      productName.trim().length > 0 &&
      customerName.trim().length > 0 &&
      phone.trim().length > 0 &&
      address.trim().length > 0 &&
      Boolean(wilayaId) &&
      communeName.trim().length > 0 &&
      (deliveryType === "home" || Boolean(stopdeskId))
    );
  }, [
    productName,
    customerName,
    phone,
    address,
    wilayaId,
    communeName,
    deliveryType,
    stopdeskId,
  ]);

  const selectedWilayaName = useMemo(() => {
    return wilayas.find((w) => w.id === Number(wilayaId))?.name || "";
  }, [wilayas, wilayaId]);

  useEffect(() => {
    setCommunes([]);
    setCenters([]);
    setCommuneName("");
    setStopdeskId("");
    setFees(null);
    if (!wilayaId) return;
    let cancelled = false;

    publicFetch(`/api/yalidine/communes?wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setCommunes(
          list.map((c: YalidineCommuneRow) => ({
            id: Number(c?.id),
            name: String(c?.name || ""),
            wilaya_id: Number(c?.wilaya_id ?? 0),
          }))
        );
      })
      .catch(() => setCommunes([]));

    setFeesLoading(true);
    publicFetch(`/api/yalidine/fees?to_wilaya_id=${wilayaId}`)
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
    publicFetch(`/api/yalidine/centers?wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setCenters(
          list.map((c: YalidineCenterRow) => ({
            center_id: Number(c?.center_id ?? c?.id),
            name: String(c?.name || ""),
            commune_name: String(c?.commune_name || ""),
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
      Object.values(perCommune).find((e) => e?.commune_name === communeName);
    if (!entry) return 0;
    const fee = deliveryType === "stopdesk" ? entry.express_desk : entry.express_home;
    return Number(fee) || 0;
  }, [fees, communeName, deliveryType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    if (!canSubmit) {
      setToast({ type: "error", message: "يرجى ملء كل الحقول المطلوبة" });
      return;
    }
    setLoading(true);
    try {
      const res = await publicFetch("/api/part-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          description: description.trim(),
          customerName: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          wilaya: selectedWilayaName,
          commune: communeName.trim(),
          deliveryType,
          stopdeskId: deliveryType === "stopdesk" ? Number(stopdeskId) : null,
          deliveryFee,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "تعذر إرسال الطلب");
      }
      setProductName("");
      setDescription("");
      setCustomerName("");
      setPhone("");
      setAddress("");
      setWilayaId("");
      setCommuneName("");
      setDeliveryType("home");
      setStopdeskId("");
      router.push("/request-part/success");
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            العودة للرئيسية
          </Link>
          <h1 className="mt-3 text-3xl font-black text-slate-900">طلب قطعة غير موجودة</h1>
          <p className="mt-2 text-sm text-slate-600">
            إذا لم تجد القطعة داخل الموقع، أرسل لنا الطلب وسيتواصل معك الفريق.
          </p>
        </div>

        {toast ? (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-800">معلومات القطعة</h2>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">اسم القطعة *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="مثال: شاشة iPhone 11"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">وصف القطعة</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="أي تفاصيل إضافية (اختياري)"
            />
          </div>

          <h2 className="border-t border-slate-100 pt-5 text-lg font-bold text-slate-800">
            معلومات الزبون
          </h2>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">الاسم الكامل *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">رقم الهاتف *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">الولاية *</label>
            <select
              value={wilayaId}
              onChange={(e) => setWilayaId(e.target.value ? Number(e.target.value) : "")}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            <label className="mb-1 block text-sm font-semibold text-slate-700">البلدية *</label>
            <select
              value={communeName}
              onChange={(e) => setCommuneName(e.target.value)}
              required
              disabled={!wilayaId || communes.length === 0}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div>
            <span className="mb-1 block text-sm font-semibold text-slate-700">نوع التوصيل *</span>
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
                إلى المنزل
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
                إلى المكتب
              </button>
            </div>
          </div>
          {deliveryType === "stopdesk" ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                مكتب التسليم *
              </label>
              <select
                value={stopdeskId}
                onChange={(e) => setStopdeskId(e.target.value ? Number(e.target.value) : "")}
                required
                disabled={!wilayaId || centers.length === 0}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {centers.length === 0 ? "لا توجد مكاتب متاحة" : "اختر المكتب"}
                </option>
                {centers.map((c) => (
                  <option key={c.center_id} value={c.center_id}>
                    {c.name}
                    {c.commune_name ? ` - ${c.commune_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">العنوان *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "جاري إرسال الطلب..." : "إرسال الطلب"}
          </button>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-semibold text-amber-900">
              سعر المنتج: سوف يتم ارساله لك من طرف فريق Foni
            </p>
            <p className="mt-1 text-amber-800">
              سعر التوصيل:
              <span className="mr-1 font-bold">
                {feesLoading
                  ? "جاري الحساب..."
                  : deliveryFee > 0
                    ? `${deliveryFee.toLocaleString()} دج`
                    : "900 دج"}
              </span>
            </p>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
