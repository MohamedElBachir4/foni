"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { getProductImageUrl } from "@/lib/productImage";
import {
  Megaphone,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin";

type PopupAdForm = {
  image: string;
  enabled: boolean;
};

const EMPTY_FORM: PopupAdForm = {
  image: "",
  enabled: false,
};

export default function PopupAdvertisementsPage() {
  const [form, setForm] = useState<PopupAdForm>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/popup-advertisements`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const image = data.image || "";
        setForm({
          image,
          enabled: Boolean(data.enabled),
        });
        setPreviewUrl(image ? getProductImageUrl(image) : "");
      }
    } catch {
      setMessage({ type: "error", text: "تعذر تحميل الإعدادات" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function uploadPopupImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/api/uploads/banner-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "فشل رفع الصورة");
    }
    const url = data.url ? String(data.url) : "";
    if (!url) throw new Error("لم يُرجَع رابط للصورة بعد الرفع");
    return url;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setMessage({ type: "error", text: "يرجى اختيار ملف صورة صالح" });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadingImage(true);
    setMessage(null);
    uploadPopupImage(file)
      .then((url) => {
        setForm((prev) => ({ ...prev, image: url }));
        setPreviewUrl(getProductImageUrl(url));
        setMessage({ type: "success", text: "تم رفع الصورة — اضغط «حفظ الإعدادات» لتطبيقها" });
      })
      .catch((err) => {
        setPreviewUrl(form.image ? getProductImageUrl(form.image) : "");
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "فشل رفع الصورة",
        });
      })
      .finally(() => {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  async function handleDeleteImage() {
    if (!form.image) return;
    if (!window.confirm("هل تريد حذف صورة الإعلان؟")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/popup-advertisements`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ deleteImage: true, enabled: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm({ image: "", enabled: false });
        setPreviewUrl("");
        setMessage({ type: "success", text: "تم حذف صورة الإعلان" });
      } else {
        setMessage({ type: "error", text: data.error || "فشل حذف الصورة" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/popup-advertisements`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const image = data.image || "";
        setForm({
          image,
          enabled: Boolean(data.enabled),
        });
        setPreviewUrl(image ? getProductImageUrl(image) : "");
        setMessage({ type: "success", text: "تم حفظ إعدادات الإعلان المنبثق" });
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة الإعلانات المنبثقة"
        description="إدارة الإعلان الذي يظهر تلقائياً عند دخول الزوار إلى الموقع."
        icon={<Megaphone className="h-6 w-6" />}
      />

      {messageEl}

      <AdminCard title="الإعلان المنبثق">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">جاري التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-3 flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800">تفعيل الإعلان</span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {form.enabled ? "مفعّل" : "معطّل"}
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    disabled={!form.image}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
                  />
                </span>
              </label>
              {!form.image && (
                <p className="text-xs text-amber-700">ارفع صورة أولاً لتتمكن من تفعيل الإعلان.</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800">صورة الإعلان</label>
              <p className="text-xs text-slate-500">
                يُفضّل صورة أفقية بعرض 1200px تقريباً — ستظهر داخل نافذة منبثقة متجاوبة.
              </p>

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="معاينة الإعلان المنبثق"
                    className="mx-auto max-h-72 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                  <div className="text-center">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">لا توجد صورة</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex flex-wrap gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  disabled={uploadingImage || saving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? "جاري الرفع..." : form.image ? "استبدال الصورة" : "رفع صورة"}
                </AdminButton>
                {form.image && (
                  <AdminButton
                    type="button"
                    variant="danger"
                    disabled={uploadingImage || saving}
                    onClick={handleDeleteImage}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف الصورة
                  </AdminButton>
                )}
              </div>
            </div>

            <AdminButton type="submit" disabled={saving || uploadingImage}>
              {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </AdminButton>
          </form>
        )}
      </AdminCard>
    </div>
  );
}
