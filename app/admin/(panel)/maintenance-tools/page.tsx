"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Hammer,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
} from "@/components/admin";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { uploadProductImages } from "@/lib/adminProductMedia";
import { getProductImageUrl } from "@/lib/productImage";

type MaintenanceTool = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  extraImages?: string[];
  active?: boolean;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  createdAt?: string;
};

function allImagesOf(tool: Pick<MaintenanceTool, "image" | "extraImages">): string[] {
  const primary = String(tool.image || "").trim();
  const extras = Array.isArray(tool.extraImages)
    ? tool.extraImages.map((u) => String(u || "").trim()).filter(Boolean)
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [primary, ...extras]) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

export default function AdminMaintenanceToolsPage() {
  const [tools, setTools] = useState<MaintenanceTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTool | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryImage, setPrimaryImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const qs = searchInput.trim()
        ? `?q=${encodeURIComponent(searchInput.trim())}`
        : "";
      const res = await fetch(`${API_URL}/api/maintenance-tools/admin${qs}`, {
        headers: getAuthHeaders(),
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setTools([]);
        return;
      }
      const data = await res.json();
      setTools(Array.isArray(data) ? data : []);
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchTools();
    }, 250);
    return () => clearTimeout(t);
  }, [fetchTools]);

  function resetForm() {
    setEditing(null);
    setName("");
    setDescription("");
    setPrimaryImage("");
    setImages([]);
    setActive(true);
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(tool: MaintenanceTool) {
    setEditing(tool);
    setName(tool.name || "");
    setDescription(tool.description || "");
    const gallery = allImagesOf(tool);
    setImages(gallery);
    setPrimaryImage(String(tool.image || gallery[0] || "").trim());
    setActive(tool.active !== false);
    setPriceRetail(
      tool.priceRetail != null
        ? String(tool.priceRetail)
        : tool.price != null
          ? String(tool.price)
          : ""
    );
    setPriceWholesale(tool.priceWholesale != null ? String(tool.priceWholesale) : "");
    setPriceReparateur(tool.priceReparateur != null ? String(tool.priceReparateur) : "");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || uploading) return;
    setModalOpen(false);
    resetForm();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMessage(null);
    setUploading(true);
    try {
      const urls = await uploadProductImages(files);
      if (urls.length === 0) {
        setMessage({ type: "error", text: "لم يُرجَع رابط بعد الرفع" });
        return;
      }
      setImages((prev) => {
        const seen = new Set(prev);
        const next = [...prev];
        for (const u of urls) {
          if (!seen.has(u)) {
            seen.add(u);
            next.push(u);
          }
        }
        return next;
      });
      setPrimaryImage((prev) => prev || urls[0]);
      setMessage({ type: "success", text: `تم رفع ${urls.length} صورة` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "فشل رفع الصور",
      });
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    setPrimaryImage((prev) => {
      if (prev !== url) return prev;
      const rest = images.filter((u) => u !== url);
      return rest[0] || "";
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم الأداة مطلوب" });
      return;
    }
    if (!priceRetail.trim() || Number(priceRetail) < 0 || Number.isNaN(Number(priceRetail))) {
      setMessage({ type: "error", text: "سعر التجزئة مطلوب" });
      return;
    }

    const image = (primaryImage || images[0] || "").trim();
    const extraImages = images.filter((u) => u && u !== image);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      image,
      extraImages,
      active,
      price: Number(priceRetail),
      priceRetail: Number(priceRetail),
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : 0,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : 0,
    };

    setSaving(true);
    try {
      const url = editing
        ? `${API_URL}/api/maintenance-tools/${editing._id}`
        : `${API_URL}/api/maintenance-tools`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل الحفظ" });
        return;
      }
      setMessage({
        type: "success",
        text: editing ? "تم تحديث أداة الصيانة" : "تم إنشاء أداة الصيانة",
      });
      setModalOpen(false);
      resetForm();
      await fetchTools();
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف أداة الصيانة نهائياً؟")) return;
    try {
      const res = await fetch(`${API_URL}/api/maintenance-tools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
        return;
      }
      setMessage({ type: "success", text: "تم حذف الأداة" });
      if (editing?._id === id) {
        setModalOpen(false);
        resetForm();
      }
      await fetchTools();
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function toggleActive(tool: MaintenanceTool) {
    const next = tool.active === false;
    try {
      const res = await fetch(`${API_URL}/api/maintenance-tools/${tool._id}/active`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ active: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل تحديث الحالة" });
        return;
      }
      setTools((prev) =>
        prev.map((t) => (t._id === tool._id ? { ...t, active: data.active !== false } : t))
      );
      setMessage({
        type: "success",
        text: next ? "تم تفعيل الأداة" : "تم تعطيل الأداة",
      });
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  const filteredCount = tools.length;
  const tokenPresent = useMemo(() => Boolean(getToken()), []);

  const tableRows = tools.map((tool) => ({
    _id: tool._id,
    image: <AdminTableCellImage src={tool.image || null} alt={tool.name} />,
    name: (
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">{tool.name}</p>
        {tool.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{tool.description}</p>
        ) : null}
      </div>
    ),
    images: (
      <span className="text-xs font-medium text-slate-600">
        {allImagesOf(tool).length} صورة
      </span>
    ),
    price: (
      <span className="text-xs font-semibold text-slate-700">
        {Number(tool.priceRetail ?? tool.price ?? 0).toLocaleString("fr-DZ")} دج
      </span>
    ),
    status: (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
          tool.active === false
            ? "bg-slate-100 text-slate-500"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {tool.active === false ? "معطّلة" : "نشطة"}
      </span>
    ),
    actions: (
      <div className="flex items-center gap-1">
        <AdminButton
          variant="ghost"
          size="sm"
          icon={tool.active === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          onClick={() => void toggleActive(tool)}
          title={tool.active === false ? "تفعيل" : "تعطيل"}
        />
        <AdminButton
          variant="ghost"
          size="sm"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => openEdit(tool)}
          title="تعديل"
        />
        <AdminButton
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => void handleDelete(tool._id)}
          className="hover:bg-rose-50 hover:text-rose-600"
          title="حذف"
        />
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="أدوات الصيانة"
        description="إدارة كتالوج أدوات الصيانة: إنشاء، تعديل، صور متعددة، وتفعيل/تعطيل."
        icon={<Hammer className="h-6 w-6" />}
        actions={
          <AdminButton
            icon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
            disabled={!tokenPresent}
          >
            إضافة أداة
          </AdminButton>
        }
      />

      {message &&
        (message.type === "success" ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {message.text}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {message.text}
          </div>
        ))}

      <AdminCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث باسم الأداة أو الوصف…"
            className="admin-input max-w-md"
          />
          <p className="text-xs text-slate-500">{filteredCount} أداة</p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">جاري التحميل…</p>
        ) : tools.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
            لا توجد أدوات صيانة بعد. اضغط «إضافة أداة» للبدء.
          </p>
        ) : (
          <AdminTable
            columns={[
              { key: "image", label: "الصورة" },
              { key: "name", label: "الاسم" },
              { key: "images", label: "الصور" },
              { key: "price", label: "التجزئة" },
              { key: "status", label: "الحالة" },
              { key: "actions", label: "إجراءات" },
            ]}
            rows={tableRows}
            keyExtractor={(r) => String(r._id)}
            emptyMessage="لا توجد أدوات صيانة بعد."
            imageColumn="image"
          />
        )}
      </AdminCard>

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "تعديل أداة صيانة" : "إضافة أداة صيانة"}
        description="أدخل الاسم والأسعار (تجزئة / جملة / تاجر)، ثم ارفع الصور."
        icon={<Hammer className="h-5 w-5" />}
        size="xl"
        disableClose={saving || uploading}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">اسم الأداة *</label>
            <input
              className="admin-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="مثال: مفك براغي دقيق"
            />
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:p-4">
            <p className="mb-2 text-sm font-bold text-indigo-900">الأسعار (دج) *</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  سعر التجزئة *
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="admin-input bg-white"
                  value={priceRetail}
                  onChange={(e) => setPriceRetail(e.target.value)}
                  placeholder="مثال: 2500"
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  سعر الجملة
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="admin-input bg-white"
                  value={priceWholesale}
                  onChange={(e) => setPriceWholesale(e.target.value)}
                  placeholder="مثال: 2000"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  سعر التاجر / صاحب محل
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="admin-input bg-white"
                  value={priceReparateur}
                  onChange={(e) => setPriceReparateur(e.target.value)}
                  placeholder="مثال: 2200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الوصف</label>
            <textarea
              className="admin-input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف اختياري للأداة…"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <input
              id="mt-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <label htmlFor="mt-active" className="text-sm font-medium text-slate-700">
              الأداة نشطة (تظهر في الموقع)
            </label>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-600">صور الأداة</label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "جاري الرفع…" : "رفع صور"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading || saving}
                  className="hidden"
                  onChange={(e) => {
                    const input = e.currentTarget;
                    void handleUpload(input.files).finally(() => {
                      input.value = "";
                    });
                  }}
                />
              </label>
            </div>

            {images.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                لم تُرفع صور بعد. يمكنك رفع عدة صور دفعة واحدة.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((url) => {
                  const isPrimary = primaryImage === url;
                  return (
                    <li
                      key={url}
                      className={`relative overflow-hidden rounded-xl border bg-white ${
                        isPrimary ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProductImageUrl(url)}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(url)}
                          className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-bold text-white ${
                            isPrimary ? "bg-amber-500" : "bg-white/20 hover:bg-white/30"
                          }`}
                          title="تعيين كصورة رئيسية"
                        >
                          <Star className="h-3 w-3" />
                          {isPrimary ? "رئيسية" : "تعيين"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="rounded-md bg-rose-500/90 p-1 text-white hover:bg-rose-600"
                          title="حذف الصورة"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              عند التعديل تبقى الصور الحالية كما هي إلا إذا حذفتها أو رفعت صوراً جديدة.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <AdminButton type="button" variant="ghost" onClick={closeModal} disabled={saving}>
              إلغاء
            </AdminButton>
            <AdminButton type="submit" disabled={saving || uploading}>
              {saving ? "جاري الحفظ…" : editing ? "حفظ التعديلات" : "إنشاء الأداة"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
