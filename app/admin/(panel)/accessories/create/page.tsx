"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getAuthHeaders } from "@/lib/adminAuth";
import { Package, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
  AdminPagination,
} from "@/components/admin";

const PAGE_SIZE = 12;

type AccessoryType = { _id: string; name: string };
type Accessory = {
  _id: string;
  name: string;
  type: AccessoryType | string;
  image?: string;
  extraImages?: string[];
  colors?: string[];
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  stock?: number;
  details?: string;
};

const COLOR_OPTIONS = [
  { id: "white", label: "أبيض" },
  { id: "black", label: "أسود" },
  { id: "gold", label: "ذهبي" },
  { id: "silver", label: "فضي" },
  { id: "purple", label: "بنفسجي" },
];

export default function AccessoriesPage() {
  const [types, setTypes] = useState<AccessoryType[]>([]);
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [image, setImage] = useState("");
  const [extraImagesText, setExtraImagesText] = useState("");
  const [price, setPrice] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");
  const [stock, setStock] = useState("");
  const [details, setDetails] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/accessory-types`, { credentials: "include" });
      if (res.ok) {
        setTypes(await res.json());
      } else {
        setTypes([]);
      }
    } catch {
      setTypes([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/accessories`, { credentials: "include" });
      if (res.ok) {
        setItems(await res.json());
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
    fetchItems();
  }, [fetchTypes, fetchItems]);

  function resetForm() {
    setName("");
    setSelectedType("");
    setImage("");
    setExtraImagesText("");
    setPrice("");
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
    setStock("");
    setDetails("");
    setColors([]);
    setEditing(null);
  }

  function toggleColor(id: string) {
    setColors((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function parseExtraImages(): string[] {
    return extraImagesText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم الأكسسوار مطلوب" });
      return;
    }
    if (!selectedType) {
      setMessage({ type: "error", text: "اختر نوع الأكسسوار" });
      return;
    }
    const payload = {
      name: name.trim(),
      type: selectedType,
      image: image.trim(),
      extraImages: parseExtraImages(),
      colors,
      price: price.trim() ? Number(price) : 0,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      stock: stock.trim() ? Number(stock) : 0,
      details: details.trim(),
    };
    try {
      let res: Response;
      if (editing) {
        res = await fetch(`${API_URL}/api/accessories/${editing._id}`, {
          method: "PUT",
          headers: getAuthHeaders(), credentials: 'include',
          body: JSON.stringify(payload),
         });
      } else {
        res = await fetch(`${API_URL}/api/accessories`, {
          method: "POST",
          headers: getAuthHeaders(), credentials: 'include',
          body: JSON.stringify(payload),
         });
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: "success",
          text: editing ? "تم تحديث الأكسسوار بنجاح" : "تم إنشاء الأكسسوار بنجاح",
        });
        resetForm();
        fetchItems();
      } else {
        setMessage({ type: "error", text: data.error || "فشل العملية" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  function startEdit(item: Accessory) {
    setEditing(item);
    setName(item.name);
    setSelectedType(typeof item.type === "object" ? (item.type as AccessoryType)._id : "");
    setImage(item.image || "");
    setExtraImagesText((item.extraImages || []).join("\n"));
    setPrice(item.price != null ? String(item.price) : "");
    setPriceRetail(
      item.priceRetail != null ? String(item.priceRetail) : ""
    );
    setPriceWholesale(
      item.priceWholesale != null ? String(item.priceWholesale) : ""
    );
    setPriceReparateur(
      item.priceReparateur != null ? String(item.priceReparateur) : ""
    );
    setStock(item.stock != null ? String(item.stock) : "");
    setDetails(item.details || "");
    setColors(Array.isArray(item.colors) ? [...item.colors] : []);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا الأكسسوار؟")) return;
    try {
      const res = await fetch(`${API_URL}/api/accessories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف الأكسسوار" });
        fetchItems();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  const typeName = (a: Accessory) =>
    typeof a.type === "object" && a.type ? (a.type as AccessoryType).name : "—";

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader
        title="منتجات الأكسسوارات"
        description="إضافة وتعديل وحذف منتجات الأكسسوارات وربطها بأنواع الأكسسوارات."
        icon={<Package className="h-5 w-5" />}
      />

      <AdminCard
        title={editing ? "تعديل منتج أكسسوارات" : "إضافة منتج أكسسوارات جديد"}
        icon={<Package className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {message.text}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم الأكسسوار</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="admin-input"
                placeholder="مثال: شاحن سريع 25W"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">نوع الأكسسوار</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="admin-select"
              >
                <option value="">اختر النوع</option>
                {types.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الصورة الرئيسية</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                صور إضافية (رابط في كل سطر)
              </label>
              <textarea
                value={extraImagesText}
                onChange={(e) => setExtraImagesText(e.target.value)}
                rows={3}
                className="admin-input"
                placeholder="https://...\nhttps://..."
              />
            </div>
          </div>

          {/* الألوان */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">الألوان المتوفرة</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-sky-300"
                >
                  <input
                    type="checkbox"
                    checked={colors.includes(c.id)}
                    onChange={() => toggleColor(c.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{
                      backgroundColor:
                        c.id === "white"
                          ? "#ffffff"
                          : c.id === "black"
                          ? "#1f2937"
                          : c.id === "gold"
                          ? "#d4af37"
                          : c.id === "silver"
                          ? "#c0c0c0"
                          : "#7c3aed",
                    }}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                سعر التجزئة (Retail) دج
              </label>
              <input
                type="number"
                min="0"
                value={priceRetail}
                onChange={(e) => setPriceRetail(e.target.value)}
                className="admin-input"
                placeholder="سعر الزبون العادي"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                سعر تاجر الجملة (Grossiste) دج
              </label>
              <input
                type="number"
                min="0"
                value={priceWholesale}
                onChange={(e) => setPriceWholesale(e.target.value)}
                className="admin-input"
                placeholder="سعر الكميات الكبيرة"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                سعر Réparateur دج
              </label>
              <input
                type="number"
                min="0"
                value={priceReparateur}
                onChange={(e) => setPriceReparateur(e.target.value)}
                className="admin-input"
                placeholder="سعر الفني / مركز الصيانة"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الكمية في المخزون</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="admin-input"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              الوصف / التفاصيل (اختياري)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="admin-input"
              placeholder="وصف المنتج، المميزات، الضمان..."
            />
          </div>

          <div className="flex gap-3">
            {editing && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                إلغاء
              </AdminButton>
            )}
            <AdminButton type="submit" variant="primary">
              {editing ? "حفظ التعديلات" : "إضافة المنتج"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="منتجات الأكسسوارات المُضافة"
        description={`المجموع: ${items.length}`}
        icon={<Package className="h-5 w-5" />}
      >
        <AdminTable
          columns={[
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "type", label: "النوع" },
            { key: "price", label: "السعر" },
            { key: "stock", label: "الكمية" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={paginatedItems.map((a) => ({
            _id: a._id,
            image: <AdminTableCellImage src={a.image} alt={a.name} />,
            name: <span className="font-medium text-slate-800">{a.name}</span>,
            type: <span className="text-slate-600">{typeName(a)}</span>,
            price: (
              <span className="text-slate-700">
                {(a.price ?? 0).toLocaleString()} دج
              </span>
            ),
            stock: <span className="text-slate-600">{a.stock ?? 0}</span>,
            actions: (
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => startEdit(a)}
                  title="تعديل"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(a._id)}
                  className="hover:bg-rose-50 hover:text-rose-600"
                  title="حذف"
                />
              </div>
            ),
          }))}
          keyExtractor={(r) => r._id as string}
          emptyMessage="لا توجد منتجات مسجلة بعد."
          loading={loading}
        />
        {items.length > PAGE_SIZE && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <AdminPagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={items.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </AdminCard>
    </div>
  );
}

