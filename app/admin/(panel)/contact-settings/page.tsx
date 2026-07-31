"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { Share2, CheckCircle, AlertCircle } from "lucide-react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin";

const WHATSAPP_SLOTS = 3;
const PHONE_SLOTS = 3;

type ContactSettingsForm = {
  whatsappNumbers: string[];
  whatsappEnabled: boolean;
  phoneNumbers: string[];
  phoneEnabled: boolean;
  messengerUrl: string;
  messengerEnabled: boolean;
};

const EMPTY_WHATSAPP = ["", "", ""];
const EMPTY_PHONES = ["", "", ""];

const EMPTY_FORM: ContactSettingsForm = {
  whatsappNumbers: [...EMPTY_WHATSAPP],
  whatsappEnabled: true,
  phoneNumbers: [...EMPTY_PHONES],
  phoneEnabled: false,
  messengerUrl: "",
  messengerEnabled: false,
};

function normalizeSlots(raw: unknown, size: number, legacy?: unknown): string[] {
  const slots = Array.from({ length: size }, () => "");
  if (Array.isArray(raw)) {
    raw.slice(0, size).forEach((n, i) => {
      slots[i] = String(n || "").trim();
    });
    if (slots.some((s) => s)) return slots;
  }
  const legacyStr = typeof legacy === "string" ? legacy.trim() : "";
  if (legacyStr) slots[0] = legacyStr;
  return slots;
}

export default function ContactSettingsPage() {
  const [form, setForm] = useState<ContactSettingsForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const whatsappNumbers = Array.isArray(form.whatsappNumbers)
    ? form.whatsappNumbers
    : EMPTY_WHATSAPP;
  const phoneNumbers = Array.isArray(form.phoneNumbers) ? form.phoneNumbers : EMPTY_PHONES;

  const applyPayload = useCallback((data: Record<string, unknown>) => {
    setForm({
      whatsappNumbers: normalizeSlots(
        data.whatsappNumbers,
        WHATSAPP_SLOTS,
        data.whatsappNumber
      ),
      whatsappEnabled: Boolean(data.whatsappEnabled),
      phoneNumbers: normalizeSlots(data.phoneNumbers, PHONE_SLOTS, data.phoneNumber),
      phoneEnabled: Boolean(data.phoneEnabled),
      messengerUrl: String(data.messengerUrl || ""),
      messengerEnabled: Boolean(data.messengerEnabled),
    });
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact-settings`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        applyPayload(data);
      }
    } catch {
      setMessage({ type: "error", text: "تعذر تحميل الإعدادات" });
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function updateField<K extends keyof ContactSettingsForm>(key: K, value: ContactSettingsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateWhatsAppSlot(index: number, value: string) {
    setForm((prev) => {
      const next = [...(Array.isArray(prev.whatsappNumbers) ? prev.whatsappNumbers : EMPTY_WHATSAPP)];
      while (next.length < WHATSAPP_SLOTS) next.push("");
      next[index] = value;
      return { ...prev, whatsappNumbers: next };
    });
  }

  function updatePhoneSlot(index: number, value: string) {
    setForm((prev) => {
      const next = [...(Array.isArray(prev.phoneNumbers) ? prev.phoneNumbers : EMPTY_PHONES)];
      while (next.length < PHONE_SLOTS) next.push("");
      next[index] = value;
      return { ...prev, phoneNumbers: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        whatsappNumbers,
        phoneNumbers,
      };
      const res = await fetch(`${API_URL}/api/contact-settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        applyPayload(data);
        setMessage({ type: "success", text: "تم حفظ إعدادات وسائل التواصل" });
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحفظ" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  }

  const messageEl =
    message &&
    (message.type === "success" ? (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle className="h-5 w-5 shrink-0" />
        {message.text}
      </div>
    ) : (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {message.text}
      </div>
    ));

  function channelCard(
    title: string,
    enabled: boolean,
    onToggle: (v: boolean) => void,
    children: React.ReactNode
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-3 flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-800">{title}</span>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            {enabled ? "مفعّل" : "معطّل"}
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
          </span>
        </label>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إعدادات وسائل التواصل"
        description="إدارة زر التواصل العائم وأرقام الهاتف في الفوتر — حتى 3 أرقام واتساب و3 أرقام هاتف."
        icon={<Share2 className="h-6 w-6" />}
      />

      {messageEl}

      <AdminCard title="القنوات">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">جاري التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {channelCard("واتساب", form.whatsappEnabled, (v) => updateField("whatsappEnabled", v), (
              <div className={`space-y-3 ${form.whatsappEnabled ? "" : "pointer-events-none opacity-50"}`}>
                {whatsappNumbers.map((number, index) => (
                  <div key={index}>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      رقم واتساب {index + 1}
                      {index === 0 ? " (إلزامي عند التفعيل)" : " (اختياري)"}
                    </label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => updateWhatsAppSlot(index, e.target.value)}
                      placeholder="213542458175 أو 0542458175"
                      dir="ltr"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500">بدون مسافات — يُفضّل الصيغة الدولية 213…</p>
              </div>
            ))}

            {channelCard("اتصال هاتفي (الفوتر + الزر العائم)", form.phoneEnabled, (v) => updateField("phoneEnabled", v), (
              <div className="space-y-3">
                <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                  الأرقام أدناه تظهر في <strong>الفوتر</strong> مكان رقم الهاتف. عند تفعيل المربّع أعلاه تظهر أيضاً في الزر العائم.
                </p>
                {phoneNumbers.map((number, index) => (
                  <div key={index}>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      رقم هاتف {index + 1}
                      {index === 0 ? " (يظهر في الفوتر)" : " (اختياري — فوتر)"}
                    </label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => updatePhoneSlot(index, e.target.value)}
                      placeholder="+213542458175 أو 0542458175"
                      dir="ltr"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                    />
                  </div>
                ))}
              </div>
            ))}

            {channelCard("ماسنجر", form.messengerEnabled, (v) => updateField("messengerEnabled", v), (
              <div className={form.messengerEnabled ? "" : "pointer-events-none opacity-50"}>
                <label className="mb-1 block text-xs font-semibold text-slate-600">رابط ماسنجر</label>
                <input
                  type="url"
                  value={form.messengerUrl}
                  onChange={(e) => updateField("messengerUrl", e.target.value)}
                  placeholder="https://m.me/username"
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                />
              </div>
            ))}

            <AdminButton type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </AdminButton>
          </form>
        )}
      </AdminCard>
    </div>
  );
}
