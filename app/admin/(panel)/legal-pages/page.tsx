"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { AlertCircle, CheckCircle, ExternalLink, Eye, FileText, Pencil, RotateCcw } from "lucide-react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin";
import { LegalContent } from "@/components/legal/LegalContent";
import { LEGAL_DEFAULTS, type LegalDocument } from "@/lib/legalDefaults";
import { LEGAL_SLUGS, type LegalSlug } from "@/lib/legalContent";

const TAB_LABELS: Record<LegalSlug, string> = {
  privacy: "سياسة الخصوصية",
  terms: "الشروط والأحكام",
};

const PUBLIC_PATHS: Record<LegalSlug, string> = {
  privacy: "/privacy",
  terms: "/terms",
};

type FormState = LegalDocument & { savedAt: string | null };

const INITIAL_FORMS: Record<LegalSlug, FormState> = {
  privacy: { ...LEGAL_DEFAULTS.privacy, savedAt: null },
  terms: { ...LEGAL_DEFAULTS.terms, savedAt: null },
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2";

export default function LegalPagesAdmin() {
  const [active, setActive] = useState<LegalSlug>("privacy");
  const [forms, setForms] = useState<Record<LegalSlug, FormState>>(INITIAL_FORMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(
        LEGAL_SLUGS.map(async (slug) => {
          const res = await fetch(`${API_URL}/api/legal-pages/${slug}`, {
            headers: getAuthHeaders(),
            credentials: "include",
          });
          const data = res.ok ? await res.json() : null;
          const content = String(data?.content || "");
          const form: FormState = content.trim()
            ? {
                title: String(data.title || "") || LEGAL_DEFAULTS[slug].title,
                subtitle: String(data.subtitle || ""),
                content,
                savedAt: data.updatedAt || null,
              }
            : { ...LEGAL_DEFAULTS[slug], savedAt: null };
          return [slug, form] as const;
        })
      );
      setForms(Object.fromEntries(entries) as Record<LegalSlug, FormState>);
    } catch {
      setMessage({ type: "error", text: "تعذر تحميل الصفحات" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const form = forms[active];

  function updateField(key: keyof LegalDocument, value: string) {
    setForms((prev) => ({ ...prev, [active]: { ...prev[active], [key]: value } }));
  }

  function restoreDefault() {
    if (!window.confirm("استبدال النص الحالي في المحرر بالنص الافتراضي؟ لن يُحفظ حتى تضغط حفظ.")) {
      return;
    }
    setForms((prev) => ({
      ...prev,
      [active]: { ...LEGAL_DEFAULTS[active], savedAt: prev[active].savedAt },
    }));
  }

  async function handleSave() {
    setMessage(null);
    if (!form.content.trim()) {
      setMessage({ type: "error", text: "النص لا يمكن أن يكون فارغاً" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/legal-pages/${active}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          content: form.content,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForms((prev) => ({
          ...prev,
          [active]: {
            title: String(data.title || ""),
            subtitle: String(data.subtitle || ""),
            content: String(data.content || ""),
            savedAt: data.updatedAt || null,
          },
        }));
        setMessage({ type: "success", text: `تم حفظ «${TAB_LABELS[active]}» — التغييرات ظاهرة الآن في الموقع` });
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحفظ" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="سياسة الخصوصية والشروط"
        description="كتابة وتعديل صفحتي سياسة الخصوصية والشروط والأحكام كما تظهر في الموقع."
        icon={<FileText className="h-6 w-6" />}
      />

      {message ? (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          {message.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {LEGAL_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => {
              setActive(slug);
              setMessage(null);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              active === slug
                ? "bg-indigo-600 text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {TAB_LABELS[slug]}
          </button>
        ))}
      </div>

      <AdminCard title={TAB_LABELS[active]}>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">جاري التحميل...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              {form.savedAt
                ? `آخر حفظ: ${new Date(form.savedAt).toLocaleString("ar-DZ")}`
                : "لم يُحفظ بعد — الموقع يعرض حالياً النص الافتراضي الظاهر أدناه."}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">العنوان</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  العنوان الفرعي (اختياري)
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-6 text-sky-900">
              <p className="font-bold">طريقة الكتابة — كل سطر عنصر مستقل:</p>
              <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
                <li>
                  <code dir="ltr">## </code> عنوان قسم رئيسي (مثال: ## 1. المعلومات المجمعة)
                </li>
                <li>
                  <code dir="ltr">### </code> عنوان قسم فرعي
                </li>
                <li>
                  <code dir="ltr">- </code> عنصر في قائمة نقطية
                </li>
                <li>
                  <code dir="ltr">! </code> ملاحظة مهمة في إطار أصفر
                </li>
                <li>
                  <code dir="ltr">**نص**</code> فقرة بخط عريض
                </li>
                <li>أي سطر آخر = فقرة عادية</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                icon={preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onClick={() => setPreview((v) => !v)}
              >
                {preview ? "العودة للتحرير" : "معاينة"}
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={restoreDefault}
              >
                استعادة النص الافتراضي
              </AdminButton>
              <a
                href={PUBLIC_PATHS[active]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4" />
                عرض الصفحة في الموقع
              </a>
            </div>

            {preview ? (
              <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6">
                <h1 className="text-2xl font-extrabold text-slate-900">{form.title}</h1>
                {form.subtitle ? (
                  <p className="mt-2 text-sm text-slate-600">{form.subtitle}</p>
                ) : null}
                <div className="mt-6 space-y-6 text-sm leading-8 text-slate-700">
                  <LegalContent content={form.content} />
                </div>
              </div>
            ) : (
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                rows={28}
                dir="rtl"
                className={`${inputClass} font-mono leading-7`}
              />
            )}

            <AdminButton type="button" onClick={handleSave} disabled={saving} loading={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </AdminButton>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
