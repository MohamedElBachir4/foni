"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { Tags, CheckCircle, AlertCircle } from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
} from "@/components/admin";

type Brand = { _id: string; name: string; slug?: string; image?: string };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/brands`, { credentials: "include" });
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم الماركة مطلوب" });
      return;
    }
    const payload = { name: name.trim(), image: image.trim() || "" };
    try {
      const res = await fetch(`${API_URL}/api/brands`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
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

  const tableRows = brands.map((b) => ({
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
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AdminPageHeader
        title="الماركات"
        description="أضف ماركات جديدة (مثل Apple وSamsung) لتُستعمل في إضافة الهواتف وقطع الغيار. الماركات المحفوظة مسبقاً للعرض فقط ولا تُعدَّل ولا تُحذف من هنا."
        icon={<Tags className="h-5 w-5" />}
      />

      <AdminCard title="إضافة ماركة جديدة" icon={<Tags className="h-5 w-5" />}>
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
              إضافة الماركة
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="جميع الماركات" icon={<Tags className="h-5 w-5" />}>
        <AdminTable
          columns={[
            { key: "name", label: "الاسم" },
            { key: "slug", label: "المعرّف (slug)" },
            { key: "image", label: "الشعار" },
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
