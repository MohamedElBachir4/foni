"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { Layers, CheckCircle, AlertCircle, Trash2, Pencil } from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
} from "@/components/admin";

type AccessoryType = { _id: string; name: string; image?: string };

export default function AccessoryTypesPage() {
  const [types, setTypes] = useState<AccessoryType[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState<AccessoryType | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/accessory-types`, { credentials: "include" });
      if (res.ok) setTypes(await res.json());
      else setTypes([]);
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  function resetForm() {
    setName("");
    setImage("");
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم النوع مطلوب" });
      return;
    }
    const payload = { name: name.trim(), image: image.trim() };
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/api/accessory-types/${editing._id}`, {
          method: "PUT",
          headers: getAuthHeaders(), credentials: 'include',
          body: JSON.stringify(payload),
         });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم تحديث نوع الأكسسوارات" });
          resetForm();
          fetchTypes();
        } else {
          setMessage({ type: "error", text: data.error || "فشل التحديث" });
        }
      } else {
        const res = await fetch(`${API_URL}/api/accessory-types`, {
          method: "POST",
          headers: getAuthHeaders(), credentials: 'include',
          body: JSON.stringify(payload),
         });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم إنشاء نوع الأكسسوارات" });
          resetForm();
          fetchTypes();
        } else {
          setMessage({ type: "error", text: data.error || "فشل الإنشاء" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا النوع؟")) return;
    try {
      const res = await fetch(`${API_URL}/api/accessory-types/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف نوع الأكسسوارات" });
        if (editing?._id === id) resetForm();
        fetchTypes();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
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

  const tableRows = types.map((t) => ({
    _id: t._id,
    name: <span className="font-medium text-slate-800">{t.name}</span>,
    image: t.image ? (
      <a href={t.image} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
        رابط
      </a>
    ) : (
      <AdminTableCellImage src={null} />
    ),
    actions: (
      <div className="flex items-center gap-2">
        <AdminButton
          variant="ghost"
          size="sm"
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => {
            setEditing(t);
            setName(t.name);
            setImage(t.image || "");
          }}
          title="تعديل"
        />
        <AdminButton
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => handleDelete(t._id)}
          className="hover:bg-rose-50 hover:text-rose-600"
          title="حذف"
        />
      </div>
    ),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AdminPageHeader
        title="أنواع الأكسسوارات"
        description="أنشئ أنواع الأكسسوارات (ساعات، سماعات، شواحن...) لاستخدامها مع منتجات الأكسسوارات."
        icon={<Layers className="h-5 w-5" />}
      />

      <AdminCard
        title={editing ? "تعديل نوع أكسسوارات" : "إضافة نوع أكسسوارات جديد"}
        icon={<Layers className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {messageEl}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم النوع</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="admin-input"
                placeholder="مثال: ساعات، سماعات..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رابط الصورة (اختياري)
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <AdminButton type="submit" variant="success">
              {editing ? "حفظ التغييرات" : "إضافة النوع"}
            </AdminButton>
            {editing && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                إلغاء التعديل
              </AdminButton>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="جميع أنواع الأكسسوارات" icon={<Layers className="h-5 w-5" />}>
        <AdminTable
          columns={[
            { key: "name", label: "النوع" },
            { key: "image", label: "الصورة" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={tableRows}
          keyExtractor={(r) => (r._id as string)}
          emptyMessage="لا توجد أنواع مسجلة بعد."
          loading={loading}
        />
      </AdminCard>
    </div>
  );
}
