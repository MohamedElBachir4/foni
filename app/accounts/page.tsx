"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { publicFetch } from "@/lib/publicFetch";
import { useAccount } from "@/context/AccountContext";
import { MyOrdersTab } from "@/components/accounts/MyOrdersTab";

import { roleLabelAr, isMerchantRole } from "@/lib/accountRoles";

type Role = "customer" | "merchant" | null;

const FALLBACK_WHATSAPP = "213542458175";
const FALLBACK_PHONE_DISPLAY = "+213 542 45 81 75";
const FALLBACK_PHONE_TEL = "+213542458175";

type SupportContact = {
  whatsappHref: string;
  whatsappDisplay: string;
  phoneHref: string;
  phoneDisplay: string;
};

function formatWaDisplay(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("213") && d.length >= 12) {
    return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return d ? `+${d}` : FALLBACK_PHONE_DISPLAY;
}

function buildActivationWhatsAppHref(number: string, role: Role) {
  const n = number.replace(/\D/g, "") || FALLBACK_WHATSAPP;
  const roleAr = role === "merchant" ? "تاجر" : "زبون";
  const text = encodeURIComponent(
    `السلام عليكم، قمت بإنشاء حساب ${roleAr} على موقع فوني وأرغب في تفعيل الحساب.`
  );
  return `https://wa.me/${n}?text=${text}`;
}

const WILAYAS = [
  "01 - أدرار",
  "02 - الشلف",
  "03 - الأغواط",
  "04 - أم البواقي",
  "05 - باتنة",
  "06 - بجاية",
  "07 - بسكرة",
  "08 - بشار",
  "09 - البليدة",
  "10 - البويرة",
  "11 - تمنراست",
  "12 - تبسة",
  "13 - تلمسان",
  "14 - تيارت",
  "15 - تيزي وزو",
  "16 - الجزائر",
  "17 - الجلفة",
  "18 - جيجل",
  "19 - سطيف",
  "20 - سعيدة",
  "21 - سكيكدة",
  "22 - سيدي بلعباس",
  "23 - عنابة",
  "24 - قالمة",
  "25 - قسنطينة",
  "26 - المدية",
  "27 - مستغانم",
  "28 - المسيلة",
  "29 - معسكر",
  "30 - ورقلة",
  "31 - وهران",
  "32 - البيض",
  "33 - إليزي",
  "34 - برج بوعريريج",
  "35 - بومرداس",
  "36 - الطارف",
  "37 - تندوف",
  "38 - تيسمسيلت",
  "39 - الوادي",
  "40 - خنشلة",
  "41 - سوق أهراس",
  "42 - تيبازة",
  "43 - ميلة",
  "44 - عين الدفلى",
  "45 - النعامة",
  "46 - عين تموشنت",
  "47 - غرداية",
  "48 - غليزان",
  "49 - تيميمون",
  "50 - برج باجي مختار",
  "51 - أولاد جلال",
  "52 - بني عباس",
  "53 - إن صالح",
  "54 - إن قزام",
  "55 - تقرت",
  "56 - جانت",
  "57 - المغير",
  "58 - المنيعة",
];

