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
type Brand = { _id: string; name: string; slug?: string };
type PhoneTypeRow = { _id: string; name: string };
type Accessory = {
  _id: string;
  name: string;
  type: AccessoryType | string;
  brand?: Brand | string;
  phoneType?: PhoneTypeRow | string;
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phoneTypes, setPhoneTypes] = useState<PhoneTypeRow[]>([]);
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPhoneType, setSelectedPhoneType] = useState("");
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
  const [uploadingImages, setUploadingImages] = useState(false);

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

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands`, { credentials: "include" });
      if (res.ok) {
        setBrands(await res.json());
      } else {
        setBrands([]);
      }
    } catch {
      setBrands([]);
    }
  }, []);

  /** يجلب موديلات الماركة ويُرجعها — للاستخدام في onChange وفي التعديل */
  const loadPhoneTypes = useCallback(async (brandId: string): Promise<PhoneTypeRow[]> => {
    if (!brandId) return [];
    try {
      const res = await fetch(
        `${API_URL}/api/phone-types?brand=${encodeURIComponent(brandId)}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/accessories`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setItems(await res.json());
      } else {
        setItems([]);
        if (res.status === 401) {
          setMessage({ type: "error", text: "انتهت الجلسة — سجّل دخول الأدمن من جديد" });
        }
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
    fetchBrands();
    fetchItems();
  }, [fetchTypes, fetchBrands, fetchItems]);

  function resetForm() {
    setName("");
    setSelectedType("");
    setSelectedBrand("");
    setSelectedPhoneType("");
    setPhoneTypes([]);
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
      .filter(Boolean)
      .slice(0, 4);
  }

  async function uploadImages(files: FileList | null): Promise<string[]> {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    Array.from(files)
      .slice(0, 5)
      .forEach((file) => formData.append("images", file));
    const token =
      typeof window !== "undefined" ? localStorage.getItem("foni_admin_token") : null;
    const res = await fetch(`${API_URL}/api/uploads/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل رفع الصور");
    return Array.isArray(data.urls) ? data.urls : [];
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
    if (!selectedBrand || !selectedPhoneType) {
      setMessage({ type: "error", text: "اختر الماركة وموديل الهاتف" });
      return;
    }
    const payload = {
      name: name.trim(),
      type: selectedType,
      brand: String(selectedBrand).trim(),
      phoneType: String(selectedPhoneType).trim(),
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

  async function startEdit(item: Accessory) {
    setEditing(item);
    setName(item.name);
    setSelectedType(typeof item.type === "object" ? (item.type as AccessoryType)._id : "");
    const bid = String(
      typeof item.brand === "object" && item.brand && "_id" in item.brand
        ? (item.brand as Brand)._id
        : typeof item.brand === "string"
          ? item.brand
          : ""
    );
    const pid = String(
      typeof item.phoneType === "object" && item.phoneType && "_id" in item.phoneType
        ? (item.phoneType as PhoneTypeRow)._id
        : typeof item.phoneType === "string"
          ? item.phoneType
          : ""
    );
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

    if (bid) {
      let list = await loadPhoneTypes(bid);
      if (pid && !list.some((p) => p._id === pid)) {
        const nameHint =
          typeof item.phoneType === "object" && item.phoneType && "name" in item.phoneType
            ? (item.phoneType as PhoneTypeRow).name
            : pid;
        list = [{ _id: pid, name: `${nameHint} (محفوظ)` }, ...list];
      }
      setPhoneTypes(list);
      setSelectedBrand(bid);
      setSelectedPhoneType(pid && list.some((p) => p._id === pid) ? pid : "");
    } else {
      setPhoneTypes([]);
      setSelectedBrand("");
      setSelectedPhoneType("");
    }
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

  const brandName = (a: Accessory) => {
    if (typeof a.brand === "object" && a.brand) return (a.brand as Brand).name;
    return a.brand ? String(a.brand) : "—";
  };

  const modelName = (a: Accessory) => {
    if (typeof a.phoneType === "object" && a.phoneType) {
      return (a.phoneType as PhoneTypeRow).name;
    }
    return a.phoneType ? String(a.phoneType) : "—";
  };

  const accessoryMissingBrandOrModel = (a: Accessory) => {
    const hasBrand =
      (typeof a.brand === "object" && a.brand && "_id" in a.brand) ||
      (typeof a.brand === "string" && /^[a-f0-9]{24}$/i.test(a.brand));
    const hasModel =
      (typeof a.phoneType === "object" && a.phoneType && "_id" in a.phoneType) ||
      (typeof a.phoneType === "string" && /^[a-f0-9]{24}$/i.test(a.phoneType));
    return !hasBrand || !hasModel;
  };

  const hasIncompleteRows = items.some(accessoryMissingBrandOrModel);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader
        title="منتجات الأكسسوارات"
        description="إضافة الأكسسوارات وربط كل منتج بماركة نوع هاتف وموديل (PhoneType) لعرضه في التصفح والماركات."
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الماركة (الهاتف)</label>
              <select
                value={selectedBrand}
                onChange={async (e) => {
                  const v = e.target.value;
                  setSelectedPhoneType("");
                  setSelectedBrand(v);
                  setPhoneTypes(v ? await loadPhoneTypes(v) : []);
                }}
                className="admin-select"
              >
                <option value="">اختر الماركة</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">موديل الهاتف</label>
              <select
                value={selectedPhoneType}
                onChange={(e) => setSelectedPhoneType(e.target.value)}
                className="admin-select"
                disabled={!selectedBrand}
              >
                <option value="">
                  {selectedBrand ? "اختر الموديل" : "اختر الماركة أولاً"}
                </option>
                {phoneTypes.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الصورة الرئيسية</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
                dir="ltr"
                placeholder="أي رابط صورة (https، //، ipfs:، data:...)"
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
                placeholder="رابط لكل سطر — أي تنسيق صورة"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رفع الصورة الرئيسية من الجهاز
              </label>
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={async (e) => {
                  setMessage(null);
                  try {
                    setUploadingImages(true);
                    const urls = await uploadImages(e.target.files);
                    if (urls[0]) {
                      setImage(urls[0]);
                      setMessage({ type: "success", text: "تم رفع الصورة الرئيسية" });
                    }
                  } catch (err) {
                    setMessage({
                      type: "error",
                      text: err instanceof Error ? err.message : "فشل رفع الصورة",
                    });
                  } finally {
                    setUploadingImages(false);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رفع صور إضافية من الجهاز (حتى 4)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="admin-input"
                onChange={async (e) => {
                  setMessage(null);
                  try {
                    setUploadingImages(true);
                    const uploaded = await uploadImages(e.target.files);
                    if (uploaded.length > 0) {
                      const merged = [...parseExtraImages(), ...uploaded].slice(0, 4);
                      setExtraImagesText(merged.join("\n"));
                      setMessage({ type: "success", text: `تم رفع ${uploaded.length} صورة إضافية` });
                    }
                  } catch (err) {
                    setMessage({
                      type: "error",
                      text: err instanceof Error ? err.message : "فشل رفع الصور",
                    });
                  } finally {
                    setUploadingImages(false);
                    e.currentTarget.value = "";
                  }
                }}
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
            <AdminButton type="submit" variant="primary" disabled={uploadingImages}>
              {uploadingImages
                ? "جاري رفع الصور..."
                : editing
                ? "حفظ التعديلات"
                : "إضافة المنتج"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="منتجات الأكسسوارات المُضافة"
        description={`المجموع: ${items.length}`}
        icon={<Package className="h-5 w-5" />}
      >
        {hasIncompleteRows && (
          <div
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">تنبيه: ماركة أو موديل غير مكتمل</p>
            <p className="mt-1 text-amber-900/90">
              الصفوف التي تظهر «—» في الماركة أو الموديل (قد تكون أُنشئت قديماً) لا تظهر في الموقع تحت
              موديل محدد. اضغط «تعديل» واختر <strong>الماركة</strong> ثم <strong>موديل الهاتف</strong>{" "}
              ثم احفظ — بعدها يظهر المنتج فقط في صفحة: الماركة → الموديل → اكسسوارات.
            </p>
          </div>
        )}
        <AdminTable
          columns={[
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "type", label: "النوع" },
            { key: "brand", label: "الماركة" },
            { key: "model", label: "الموديل" },
            { key: "price", label: "السعر" },
            { key: "stock", label: "الكمية" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={paginatedItems.map((a) => ({
            _id: a._id,
            image: <AdminTableCellImage src={a.image} alt={a.name} />,
            name: <span className="font-medium text-slate-800">{a.name}</span>,
            type: <span className="text-slate-600">{typeName(a)}</span>,
            brand: <span className="text-slate-600">{brandName(a)}</span>,
            model: <span className="text-slate-600">{modelName(a)}</span>,
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
                  onClick={() => {
                    void startEdit(a);
                  }}
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

