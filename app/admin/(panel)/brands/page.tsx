"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { Tags, CheckCircle, AlertCircle, Trash2, Pencil } from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
} from "@/components/admin";

const BRANDS_PANEL_HEADER = { "X-Foni-Brands-Panel": "1" } as const;

type Brand = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  allowEditDelete?: boolean;
};

function brandIdString(b: Brand): string {
  const raw = b?._id as unknown;
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "toString" in raw) {
    return String((raw as { toString: () => string }).toString());
  }
  return String(raw);
}

function isMongoObjectIdString(s: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(String(s).trim());
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/brands`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      } else setBrands([]);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  function resetForm() {
    setName("");
    setImage("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم الماركة مطلوب" });
      return;
    }
    const payload = {
      name: name.trim(),
      image: image.trim() || "",
      allowEditDelete: true,
    };
    try {
      if (editingId && isMongoObjectIdString(editingId)) {
        const res = await fetch(
          `${API_URL}/api/brands/${encodeURIComponent(editingId.trim())}/update`,
          {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json", ...BRANDS_PANEL_HEADER },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم تحديث الماركة" });
          resetForm();
          fetchBrands();
        } else {
          setMessage({ type: "error", text: (data as { error?: string }).error || "فشل التحديث" });
        }
      } else if (editingId) {
        setMessage({ type: "error", text: "معرّف الماركة غير صالح — اضغط «تعديل» مرة أخرى ثم احفظ." });
      } else {
        const res = await fetch(`${API_URL}/api/brands`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json", ...BRANDS_PANEL_HEADER },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم إنشاء الماركة وستظهر في الموقع" });
          resetForm();
          fetchBrands();
        } else {
          setMessage({ type: "error", text: (data as { error?: string }).error || "فشل الإنشاء" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الماركة؟ (يُشترط عدم ارتباطها بهواتف أو موديلات أو منتجات.)")) return;
    const idPart = String(id).trim();
    if (!idPart) return;
    try {
      const res = await fetch(
        `${API_URL}/api/brands/${encodeURIComponent(idPart)}/delete`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), ...BRANDS_PANEL_HEADER },
          credentials: "include",
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف الماركة" });
        if (editingId === id) resetForm();
        fetchBrands();
      } else {
        setMessage({ type: "error", text: (data as { error?: string }).error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
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

  const tableRows = brands.map((b) => {
    const canEdit = b.allowEditDelete === true;
    return {
      _id: b._id,
      name: <span className="font-medium text-slate-800">{b.name}</span>,
      slug: (
        <code className="text-xs text-slate-500" dir="ltr">
          {b.slug || "—"}
        </code>
      ),
      image: b.image ? (
        <a href={b.image} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
          رابط
        </a>
      ) : (
        <AdminTableCellImage src={null} />
      ),
      actions: canEdit ? (
        <div className="flex items-center gap-2">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => {
              setEditingId(brandIdString(b));
              setName(b.name);
              setImage(b.image || "");
            }}
            title="تعديل"
          />
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => handleDelete(brandIdString(b))}
            className="hover:bg-rose-50 hover:text-rose-600"
            title="حذف"
          />
        </div>
      ) : (
        <span className="text-xs text-slate-400" title="ماركة قديمة من قاعدة البيانات">
          —
        </span>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AdminPageHeader
        title="الماركات"
        description="أضف ماركات جديدة. التعديل والحذف متاحان فقط للماركات المضافة من صفحة «إضافة ماركة» (لا تشمل المسجّلة مسبقاً عندك)."
        icon={<Tags className="h-5 w-5" />}
      />

      <AdminCard
        title={editingId ? "تعديل ماركة" : "إضافة ماركة جديدة"}
        icon={<Tags className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {messageEl}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم الماركة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="admin-input"
                placeholder="مثال: Apple, Samsung, Xiaomi..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رابط شعار (اختياري)
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
                dir="ltr"
                placeholder="https:// أو //cdn... أو data:... — أي رابط صورة"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <AdminButton type="submit" variant="success">
              {editingId ? "حفظ التغييرات" : "إضافة الماركة"}
            </AdminButton>
            {editingId && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                إلغاء التعديل
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="جميع الماركات" icon={<Tags className="h-5 w-5" />}>
        <AdminTable
          columns={[
            { key: "name", label: "الاسم" },
            { key: "slug", label: "المعرّف (slug)" },
            { key: "image", label: "الشعار" },
            { key: "actions", label: "إجراءات", className: "w-28" },
          ]}
          rows={tableRows}
          keyExtractor={(r) => String(r._id)}
          emptyMessage="لا توجد ماركات بعد. أضف أول ماركة في النموذج أعلاه."
          loading={loading}
        />
      </AdminCard>
    </div>
  );
}
