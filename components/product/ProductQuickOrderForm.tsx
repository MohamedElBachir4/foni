"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import { checkoutRoleLabel } from "@/lib/accountRoles";
import { formatDzd } from "@/lib/pricing";
import { getProductColorLabelAr } from "@/lib/productColors";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";
import {
  loadGuestCheckoutShippingPrefs,
  saveGuestCheckoutShippingPrefs,
} from "@/lib/guestCheckoutPrefs";
import { publicFetch } from "@/lib/publicFetch";
import { TermsConsentCheckbox } from "@/components/legal/TermsConsentCheckbox";

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

type PendingCommuneRestore = { name: string; id: number | null };

export type QuickOrderLineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  option?: string;
  productType: "phone" | "accessory" | "sparePart";
  image?: string;
  variantSelections?: Array<{ label: string; price: number; quantity: number }>;
};

type ProductQuickOrderFormProps = {
  /** مجموع أسعار المنتجات قبل التوصيل */
  itemsSubtotal: number;
  availableColors?: string[];
  selectedColor?: string;
  onColorChange?: (colorId: string) => void;
  disabled?: boolean;
  /** يبني بنود الطلب عند الإرسال؛ يُرجع رسالة خطأ أو البنود */
  buildOrderItems: () => { error: string } | { items: QuickOrderLineItem[] };
};

