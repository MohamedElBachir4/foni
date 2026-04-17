"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAuthHeaders, API_URL } from "@/lib/adminAuth";
import { Smartphone, CheckCircle, AlertCircle, Pencil, Trash2, ExternalLink } from "lucide-react";

type Brand = { _id: string; name: string; slug?: string };
type Phone = {
  _id: string;
  name: string;
  brand: Brand | string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  details?: string;
  stock?: number;
  colors?: string[];
};

const COLOR_OPTIONS = [
  { id: "white", label: "أبيض", hex: "#ffffff" },
  { id: "black", label: "أسود", hex: "#1f2937" },
  { id: "gold", label: "ذهبي", hex: "#d4af37" },
  { id: "silver", label: "فضي", hex: "#c0c0c0" },
  { id: "purple", label: "بنفسجي", hex: "#7c3aed" },
];

export default function CreatePhonePage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneName, setPhoneName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");
  const [details, setDetails] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<Phone | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands`, { headers: getAuthHeaders(), credentials: 'include',  });
      if (res.ok) setBrands(await res.json());
    } catch {
      setBrands([]);
    }
  }, []);

  const fetchPhones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/phones`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPhones(Array.isArray(data) ? data : []);
      } else setPhones([]);
    } catch {
      setPhones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchPhones();
  }, [fetchBrands, fetchPhones]);

  function resetForm() {
    setPhoneName("");
    setSelectedBrand("");
    setImage("");
    setPrice("");
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
    setDetails("");
    setSelectedColors([]);
    setEditing(null);
  }

  function toggleColor(id: string) {
    setSelectedColors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!phoneName.trim()) {
      setMessage({ type: "error", text: "اسم الهاتف مطلوب" });
      return;
    }
    if (!selectedBrand) {
      setMessage({ type: "error", text: "اختر الماركة" });
      return;
    }
    if (editing) {
      try {
        const res = await fetch(`${API_URL}/api/phones/${editing._id}`, {
          method: "PUT",
          headers: getAuthHeaders(), credentials: 'include',
          body: JSON.stringify({
            name: phoneName.trim(),
            brand: selectedBrand,
            image: image.trim(),
            price: price.trim() ? Number(price) : 0,
            priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
            priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
            priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
            details: details.trim(),
            colors: selectedColors,
           }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setMessage({ type: "success", text: "تم تحديث الهاتف بنجاح" });
          resetForm();
          fetchPhones();
        } else {
          setMessage({ type: "error", text: data.error || "فشل التحديث" });
        }
      } catch {
        setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
      }
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/phones`, {
        method: "POST",
        headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({
          name: phoneName.trim(),
          brand: selectedBrand,
          image: image.trim(),
          price: price.trim() ? Number(price) : 0,
          priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
          priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
          priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
          details: details.trim(),
          colors: selectedColors,
         }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم إنشاء الهاتف بنجاح" });
        resetForm();
        fetchPhones();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الإنشاء" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  function startEdit(phone: Phone) {
    setEditing(phone);
    setPhoneName(phone.name);
    setSelectedBrand(
      typeof phone.brand === "string" ? phone.brand : phone.brand?._id || ""
    );
    setImage(phone.image || "");
    setPrice(phone.price != null ? String(phone.price) : "");
    setPriceRetail(
      phone.priceRetail != null ? String(phone.priceRetail) : ""
    );
    setPriceWholesale(
      phone.priceWholesale != null ? String(phone.priceWholesale) : ""
    );
    setPriceReparateur(
      phone.priceReparateur != null ? String(phone.priceReparateur) : ""
    );
    setDetails(phone.details || "");
    setSelectedColors(Array.isArray(phone.colors) ? [...phone.colors] : []);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_URL}/api/phones/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف الهاتف" });
        setDeleteConfirm(null);
        fetchPhones();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  const brandName = (p: Phone) => (typeof p.brand === "object" && p.brand ? p.brand.name : "—");

  const inputClass = "w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-3.5 text-slate-800 font-medium transition-all hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400";
  const labelClass = "mb-2 block text-sm font-bold text-slate-700";

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">إدارة الهواتف</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          إضافة هاتف جديد أو تعديل وحذف المنتجات الحالية بكل سهولة
        </p>
      </header>

      <section className="rounded-[2.5rem] border border-slate-100/60 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-10">
        <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-inner">
            <Smartphone className="h-7 w-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">
              {editing ? "تعديل بيانات الهاتف" : "نموذج إضافة هاتف جديد"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              يُرجى ملء جميع الحقول المطلوبة لضمان دقة معلومات المنتج
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm ${message.type === "success"
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border border-red-100 bg-red-50 text-red-700"
                }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="h-6 w-6 shrink-0 text-red-500" />
              )}
              {message.text}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className={labelClass}>اسم الهاتف الكامل</label>
              <input
                type="text"
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                className={inputClass}
                placeholder="مثال: Apple iPhone 15 Pro Max 256GB"
              />
            </div>

            <div className="lg:col-span-2">
              <label className={labelClass}>الماركة (الشركة المصنعة)</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5em] bg-[position:left_1rem_center] bg-no-repeat`}
              >
                <option value="">-- يرجى اختيار الماركة --</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>سعر التجزئة (Retail) بالدينار</label>
              <input
                type="number"
                min="0"
                value={priceRetail}
                onChange={(e) => setPriceRetail(e.target.value)}
                className={inputClass}
                placeholder="سعر الزبون العادي..."
              />
            </div>

            <div>
              <label className={labelClass}>سعر الجملة (Grossiste) بالدينار</label>
              <input
                type="number"
                min="0"
                value={priceWholesale}
                onChange={(e) => setPriceWholesale(e.target.value)}
                className={inputClass}
                placeholder="سعر الكميات الكبيرة..."
              />
            </div>

            <div>
              <label className={labelClass}>سعر المُصلّح (Réparateur) بالدينار</label>
              <input
                type="number"
                min="0"
                value={priceReparateur}
                onChange={(e) => setPriceReparateur(e.target.value)}
                className={inputClass}
                placeholder="سعر الفني أو المصلح..."
              />
            </div>

            <div>
              <label className={labelClass}>رابط صورة المنتج (URL)</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={inputClass}
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="lg:col-span-2">
              <label className={labelClass}>الألوان المتوفرة</label>
              <div className="flex flex-wrap gap-4">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColors.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      className={`group relative flex items-center gap-3 rounded-2xl border-2 px-5 py-3.5 transition-all duration-300 ${isSelected
                          ? "border-emerald-500 bg-emerald-50/60 shadow-md shadow-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full border border-slate-200 shadow-inner transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"
                          }`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className={`font-bold ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                        {c.label}
                      </span>
                      {isSelected && (
                        <CheckCircle className="absolute -top-2 -start-2 h-6 w-6 rounded-full bg-white text-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <AlertCircle className="h-4 w-4" />
                يمكنك اختيار أكثر من لون واحد والنقر مرة أخرى للإلغاء
              </p>
            </div>

            <div className="lg:col-span-2">
              <label className={labelClass}>تفاصيل ومواصفات إضافية (اختياري)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="المواصفات التقنية، الوصف العام، محتويات العلبة أو أي معلومات تهم الزبون..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-100 pt-8">
            <button
              type="submit"
              className="group relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] sm:flex-none sm:hover:scale-[1.02] sm:hover:shadow-xl sm:hover:shadow-emerald-500/30"
            >
              <span className="relative z-10 flex items-center gap-2">
                {editing ? "حفظ التعديلات المطبقة" : "تسجيل الهاتف الجديد"}
                <CheckCircle className="h-5 w-5 opacity-80" />
              </span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-teal-500 to-emerald-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] sm:flex-none"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-12 rounded-[2.5rem] border border-slate-100/60 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-10">
        <h2 className="mb-4 text-lg font-bold text-slate-800">الهواتف المُنشأة</h2>
        {loading ? (
          <p className="py-8 text-center text-slate-500">جاري التحميل...</p>
        ) : phones.length === 0 ? (
          <p className="py-8 text-center text-slate-500">لا توجد هواتف مسجّلة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="p-3 text-sm font-semibold text-slate-600">الاسم</th>
                  <th className="p-3 text-sm font-semibold text-slate-600">الماركة</th>
                  <th className="p-3 text-sm font-semibold text-slate-600">الألوان</th>
                  <th className="p-3 text-sm font-semibold text-slate-600">السعر</th>
                  <th className="p-3 text-sm font-semibold text-slate-600">التفاصيل</th>
                  <th className="p-3 text-sm font-semibold text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((p) => (
                  <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-800">{p.name}</td>
                    <td className="p-3 text-slate-600">{brandName(p)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(p.colors) ? p.colors : []).map((c) => (
                          <span
                            key={c}
                            className="inline-block h-5 w-5 rounded-full border border-slate-200"
                            style={{
                              backgroundColor: COLOR_OPTIONS.find((o) => o.id === c)?.hex ?? "#9ca3af",
                              boxShadow: c === "white" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
                            }}
                            title={COLOR_OPTIONS.find((o) => o.id === c)?.label ?? c}
                          />
                        ))}
                        {(!p.colors || p.colors.length === 0) && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{(p.price ?? 0).toLocaleString()} دج</td>
                    <td className="max-w-[200px] truncate p-3 text-sm text-slate-500" title={p.details || ""}>
                      {p.details || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/product/${p._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                          title="عرض في الموقع"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(p._id)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-red-100 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-slate-800 font-medium">هل تريد حذف هذا الهاتف؟</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
