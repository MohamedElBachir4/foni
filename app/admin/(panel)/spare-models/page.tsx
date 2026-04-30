"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { Smartphone, CheckCircle, AlertCircle, Pencil, Trash2, Search, ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";
import { SPARE_PARTS_STATIC_BRANDS } from "@/lib/sparePartsStaticBrands";
import {
  AdminButton,
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminTableCellImage,
} from "@/components/admin";

type Brand = { _id: string; name: string };

type PhoneType = {
  _id: string;
  name: string;
  image?: string;
  brand: Brand | string;
};

type BrandGroup = {
  brand: Brand;
  phones: PhoneType[];
};

function normalizeKey(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export default function SpareModelsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [types, setTypes] = useState<PhoneType[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<PhoneType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    createdPhones: number;
    existingPhones: number;
    createdBrands: number;
    imagesFetched: number;
    skippedRows: number;
    errorRows: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands`, { headers: getAuthHeaders(), credentials: 'include',  });
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      } else setBrands([]);
    } catch {
      setBrands([]);
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/phone-types`, {
        headers: getAuthHeaders(), credentials: 'include',
       });
      if (res.ok) {
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      } else setTypes([]);
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  function resetForm() {
    setName("");
    setImage("");
    setSelectedBrand("");
    setEditing(null);
  }

  function closeImportModal() {
    if (importing) return;
    setImportOpen(false);
    setImportFile(null);
  }

  const handleDeleteAll = async () => {
    if (!confirm("هل تريد حذف جميع هواتف قطع الغيار نهائياً؟ لا يمكن التراجع.")) return;
    setDeletingAll(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/phone-types/all`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: data.message || `تم حذف ${data.deletedCount ?? 0} هاتف` });
        fetchTypes();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setDeletingAll(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم الهاتف مطلوب" });
      return;
    }
    if (!selectedBrand) {
      setMessage({ type: "error", text: "الرجاء اختيار الماركة" });
      return;
    }

    let resolvedBrandId = selectedBrand;
    if (selectedBrand.startsWith("static:")) {
      const selectedStatic = brandsForDisplay.find((b) => b._id === selectedBrand);
      if (!selectedStatic) {
        setMessage({ type: "error", text: "تعذر تحديد الماركة المختارة" });
        return;
      }

      const existingBrand = brands.find(
        (b) => normalizeKey(b.name) === normalizeKey(selectedStatic.name)
      );
      if (existingBrand?._id) {
        resolvedBrandId = existingBrand._id;
      } else {
        // إنشاء الماركة تلقائياً إذا كانت من القائمة الثابتة وغير موجودة بقاعدة البيانات
        const createBrandRes = await fetch(`${API_URL}/api/brands`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: selectedStatic.name, allowEditDelete: false }),
        });
        const createBrandData = await createBrandRes.json().catch(() => ({}));
        if (createBrandRes.ok && createBrandData?._id) {
          resolvedBrandId = createBrandData._id;
          setBrands((prev) => [...prev, { _id: createBrandData._id, name: createBrandData.name || selectedStatic.name }]);
          setSelectedBrand(createBrandData._id);
        } else {
          setMessage({
            type: "error",
            text: createBrandData.error || "تعذر إنشاء الماركة تلقائياً",
          });
          return;
        }
      }
    }

    const payload = { name: name.trim(), image: image.trim(), brand: resolvedBrandId };
    try {
      const isEdit = !!editing?._id;
      const url = isEdit
        ? `${API_URL}/api/phone-types/${editing._id}`
        : `${API_URL}/api/phone-types`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify(payload),
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: "success",
          text: isEdit ? "تم تحديث هاتف قطع الغيار" : "تم إنشاء هاتف لقطع الغيار",
        });
        resetForm();
        fetchTypes();
      } else {
        setMessage({ type: "error", text: data.error || (isEdit ? "فشل التحديث" : "فشل الإنشاء") });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!importFile) {
      setMessage({ type: "error", text: "اختر ملف Excel أو CSV أولاً" });
      return;
    }

    setImporting(true);
    setImportReport(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/phone-types/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.report) {
        setImportReport(data.report);
        setMessage({
          type: "success",
          text: data.message || "تم استيراد موديلات الهواتف بنجاح",
        });
        fetchBrands();
        fetchTypes();
      } else {
        setMessage({
          type: "error",
          text: data.error || "فشل استيراد الملف",
        });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم أثناء الاستيراد" });
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(item: PhoneType) {
    if (!confirm(`حذف "${item.name}"؟ لا يمكن التراجع.`)) return;
    setDeletingId(item._id);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/phone-types/${item._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف هاتف قطع الغيار" });
        fetchTypes();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(item: PhoneType) {
    setEditing(item);
    setName(item.name || "");
    setImage((item.image as string) || "");
    const brandId = typeof item.brand === "string" ? item.brand : item.brand?._id;
    setSelectedBrand(brandId || "");
  }

  // نفس الماركات الموجودة في /spare-parts (قائمة ثابتة) لكن مربوطة ببيانات API عند التوفر
  const brandsForDisplay = useMemo(() => {
    const apiByKey = new Map<string, Brand>();
    for (const b of brands) {
      apiByKey.set(normalizeKey(b.name), b);
    }

    return SPARE_PARTS_STATIC_BRANDS.map((sb) => {
      const fromApi = apiByKey.get(sb.slug) || apiByKey.get(normalizeKey(sb.name));
      return fromApi || { _id: `static:${sb.slug}`, name: sb.name };
    });
  }, [brands]);

  // تجميع الهواتف حسب الماركة مع إظهار كل الماركات الثابتة حتى لو كانت بدون هواتف
  const groupedByBrand = useMemo(() => {
    const grouped = new Map<string, BrandGroup>();

    for (const b of brandsForDisplay) {
      grouped.set(b._id, { brand: b, phones: [] });
    }

    types.forEach((phone) => {
      const brandId = typeof phone.brand === "string" ? phone.brand : phone.brand?._id;
      const brandName = typeof phone.brand === "string" 
        ? brands.find(b => b._id === phone.brand)?.name || "غير محدد"
        : phone.brand?.name || "غير محدد";

      if (!grouped.has(brandId)) {
        grouped.set(brandId, {
          brand: { _id: brandId, name: brandName },
          phones: [],
        });
      }
      grouped.get(brandId)?.phones.push(phone);
    });

    return Array.from(grouped.values()).sort((a, b) => a.brand.name.localeCompare(b.brand.name));
  }, [types, brands, brandsForDisplay]);

  // تصفية النتائج حسب البحث
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedByBrand;
    
    const lowerSearch = searchTerm.toLowerCase();
    return groupedByBrand
      .map(group => ({
        ...group,
        phones: group.phones.filter(phone =>
          phone.name.toLowerCase().includes(lowerSearch)
        )
      }))
      .filter(group => group.phones.length > 0 || group.brand.name.toLowerCase().includes(lowerSearch));
  }, [groupedByBrand, searchTerm]);

  const messageEl = message && (
    <div
      className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {message.type === "success" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message.text}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminPageHeader
        title="هواتف خاصة بقطع الغيار"
        description="نظّم موديلات الهواتف (الاسم + الصورة + الماركة) لاستخدامها مع قطع الغيار."
        icon={<Smartphone className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="success"
              size="md"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => setImportOpen(true)}
            >
              رفع Excel
            </AdminButton>
            <AdminButton
              variant="danger"
              size="md"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleDeleteAll}
              disabled={deletingAll || types.length === 0}
              loading={deletingAll}
            >
              حذف الكل
            </AdminButton>
          </div>
        }
      />

      <AdminModal
        open={importOpen}
        onClose={closeImportModal}
        title="استيراد هواتف قطع الغيار من Excel"
        description="الملفات المدعومة: .xlsx, .xls, .csv. الأعمدة المطلوبة: name و brand."
        icon={<FileSpreadsheet className="h-5 w-5" />}
        size="md"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              ملف Excel أو CSV
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="admin-input file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700"
            />
            {importFile && <p className="mt-1 text-xs text-slate-500">{importFile.name}</p>}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            مثال الأعمدة: <span className="font-semibold">name</span> و{" "}
            <span className="font-semibold">brand</span>
            <br />
            مثال صف: name = iphone 15 pro, brand = apple
          </div>

          <div className="flex gap-3 pt-2">
            <AdminButton
              type="button"
              variant="outline"
              onClick={closeImportModal}
              className="flex-1"
            >
              إغلاق
            </AdminButton>
            <AdminButton
              type="submit"
              variant="success"
              disabled={importing || !importFile}
              loading={importing}
              className="flex-1"
            >
              استيراد
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {importReport && (
        <AdminCard
          title="تقرير استيراد هواتف قطع الغيار"
          icon={<FileSpreadsheet className="h-5 w-5 text-indigo-600" />}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <div className="text-xl font-bold text-emerald-700">{importReport.createdPhones}</div>
              <div className="text-xs text-emerald-700">هواتف جديدة</div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{importReport.imagesFetched}</div>
              <div className="text-xs text-blue-700">صور تم جلبها</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="text-xl font-bold text-slate-700">{importReport.existingPhones}</div>
              <div className="text-xs text-slate-700">موجودة مسبقاً</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{importReport.skippedRows}</div>
              <div className="text-xs text-amber-700">أسطر متخطاة</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center">
              <div className="text-xl font-bold text-rose-700">{importReport.errorRows}</div>
              <div className="text-xs text-rose-700">أسطر أخطاء</div>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center">
              <div className="text-xl font-bold text-violet-700">{importReport.createdBrands}</div>
              <div className="text-xs text-violet-700">ماركات جديدة</div>
            </div>
          </div>
          {importReport.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p className="mb-2 font-semibold">أول الأخطاء:</p>
              <ul className="space-y-1">
                {importReport.errors.slice(0, 10).map((err, idx) => (
                  <li key={`${err.row}-${idx}`}>السطر {err.row}: {err.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard
        title={editing ? "تعديل هاتف قطع غيار" : "إضافة هاتف جديد لقطع الغيار"}
        icon={<Smartphone className="h-5 w-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {messageEl}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الماركة</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="admin-select"
              >
                <option value="">اختر الماركة</option>
                {brandsForDisplay.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم الهاتف</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="admin-input"
                placeholder="مثال: Samsung S24 Ultra"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                رابط صورة الهاتف (اختياري)
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            {editing && (
              <AdminButton type="button" variant="outline" onClick={() => resetForm()}>
                إلغاء التعديل
              </AdminButton>
            )}
            <AdminButton type="submit" variant="success">
              {editing ? "حفظ التعديلات" : "حفظ الهاتف"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="قائمة هواتف قطع الغيار" icon={<Smartphone className="h-5 w-5" />}>
        {/* شريط البحث */}
        <div className="mb-6 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن هاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-10"
          />
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">جاري التحميل...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            {searchTerm ? "لم يتم العثور على هواتف تطابق البحث" : "لا توجد هواتف مسجّلة بعد"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.brand._id} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* رأس الماركة */}
                <button
                  onClick={() => setExpandedBrandId(
                    expandedBrandId === group.brand._id ? null : group.brand._id
                  )}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-l from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">{group.brand.name}</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                      {group.phones.length}
                    </span>
                  </div>
                  {expandedBrandId === group.brand._id ? (
                    <ChevronUp className="h-5 w-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600" />
                  )}
                </button>

                {/* قائمة الهواتف */}
                {expandedBrandId === group.brand._id && (
                  <div className="bg-white divide-y divide-slate-100">
                    {group.phones.length === 0 ? (
                      <div className="px-4 py-3 text-slate-500 text-sm">لا توجد هواتف في هذه الماركة</div>
                    ) : (
                      group.phones.map((phone) => (
                        <div
                          key={phone._id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {phone.image && (
                              <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-md overflow-hidden">
                                <img
                                  src={phone.image}
                                  alt={phone.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            <span className="font-medium text-slate-800">{phone.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              icon={<Pencil className="h-4 w-4" />}
                              onClick={() => startEdit(phone)}
                              title="تعديل"
                            />
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => handleDelete(phone)}
                              disabled={deletingId === phone._id}
                              loading={deletingId === phone._id}
                              className="hover:bg-rose-50 hover:text-rose-600"
                              title="حذف"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