function normalizeCommuneKey(s: string): string {
  return String(s || "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findCommuneInList(list: Commune[], pending: PendingCommuneRestore): Commune | undefined {
  if (pending.id != null && Number.isFinite(pending.id)) {
    const byId = list.find((c) => c.id === pending.id);
    if (byId) return byId;
  }
  const raw = pending.name.trim();
  if (!raw) return undefined;
  const exact = list.find((c) => c.name === raw);
  if (exact) return exact;
  const key = normalizeCommuneKey(raw);
  return list.find((c) => normalizeCommuneKey(c.name) === key);
}

export function ProductQuickOrderForm({
  itemsSubtotal,
  availableColors = [],
  selectedColor = "",
  onColorChange,
  disabled = false,
  buildOrderItems,
}: ProductQuickOrderFormProps) {
  const router = useRouter();
  const { account, getAuthToken, token, hydrated } = useAccount();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const pendingStopdeskRestore = useRef<number | null>(null);
  const pendingCommuneRestoreRef = useRef<PendingCommuneRestore | null>(null);
  const [restoredShippingHint, setRestoredShippingHint] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!account || !token) return;
    let cancelled = false;
    pendingStopdeskRestore.current = null;
    publicFetch("/api/accounts/me", {
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
        const commune = String(a.checkoutCommune || "").trim();
        const cidRaw = a.checkoutCommuneId;
        const communeIdStored =
          cidRaw != null && cidRaw !== "" && Number.isFinite(Number(cidRaw)) ? Number(cidRaw) : null;
        pendingCommuneRestoreRef.current =
          commune || communeIdStored != null ? { name: commune, id: communeIdStored } : null;

        if (wid != null && wid !== "" && Number.isFinite(Number(wid))) {
          setWilayaId(Number(wid));
        }
        const dt = a.checkoutDeliveryType;
        if (dt === "home" || dt === "stopdesk") setDeliveryType(dt);
        const sid = a.checkoutStopdeskId;
        if (dt === "stopdesk" && sid != null && sid !== "" && Number.isFinite(Number(sid))) {
          pendingStopdeskRestore.current = Number(sid);
        }
        const hadSavedCheckout = !!(
          checkoutName ||
          checkoutPhone ||
          checkoutAddr ||
          commune ||
          communeIdStored != null ||
          (wid != null && wid !== "")
        );
        if (hadSavedCheckout) setRestoredShippingHint(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, account, token]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) return;
    pendingCommuneRestoreRef.current = null;
    pendingStopdeskRestore.current = null;

    const prefs = loadGuestCheckoutShippingPrefs();
    if (!prefs) return;

    if (prefs.fullName) setFullName(prefs.fullName);
    if (prefs.phone) setPhone(prefs.phone);
    if (prefs.address) setAddress(prefs.address);

    const dt = prefs.deliveryType === "stopdesk" ? "stopdesk" : "home";
    setDeliveryType(dt);

    const cname = prefs.communeName.trim();
    const cid =
      prefs.communeId != null && Number.isFinite(Number(prefs.communeId)) ? Number(prefs.communeId) : null;
    pendingCommuneRestoreRef.current = cname || cid != null ? { name: cname, id: cid } : null;

    if (prefs.wilayaId && Number.isFinite(prefs.wilayaId)) {
      setWilayaId(prefs.wilayaId);
    }

    if (dt === "stopdesk" && prefs.stopdeskId != null && Number.isFinite(Number(prefs.stopdeskId))) {
      pendingStopdeskRestore.current = Number(prefs.stopdeskId);
    }

    const hadAny = Boolean(
      prefs.fullName?.trim() ||
        prefs.phone?.trim() ||
        prefs.address?.trim() ||
        prefs.communeName?.trim() ||
        (prefs.communeId != null && Number.isFinite(prefs.communeId)) ||
        (prefs.wilayaId != null && Number.isFinite(prefs.wilayaId))
    );
    if (hadAny) setRestoredShippingHint(true);
  }, [hydrated, token]);

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
            .map((w: { id?: number; name?: string }) => ({
              id: Number(w.id),
              name: String(w.name || ""),
            }))
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

    publicFetch(`/api/yalidine/communes?wilaya_id=${wilayaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        const mapped = list.map((c: { id?: number; name?: string; wilaya_id?: number }) => ({
          id: Number(c.id),
          name: String(c.name || ""),
          wilaya_id: Number(c.wilaya_id ?? 0),
        }));
        let nextCommune = "";
        const pending = pendingCommuneRestoreRef.current;
        if (pending && mapped.length) {
          const match = findCommuneInList(mapped, pending);
          pendingCommuneRestoreRef.current = null;
          if (match?.name) nextCommune = match.name;
        } else if (pending && mapped.length === 0) {
          pendingCommuneRestoreRef.current = null;
        }
        setCommunes(mapped);
        setCommuneName(nextCommune);
      })
      .catch(() => {
        pendingCommuneRestoreRef.current = null;
        setCommunes([]);
      });

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
          list.map((c: { center_id?: number; id?: number; name?: string; address?: string; commune_name?: string }) => ({
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
      Object.values(perCommune).find((e) => e?.commune_name === communeName);
    if (!entry) return 0;
    const fee = deliveryType === "stopdesk" ? entry.express_desk : entry.express_home;
    return Number(fee) || 0;
  }, [fees, communeName, deliveryType]);

  const grandTotal = (Number(itemsSubtotal) || 0) + (Number(deliveryFee) || 0);

  const selectedWilayaName = useMemo(() => {
    return wilayas.find((w) => w.id === Number(wilayaId))?.name || "";
  }, [wilayas, wilayaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (disabled) {
      setError("المنتج غير متوفر حالياً.");
      return;
    }
    if (availableColors.length > 0 && !String(selectedColor || "").trim()) {
      setError("اختر لوناً قبل تأكيد الطلب.");
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
    if (!acceptedTerms) {
      setError("يجب الموافقة على الشروط والأحكام وسياسة الخصوصية قبل تأكيد الطلب.");
      return;
    }

    const built = buildOrderItems();
    if ("error" in built) {
      setError(built.error);
      return;
    }
    if (!built.items.length) {
      setError("لا يمكن إتمام الطلب بدون منتجات.");
      return;
    }

    setLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const authToken = getAuthToken();
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const communeRowMatch = communes.find((c) => c.name === communeName.trim());
      const communeIdForOrder =
        communeRowMatch != null && Number.isFinite(communeRowMatch.id) ? communeRowMatch.id : null;
      const colorNorm = availableColors.length
        ? String(selectedColor).trim().toLowerCase()
        : "";

      const res = await publicFetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          wilaya: selectedWilayaName,
          wilayaId: Number(wilayaId),
          commune: communeName,
          communeId: communeIdForOrder,
          deliveryType,
          stopdeskId: deliveryType === "stopdesk" ? Number(stopdeskId) : null,
          deliveryFee,
          address: address.trim(),
          notes: notes.trim(),
          items: built.items.map((i) => {
            const base = {
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              color: i.color || colorNorm || "",
              option: i.option || "",
              productType: i.productType || "phone",
              image: i.image || "",
            };
            if (i.variantSelections?.length) {
              return {
                ...base,
                variantSelections: i.variantSelections.map((v) => ({
                  label: v.label,
                  price: v.price,
                  quantity: v.quantity,
                })),
              };
            }
            return base;
          }),
          totalPrice: grandTotal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في حفظ الطلب");
      }
      if (!authToken) {
        saveGuestCheckoutShippingPrefs({
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          wilayaId: Number(wilayaId),
          communeName: communeName.trim(),
          communeId: communeIdForOrder,
          deliveryType,
          stopdeskId: deliveryType === "stopdesk" ? Number(stopdeskId) : null,
        });
      }
      router.push("/checkout/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 className="mb-4 text-lg font-extrabold text-slate-900">تأكيد الطلب</h2>

      {account && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          أنت مسجّل الدخول كـ{" "}
          <span className="font-bold">{checkoutRoleLabel(account)}</span>
          {" — "}
          سيُسجّل الطلب تلقائياً بهذا النوع.
        </p>
      )}
      {!account && restoredShippingHint && token == null ? (
        <p className="mb-4 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
          تم ملء بيانات التوصيل تلقائياً من آخر طلب ناجِح على هذا الجهاز. يمكنك تعديل أي حقل قبل
          الإرسال.
        </p>
      ) : null}
      {account && restoredShippingHint ? (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-900">
          تم ملء بيانات التوصيل من آخر طلب مرتبط بحسابك. يمكنك تعديلها قبل الإرسال.
        </p>
      ) : null}

      {availableColors.length > 0 ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-2 text-sm font-extrabold text-slate-800">اختر اللون</p>
          <ProductColorSwatches
            colorIds={availableColors}
            value={selectedColor}
            onChange={(id) => {
              onColorChange?.(id);
              setError("");
            }}
            size="md"
            className="justify-start"
          />
          {selectedColor ? (
            <p className="mt-2 text-xs text-slate-600">{getProductColorLabelAr(selectedColor)}</p>
          ) : (
            <p className="mt-2 text-xs text-amber-700">اختر لوناً للمتابعة</p>
          )}
        </div>
      ) : null}

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between gap-2 text-slate-600">
          <span>مجموع المنتجات</span>
          <span className="font-semibold">{formatDzd(itemsSubtotal)} DA</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-slate-600">
          <span className="leading-snug">
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
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-700">المجموع الكلي</span>
          <span className="text-lg font-bold text-blue-600">{formatDzd(grandTotal)} DA</span>
        </div>
      </div>

      <h3 className="mb-4 text-base font-bold text-slate-800">بيانات التوصيل</h3>
      <div className="min-w-0 space-y-5">
        <div>
          <label htmlFor="product-order-fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
            الاسم الكامل
          </label>
          <input
            id="product-order-fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={disabled || loading}
            className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            placeholder="الاسم الكامل"
          />
        </div>
        <div>
          <label htmlFor="product-order-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
            رقم الهاتف
          </label>
          <input
            id="product-order-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            dir="ltr"
            disabled={disabled || loading}
            className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            placeholder="0550123456"
          />
        </div>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="product-order-wilaya" className="mb-1.5 block text-sm font-semibold text-slate-700">
              الولاية
            </label>
            <select
              id="product-order-wilaya"
              value={wilayaId}
              onChange={(e) => {
                pendingCommuneRestoreRef.current = null;
                setWilayaId(e.target.value ? Number(e.target.value) : "");
              }}
              required
              disabled={disabled || loading}
              className="form-select-responsive w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            >
              <option value="">اختر الولاية</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} - {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="product-order-commune" className="mb-1.5 block text-sm font-semibold text-slate-700">
              البلدية
            </label>
            <select
              id="product-order-commune"
              value={communeName}
              onChange={(e) => setCommuneName(e.target.value)}
              disabled={disabled || loading || !wilayaId || communes.length === 0}
              required
              className="form-select-responsive w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{wilayaId ? "اختر البلدية" : "اختر الولاية أولاً"}</option>
              {communes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">نوع التوصيل</span>
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType("home")}
              disabled={disabled || loading}
              className={`min-w-0 rounded-xl border px-3 py-3 text-sm font-semibold transition sm:px-4 ${
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
              disabled={disabled || loading}
              className={`min-w-0 rounded-xl border px-3 py-3 text-sm font-semibold transition sm:px-4 ${
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
            <label htmlFor="product-order-stopdesk" className="mb-1.5 block text-sm font-semibold text-slate-700">
              مركز التسليم
            </label>
            <select
              id="product-order-stopdesk"
              value={stopdeskId}
              onChange={(e) => setStopdeskId(e.target.value ? Number(e.target.value) : "")}
              disabled={disabled || loading || !wilayaId || centers.length === 0}
              required
              className="form-select-responsive w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{centers.length === 0 ? "لا توجد مراكز" : "اختر المركز"}</option>
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
          <label htmlFor="product-order-address" className="mb-1.5 block text-sm font-semibold text-slate-700">
            العنوان
          </label>
          <textarea
            id="product-order-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={3}
            disabled={disabled || loading}
            className="w-full min-w-0 max-w-full break-words rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            placeholder="العنوان الكامل للتوصيل"
          />
        </div>

        <div>
          <label htmlFor="product-order-notes" className="mb-1.5 block text-sm font-semibold text-slate-700">
            ملاحظة <span className="font-normal text-slate-500">(اختياري)</span>
          </label>
          <textarea
            id="product-order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={disabled || loading}
            className="w-full min-w-0 max-w-full break-words rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
            placeholder="أي تفاصيل إضافية للطلب أو التوصيل (مثال: وقت التوصيل المناسب، تعليمات الوصول...)"
          />
          <p className="mt-1 text-xs text-slate-500">{notes.length}/500</p>
        </div>
      </div>

      <div className="mt-5">
        <TermsConsentCheckbox
          id="product-order-terms"
          checked={acceptedTerms}
          onChange={(v) => {
            setAcceptedTerms(v);
            if (v) setError("");
          }}
          disabled={disabled || loading}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading || disabled || !acceptedTerms}
        className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {loading ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
      </button>
    </form>
  );
}
