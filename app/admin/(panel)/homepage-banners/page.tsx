"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { getProductImageUrl } from "@/lib/productImage";
import {
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
} from "@/components/admin";

type HomepageBanner = {
  _id: string;
  image: string;
  order: number;
  active: boolean;
};

export default function HomepageBannersPage() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editing, setEditing] = useState<HomepageBanner | null>(null);
  const [image, setImage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [active, setActive] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage-banners`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      } else {
        setBanners([]);
      }
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function resetForm() {
    setEditing(null);
    setImage("");
    setPreviewUrl("");
    setActive(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadBannerImage(file: File): Promise<string> {
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
    uploadBannerImage(file)
      .then((url) => {
        setImage(url);
        setPreviewUrl(getProductImageUrl(url));
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "فشل رفع الصورة",
        });
        setPreviewUrl("");
      })
      .finally(() => {
        setUploadingImage(false);
        URL.revokeObjectURL(objectUrl);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!image.trim()) {
      setMessage({ type: "error", text: "ارفع صورة البنر أولاً" });
      return;
    }
    setSaving(true);
    try {
      const payload = { image: image.trim(), active };
      if (editing) {
        const res = await fetch(`${API_URL}/api/homepage-banners/${editing._id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم تحديث البنر" });
          resetForm();
          fetchBanners();
        } else {
          setMessage({ type: "error", text: data.error || "فشل التحديث" });
        }
      } else {
        const res = await fetch(`${API_URL}/api/homepage-banners`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم إضافة البنر" });
          resetForm();
          fetchBanners();
        } else {
          setMessage({ type: "error", text: data.error || "فشل الإضافة" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا البنر؟")) return;
    try {
      const res = await fetch(`${API_URL}/api/homepage-banners/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف البنر" });
        if (editing?._id === id) resetForm();
        fetchBanners();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function toggleActive(banner: HomepageBanner) {
    try {
      const res = await fetch(`${API_URL}/api/homepage-banners/${banner._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ active: !banner.active }),
      });
      if (res.ok) fetchBanners();
      else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "فشل تحديث الحالة" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function persistOrder(next: HomepageBanner[]) {
    setBanners(next);
    try {
      const res = await fetch(`${API_URL}/api/homepage-banners/reorder`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ orderedIds: next.map((b) => b._id) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "فشل حفظ الترتيب" });
        fetchBanners();
      }
    } catch {
      setMessage({ type: "error", text: "تعذر حفظ الترتيب" });
      fetchBanners();
    }
  }

  function moveBanner(id: string, direction: -1 | 1) {
    const idx = banners.findIndex((b) => b._id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next);
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const from = banners.findIndex((b) => b._id === dragId);
    const to = banners.findIndex((b) => b._id === overId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBanners(next);
  }

  function handleDragEnd() {
    if (dragId) persistOrder(banners);
    setDragId(null);
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
        title="سلايدر الصفحة الرئيسية"
        description="إدارة صور البنرات المعروضة في أعلى الصفحة الرئيسية — إضافة، تعديل، ترتيب، وتفعيل."
        icon={<ImageIcon className="h-6 w-6" />}
      />

      {messageEl}

      <AdminCard title={editing ? "تعديل بنر" : "إضافة بنر جديد"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              صورة البنر
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  PNG، JPG، WEBP — حتى 8 ميجابايت. تظهر معاينة قبل الحفظ.
                </p>
                {uploadingImage && (
                  <p className="mt-2 text-sm text-indigo-600">جاري رفع الصورة...</p>
                )}
              </div>
              {(previewUrl || image) && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || getProductImageUrl(image)}
                    alt="معاينة البنر"
                    className="aspect-[21/9] w-full max-w-md object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span>مفعّل — يظهر في السلايدر</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <AdminButton
              type="submit"
              disabled={saving || uploadingImage || !image.trim()}
              icon={editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            >
              {saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة البنر"}
            </AdminButton>
            {editing && (
              <AdminButton type="button" variant="ghost" onClick={resetForm}>
                إلغاء
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title={`البنرات الحالية (${banners.length})`}>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">جاري التحميل...</p>
        ) : banners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">لا توجد بنرات بعد</p>
            <p className="mt-1 text-xs text-slate-500">
              أضف أول صورة أعلاه لتظهر في الصفحة الرئيسية
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              اسحب البنر لإعادة الترتيب، أو استخدم أزرار الأعلى/الأسفل.
            </p>
            {banners.map((banner, idx) => (
              <div
                key={banner._id}
                draggable
                onDragStart={() => handleDragStart(banner._id)}
                onDragOver={(e) => handleDragOver(e, banner._id)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm transition sm:flex-row sm:items-center ${
                  dragId === banner._id ? "border-indigo-300 opacity-70" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab" />
                  <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                </div>

                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-100 sm:h-14 sm:w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageUrl(banner.image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500" dir="ltr">
                    {banner.image}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      banner.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {banner.active ? (
                      <>
                        <Eye className="h-3 w-3" /> مفعّل
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> معطّل
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={<ChevronUp className="h-4 w-4" />}
                    onClick={() => moveBanner(banner._id, -1)}
                    disabled={idx === 0}
                    title="للأعلى"
                  />
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={<ChevronDown className="h-4 w-4" />}
                    onClick={() => moveBanner(banner._id, 1)}
                    disabled={idx === banners.length - 1}
                    title="للأسفل"
                  />
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onClick={() => toggleActive(banner)}
                    title={banner.active ? "تعطيل" : "تفعيل"}
                  />
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => {
                      setEditing(banner);
                      setImage(banner.image);
                      setPreviewUrl(getProductImageUrl(banner.image));
                      setActive(banner.active);
                    }}
                    title="تعديل"
                  />
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(banner._id)}
                    className="hover:bg-rose-50 hover:text-rose-600"
                    title="حذف"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