function AccountsPageContent() {
  const { account, setFromApi, logout, setUseWholesalePricing } = useAccount();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [supportContact, setSupportContact] = useState<SupportContact>({
    whatsappHref: buildActivationWhatsAppHref(FALLBACK_WHATSAPP, null),
    whatsappDisplay: formatWaDisplay(FALLBACK_WHATSAPP),
    phoneHref: `tel:${FALLBACK_PHONE_TEL}`,
    phoneDisplay: FALLBACK_PHONE_DISPLAY,
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [accountTab, setAccountTab] = useState<"profile" | "orders">("profile");
  const [wholesaleSaving, setWholesaleSaving] = useState(false);
  const [wholesaleError, setWholesaleError] = useState("");
  const registrationFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/contact-settings/public", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const wa = items.find(
          (i: { id?: string; href?: string }) =>
            String(i.id || "").startsWith("whatsapp") && i.href
        );
        const phone = items.find(
          (i: { id?: string; href?: string }) => i.id === "phone" && i.href
        );
        if (cancelled) return;
        const waDigits =
          String(wa?.href || "")
            .match(/wa\.me\/(\d+)/)?.[1] || FALLBACK_WHATSAPP;
        const phoneHref = phone?.href || `tel:${FALLBACK_PHONE_TEL}`;
        const phoneDigits = String(phoneHref).replace(/^tel:/i, "");
        setSupportContact({
          whatsappHref: buildActivationWhatsAppHref(waDigits, role),
          whatsappDisplay: formatWaDisplay(waDigits),
          phoneHref,
          phoneDisplay: formatWaDisplay(phoneDigits.replace(/\D/g, "")) || FALLBACK_PHONE_DISPLAY,
        });
      } catch {
        /* keep fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function handleWholesaleToggle(enabled: boolean) {
    setWholesaleError("");
    setWholesaleSaving(true);
    try {
      await setUseWholesalePricing(enabled);
    } catch (err) {
      setWholesaleError(
        err instanceof Error ? err.message : "تعذّر تحديث الإعداد"
      );
    } finally {
      setWholesaleSaving(false);
    }
  }

  useEffect(() => {
    if (!account) return;
    const tab = searchParams.get("tab");
    if (tab === "orders") setAccountTab("orders");
    else if (tab === "profile") setAccountTab("profile");
  }, [account, searchParams]);

  useEffect(() => {
    if (account) return;
    const reg = searchParams.get("register");
    if (reg === "customer" || reg === "merchant") setRole(reg);
    if (reg === "reparateur") setRole("merchant");
  }, [account, searchParams]);

  /** بعد اختيار نوع الحساب أو فتح ?register= — التمرير إلى نموذج المعلومات (مع هامش للشريط العلوي). */
  useEffect(() => {
    if (account || !role) return;
    const id = requestAnimationFrame(() => {
      registrationFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [account, role]);

  useEffect(() => {
    if (!successModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [successModalOpen]);

  const isMerchant = role === "merchant";
  const isCustomer = role === "customer";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!role) {
      setError("الرجاء اختيار نوع الحساب.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("الاسم واللقب مطلوبان.");
      return;
    }
    if (!phone.trim()) {
      setError("رقم الهاتف مطلوب.");
      return;
    }
    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة السر يجب أن تكون 6 أحرف أو أكثر.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("تأكيد كلمة السر غير مطابق.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicFetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          password,
          wilaya,
          shopName,
          address,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "فشل في إنشاء الحساب");
      }
      setSuccess(
        data.message ||
          "تم استلام طلب إنشاء الحساب بنجاح. يرجى مراسلة فريق الدعم عبر واتساب أو الاتصال هاتفياً لتفعيل حسابك."
      );
      setSupportContact((prev) => ({
        ...prev,
        whatsappHref: buildActivationWhatsAppHref(
          prev.whatsappHref.match(/wa\.me\/(\d+)/)?.[1] || FALLBACK_WHATSAPP,
          role
        ),
      }));
      setSuccessModalOpen(true);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setWilaya("");
      setShopName("");
      setAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setSuccess("");
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("البريد الإلكتروني وكلمة السر مطلوبان.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await publicFetch("/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "فشل في تسجيل الدخول");
      }
      setFromApi(data);
      setSuccess("تم تسجيل الدخول بنجاح.");
      setLoginPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "خطأ في تسجيل الدخول");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-col px-3 pt-28 pb-8 sm:px-4 sm:pt-32 sm:pb-10 md:pt-32 md:pb-12">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl ring-1 ring-slate-100/80 sm:p-7 md:p-8">
          <div className="space-y-4 sm:space-y-5">
            {account && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-800 sm:text-sm">
                أنت مسجل الدخول كـ{" "}
                <span className="font-semibold">
                  {account.firstName} {account.lastName} (
                  {roleLabelAr(account.role)})
                </span>
                . يمكنك المتابعة في تصفح الموقع أو{" "}
                <button
                  type="button"
                  onClick={logout}
                  className="font-semibold underline underline-offset-2"
                >
                  تسجيل الخروج
                </button>
                .
              </div>
            )}

            {account && (
              <div
                className="flex gap-1 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-100/95 to-slate-50/90 p-1 shadow-inner"
                role="tablist"
                aria-label="أقسام الحساب"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={accountTab === "profile"}
                  onClick={() => setAccountTab("profile")}
                  className={`flex-1 rounded-xl px-3 py-3 text-center text-xs font-bold transition sm:text-sm ${
                    accountTab === "profile"
                      ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/90"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  الملف الشخصي
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={accountTab === "orders"}
                  onClick={() => setAccountTab("orders")}
                  className={`flex-1 rounded-xl px-3 py-3 text-center text-xs font-bold transition sm:text-sm ${
                    accountTab === "orders"
                      ? "bg-white text-blue-900 shadow-md shadow-blue-200/40 ring-1 ring-blue-200/80"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  طلباتي
                </button>
              </div>
            )}

            {account && accountTab === "orders" ? (
              <MyOrdersTab />
            ) : (
              <>
            {account && (
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-base font-bold text-white shadow-sm">
                    {`${(account.firstName || "").charAt(0)}${(account.lastName || "").charAt(0)}`.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 sm:text-base">
                      {account.firstName} {account.lastName}
                    </p>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      نوع الحساب: {roleLabelAr(account.role)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-700 sm:text-sm">
                  <p>
                    <span className="font-semibold">الهاتف: </span>
                    <span dir="ltr">{account.phone}</span>
                  </p>
                  <p>
                    <span className="font-semibold">البريد: </span>
                    {account.email}
                  </p>
                  {account.wilaya && (
                    <p>
                      <span className="font-semibold">الولاية: </span>
                      {account.wilaya}
                    </p>
                  )}
                  {account.address && (
                    <p>
                      <span className="font-semibold">العنوان: </span>
                      {account.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {account && isMerchantRole(account.role) && account.approvalStatus === "approved" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-amber-950 sm:text-base">
                  تفعيل الشراء بالجملة
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-amber-900/90 sm:text-sm">
                  عند التفعيل تُعرض أسعار الجملة في المنتجات والسلة والدفع. عند الإلغاء تُعرض
                  أسعار التاجر/صاحب المحل.
                </p>
                <button
                  type="button"
                  disabled={wholesaleSaving}
                  onClick={() => handleWholesaleToggle(!account.useWholesalePricing)}
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold sm:w-auto sm:text-sm ${
                    account.useWholesalePricing
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  } disabled:opacity-60`}
                >
                  {wholesaleSaving
                    ? "جاري الحفظ..."
                    : account.useWholesalePricing
                      ? "مفعّل: أسعار الجملة — إلغاء التفعيل"
                      : "تفعيل الشراء بالجملة"}
                </button>
                {wholesaleError && (
                  <p className="mt-2 text-xs font-medium text-red-600">{wholesaleError}</p>
                )}
              </div>
            )}

            {!account && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-bold text-slate-900 sm:text-base">
                لديك حساب مسبقاً ؟ قم بتسجيل الدخول
              </h2>
              <p className="mb-3 text-xs text-amber-700 sm:text-sm">
                ملاحظة: حساب التاجر يحتاج موافقة الإدارة قبل تسجيل الدخول. حساب الزبون يُفعَّل فوراً.
              </p>
              <form
                onSubmit={handleLogin}
                className="grid gap-3 sm:grid-cols-[2fr,2fr,auto]"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    كلمة السر
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                  />
                  <div className="pt-1">
                    <Link
                      href="/accounts/forgot-password"
                      className="text-[11px] font-semibold text-blue-700 underline-offset-4 transition hover:text-blue-800 hover:underline sm:text-xs"
                    >
                      هل نسيت كلمة المرور؟
                    </Link>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto sm:px-6 sm:text-sm"
                  >
                    {loginLoading ? "جاري الدخول..." : "تسجيل الدخول"}
                  </button>
                </div>
              </form>
              {loginError && (
                <p className="mt-2 text-xs font-medium text-red-600 sm:text-sm">
                  {loginError}
                </p>
              )}
            </div>
            )}

            {!account && (
            <div className="space-y-2 text-center">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                إنشاء حساب جديد
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm">
                اختر بين حساب <span className="font-semibold">زبون</span> أو{" "}
                <span className="font-semibold">تاجر أو صاحب محل</span>.
              </p>
            </div>
            )}

            {!account && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <article className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300/70 hover:bg-white sm:p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                      حساب زبون
                    </h2>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm sm:text-xs">
                      أسعار التجزئة
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-600 sm:text-sm">
                    للشراء الشخصي بأسعار التجزئة. يُفعَّل فوراً ويمكنك تسجيل الدخول مباشرة.
                  </p>
                </div>
                <button
                  type="button"
                  className={`mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-[12px] font-semibold shadow-sm sm:text-sm ${
                    isCustomer
                      ? "bg-blue-700 text-white"
                      : "bg-slate-900 text-white hover:bg-blue-800"
                  }`}
                  onClick={() => setRole("customer")}
                >
                  اختيار حساب زبون
                </button>
              </article>

              <article className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300/70 hover:bg-white sm:p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                      حساب تاجر أو صاحب محل
                    </h2>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm sm:text-xs">
                      أسعار مهنية
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-600 sm:text-sm">
                    أسعار خاصة للتجار. بعد الموافقة يمكنك تفعيل{" "}
                    <span className="font-semibold">الشراء بالجملة</span> من ملفك الشخصي.
                  </p>
                </div>
                <button
                  type="button"
                  className={`mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-[12px] font-semibold shadow-sm sm:text-sm ${
                    isMerchant
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  onClick={() => setRole("merchant")}
                >
                  اختيار حساب تاجر أو صاحب محل
                </button>
              </article>
            </div>
            )}

            {!account && role && (
              <div
                ref={registrationFormRef}
                id="account-registration-form"
                className="mt-6 scroll-mt-28 space-y-3 border-t border-slate-100 pt-4 sm:scroll-mt-32"
              >
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  {isMerchant
                    ? "معلومات حساب تاجر أو صاحب محل"
                    : "معلومات حساب زبون"}
                </h2>
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      الاسم
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      اللقب
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      كلمة السر
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      تأكيد كلمة السر
                    </label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      الولاية
                    </label>
                    <select
                      value={wilaya}
                      onChange={(e) => setWilaya(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                    >
                      <option value="">اختر ولايتك</option>
                      {WILAYAS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isMerchant && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">
                        اسم المحل
                      </label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:text-sm"
                    />
                  </div>

                  {error && (
                    <div className="sm:col-span-2">
                      <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:text-sm">
                        {error}
                      </p>
                    </div>
                  )}
                  {success && (
                    <div className="sm:col-span-2">
                      <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-900 sm:text-sm">
                        {success}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto sm:px-6 sm:text-sm"
                    >
                      {submitting ? "جاري الإرسال..." : "إرسال طلب إنشاء الحساب"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            </>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 sm:text-xs">
              <span>يمكنك دائماً تغيير نوع الحساب بالتواصل مع فريق الدعم.</span>
              <Link
                href="/"
                className="text-[11px] font-semibold text-blue-700 underline-offset-4 transition hover:text-blue-800 hover:underline sm:text-xs"
              >
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {successModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activation-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setSuccessModalOpen(false)}
            aria-label="إغلاق النافذة"
          />
          <div className="relative w-full max-w-[26rem] animate-[successPop_.34s_cubic-bezier(.22,1,.36,1)] overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-18px_rgba(15,23,42,.45)] ring-1 ring-slate-200/80">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pb-8 pt-7 text-center text-white">
              <div
                className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-sky-400/15 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-emerald-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="relative text-[11px] font-semibold tracking-wide text-sky-200/90">
                فوني · تفعيل الحساب
              </p>
              <h3
                id="activation-modal-title"
                className="relative mt-1.5 text-xl font-extrabold tracking-tight"
              >
                تم استلام طلبك بنجاح
              </h3>
              <p className="relative mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-slate-200/90">
                حسابك جاهز تقريباً — يبقى خطوة أخيرة لتفعيله.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3.5 text-center">
                <p className="text-sm font-bold leading-relaxed text-slate-800">
                  يجب عليك مراسلة فريق الدعم عبر{" "}
                  <span className="text-emerald-700">واتساب</span> أو{" "}
                  <span className="text-blue-700">الاتصال هاتفياً</span> لتفعيل الحساب
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  لن تتمكن من تسجيل الدخول قبل تفعيل الحساب من فريق الدعم.
                </p>
              </div>

              <div className="grid gap-2.5">
                <a
                  href={supportContact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-[#25D366] px-4 py-3.5 text-white shadow-sm transition hover:bg-[#1ebe57] hover:shadow-md active:scale-[0.99]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <SiWhatsapp className="h-5 w-5" />
                    </span>
                    <span className="text-start">
                      <span className="block text-sm font-bold">مراسلة عبر واتساب</span>
                      <span className="mt-0.5 block text-[11px] font-medium text-white/85" dir="ltr">
                        {supportContact.whatsappDisplay}
                      </span>
                    </span>
                  </span>
                  <span className="text-lg opacity-80 transition group-hover:translate-x-[-2px]" aria-hidden>
                    ←
                  </span>
                </a>

                <a
                  href={supportContact.phoneHref}
                  className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-blue-700 px-4 py-3.5 text-white shadow-sm transition hover:bg-blue-800 hover:shadow-md active:scale-[0.99]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span className="text-start">
                      <span className="block text-sm font-bold">اتصال هاتفي</span>
                      <span className="mt-0.5 block text-[11px] font-medium text-white/85" dir="ltr">
                        {supportContact.phoneDisplay}
                      </span>
                    </span>
                  </span>
                  <span className="text-lg opacity-80 transition group-hover:translate-x-[-2px]" aria-hidden>
                    ←
                  </span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
              >
                حسناً، سأتواصل لاحقاً
              </button>
            </div>
          </div>
          <style jsx>{`
            @keyframes successPop {
              0% {
                opacity: 0;
                transform: translateY(16px) scale(0.96);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 antialiased">
          <Navbar />
          <main className="mx-auto flex w-full max-w-4xl flex-col px-3 pt-32 pb-16 sm:px-4">
            <p className="text-center text-sm text-slate-500">جاري التحميل…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <AccountsPageContent />
    </Suspense>
  );
}
