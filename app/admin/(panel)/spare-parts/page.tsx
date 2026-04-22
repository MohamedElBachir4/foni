"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { Package, CheckCircle, AlertCircle, Pencil, Trash2, FileSpreadsheet, X, Download, RefreshCw } from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
  AdminPagination,
} from "@/components/admin";

const PAGE_SIZE = 15;

type Brand = { _id: string; name: string };

type PhoneType = {
  _id: string;
  name: string;
  image?: string;
  brand: Brand | string;
};

type SparePart = {
  _id: string;
  name: string;
  image?: string;
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand: Brand | string;
  phoneType: PhoneType | string;
};

export default function AdminSparePartsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phoneTypes, setPhoneTypes] = useState<PhoneType[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [totalParts, setTotalParts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPhoneType, setSelectedPhoneType] = useState("");
  const [newPhoneTypeName, setNewPhoneTypeName] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    createdProducts: number;
    updatedProducts: number;
    updatedProductsList: { productName: string; changes: string }[];
    createdPhones: number;
    createdPhonesList: string[];
    emptyRowsSkipped: number;
    duplicateInDb: number;
    duplicateInFile: number;
    errorRows: number;
    errors: { productName: string; reason: string }[];
    totalInDb: number;
  } | null>(null);
  const [showPhonesModal, setShowPhonesModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchPhoneTypesForBrand = useCallback(async (brandId: string) => {
    if (!brandId) {
      setPhoneTypes([]);
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/phone-types?brand=${encodeURIComponent(brandId, { credentials: "include" })}`,
        { headers: getAuthHeaders(), credentials: 'include',  }
      );
      if (res.ok) {
        const data = await res.json();
        setPhoneTypes(Array.isArray(data) ? data : []);
      } else setPhoneTypes([]);
    } catch {
      setPhoneTypes([]);
    }
  }, []);

  const fetchParts = useCallback(
    async (brandId?: string, page = 1) => {
      setLoading(true);
      try {
        let query = `?page=${page}&limit=${PAGE_SIZE}`;
        if (brandId) query += `&brand=${encodeURIComponent(brandId)}`;
        const res = await fetch(`${API_URL}/api/spare-parts${query}`, {
          headers: getAuthHeaders(), credentials: 'include',
         });
        if (res.ok) {
          const data = await res.json();
          const list = data.parts ?? (Array.isArray(data) ? data : []);
          setParts(list);
          setTotalParts(data.total ?? list.length);
          setTotalPages(data.totalPages ?? Math.max(1, Math.ceil((data.total ?? list.length) / PAGE_SIZE)));
        } else {
          setParts([]);
          setTotalParts(0);
          setTotalPages(1);
        }
      } catch {
        setParts([]);
        setTotalParts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (selectedBrand) {
      fetchPhoneTypesForBrand(selectedBrand);
    } else {
      setPhoneTypes([]);
      setSelectedPhoneType("");
    }
  }, [selectedBrand, fetchPhoneTypesForBrand]);

  useEffect(() => {
    fetchParts(brandFilter || undefined, currentPage);
  }, [fetchParts, brandFilter, currentPage]);

  function resetForm() {
    setName("");
    setImage("");
    setPrice("");
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
    setSelectedBrand("");
    setSelectedPhoneType("");
    setNewPhoneTypeName("");
    setEditing(null);
  }

  function getBrandName(item: SparePart): string {
    const b = item.brand;
    if (typeof b === "object" && b?.name) return b.name;
    return brands.find((x) => x._id === b)?.name ?? "-";
  }

  function getPhoneTypeName(item: SparePart): string {
    const pt = item.phoneType;
    if (typeof pt === "object" && pt?.name) return pt.name;
    return phoneTypes.find((x) => x._id === pt)?.name ?? "-";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم قطعة الغيار مطلوب" });
      return;
    }
    if (!selectedBrand) {
      setMessage({ type: "error", text: "اختر الماركة" });
      return;
    }
    if (!selectedPhoneType && !newPhoneTypeName.trim()) {
      setMessage({ type: "error", text: "اختر الهاتف أو أدخل موديل جديد" });
      return;
    }

    const payload = {
      name: name.trim(),
      image: image.trim(),
      price: price.trim() ? Number(price) : 0,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      brand: selectedBrand,
      phoneType: selectedPhoneType || undefined,
      phoneTypeName: selectedPhoneType ? undefined : newPhoneTypeName.trim() || undefined,
    };

    try {
      const isEdit = !!editing?._id;
      const url = isEdit
        ? `${API_URL}/api/spare-parts/${editing._id}`
        : `${API_URL}/api/spare-parts`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify(payload),
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: "success",
          text: isEdit ? "تم تحديث قطعة الغيار" : "تم إنشاء قطعة الغيار",
        });
        resetForm();
        fetchParts(brandFilter || undefined);
      } else {
        setMessage({ type: "error", text: data.error || (isEdit ? "فشل التحديث" : "فشل الإنشاء") });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  function startEdit(item: SparePart) {
    setEditing(item);
    setName(item.name || "");
    setImage((item.image as string) || "");
    setPrice(String(item.price ?? ""));
    setPriceRetail(
      item.priceRetail != null ? String(item.priceRetail) : ""
    );
    setPriceWholesale(
      item.priceWholesale != null ? String(item.priceWholesale) : ""
    );
    setPriceReparateur(
      item.priceReparateur != null ? String(item.priceReparateur) : ""
    );
    const brandId = typeof item.brand === "string" ? item.brand : item.brand?._id;
    const phoneTypeId = typeof item.phoneType === "string" ? item.phoneType : item.phoneType?._id;
    setSelectedBrand(brandId || "");
    setSelectedPhoneType(phoneTypeId || "");
    setNewPhoneTypeName("");
    if (brandId) fetchPhoneTypesForBrand(brandId);
  }

  async function handleDelete(item: SparePart) {
    if (!confirm(`حذف "${item.name}"؟`)) return;
    setDeletingId(item._id);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/spare-parts/${item._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "تم حذف قطعة الغيار" });
        fetchParts(brandFilter || undefined);
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setDeletingId(null);
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setMessage({ type: "error", text: "اختر ملف Excel أو CSV" });
      return;
    }
    setImporting(true);
    setImportReport(null);
    setMessage(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/spare-parts/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token }` } : {},
        body: formData,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.report) {
        setImportReport({
          createdProducts: data.report.createdProducts ?? 0,
          updatedProducts: data.report.updatedProducts ?? 0,
          updatedProductsList: Array.isArray(data.report.updatedProductsList) ? data.report.updatedProductsList : [],
          createdPhones: data.report.createdPhones ?? 0,
          createdPhonesList: Array.isArray(data.report.createdPhonesList) ? data.report.createdPhonesList : [],
          emptyRowsSkipped: data.report.emptyRowsSkipped ?? 0,
          duplicateInDb: data.report.duplicateInDb ?? 0,
          duplicateInFile: data.report.duplicateInFile ?? 0,
          errorRows: data.report.errorRows ?? 0,
          errors: Array.isArray(data.report.errors) ? data.report.errors : [],
          totalInDb: data.report.totalInDb ?? 0,
        });
        setMessage({ type: "success", text: data.message || "تم انتهاء الاستيراد" });
        fetchParts(brandFilter || undefined);
        setImportFile(null);
        setImportOpen(false);
      } else {
        setMessage({ type: "error", text: data.error || "فشل الاستيراد" });
        if (data.report) {
          setImportReport({
            createdProducts: data.report.createdProducts ?? 0,
            updatedProducts: data.report.updatedProducts ?? 0,
            updatedProductsList: Array.isArray(data.report.updatedProductsList) ? data.report.updatedProductsList : [],
            createdPhones: data.report.createdPhones ?? 0,
            createdPhonesList: Array.isArray(data.report.createdPhonesList) ? data.report.createdPhonesList : [],
            emptyRowsSkipped: data.report.emptyRowsSkipped ?? 0,
            duplicateInDb: data.report.duplicateInDb ?? 0,
            duplicateInFile: data.report.duplicateInFile ?? 0,
            errorRows: data.report.errorRows ?? 0,
            errors: Array.isArray(data.report.errors) ? data.report.errors : [],
            totalInDb: data.report.totalInDb ?? 0,
          });
          setImportOpen(false);
          setImportFile(null);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessage({ type: "error", text: "انتهت المهلة. الملف كبير جداً—جرّب ملفاً أصغر أو انتظر اكتمال المعالجة." });
      } else {
        setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
      }
    } finally {
      clearTimeout(timeoutId);
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportReport(null);
  };

  const downloadErrorReport = () => {
    if (!importReport?.errors?.length) return;
    let csv = "المنتج;السبب\n";
    importReport.errors.forEach((err: any) => {
      const name = (err?.productName || String(err)).replace(/"/g, '""');
      const reason = (err?.reason || "غير معروف").replace(/"/g, '""');
      csv += `"${name}";"${reason}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_اخطاء_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAll = async () => {
    if (!confirm("هل تريد حذف جميع قطع الغيار نهائياً؟ لا يمكن التراجع.")) return;
    setDeletingAll(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/spare-parts/all`, {
        method: "DELETE",
        headers: getAuthHeaders(), credentials: 'include',
       });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: data.message || `تم حذف ${data.deletedCount ?? 0} قطعة غيار` });
        fetchParts(brandFilter || undefined);
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setDeletingAll(false);
    }
  };

  // Pagination is now server-side - parts array IS the current page

  useEffect(() => {
    setCurrentPage(1);
  }, [brandFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader
        title="قطع الغيار"
        description="إنشاء قطع الغيار وربطها بالماركة والموديل. الماركة أولاً ثم اختيار الهاتف (الموديل) التابع لها."
        icon={<Package className="h-5 w-5" />}
        actions={
          <>
            <AdminButton
              variant="success"
              size="md"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => setImportOpen(true)}
            >
              Import Excel
            </AdminButton>
            <AdminButton
              variant="danger"
              size="md"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleDeleteAll}
              disabled={deletingAll || parts.length === 0}
              loading={deletingAll}
            >
              حذف الكل
            </AdminButton>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="admin-select w-auto min-w-[140px]"
            >
              <option value="">كل الماركات</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </>
        }
      />

      <AdminModal
        open={importOpen}
        onClose={closeImportModal}
        title="استيراد قطع الغيار من Excel"
        description="الملفات المدعومة: .xlsx, .xls, .csv — حتى 100 سطر بيانات (غير فارغ) لكل ملف. الأعمدة: Désignation, Prix Gro, Prix Réparateur, Prix Détail."
        icon={<FileSpreadsheet className="h-5 w-5" />}
        size="md"
      >
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}
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
            {importFile && (
              <p className="mt-1 text-xs text-slate-500">{importFile.name}</p>
            )}
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
          title="تقرير نتائج استيراد ملف الإكسيل"
          icon={<FileSpreadsheet className="h-5 w-5 text-indigo-600" />}
          actions={
            <div className="flex gap-2">
              {importReport.errors.length > 0 && (
                <AdminButton variant="outline" size="sm" onClick={downloadErrorReport}>
                  <Download className="h-4 w-4" /> تحميل الأخطاء كملف CSV
                </AdminButton>
              )}
              <AdminButton variant="ghost" size="sm" onClick={() => setImportReport(null)}>
                <X className="h-4 w-4" /> إغلاق التقرير
              </AdminButton>
            </div>
          }
        >
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
            {/* Total In DB - Prominent */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 text-center shadow-sm col-span-2 lg:col-span-7">
               <div className="text-indigo-600 text-4xl font-black">{importReport.totalInDb.toLocaleString()}</div>
               <div className="text-indigo-800 text-sm mt-2 font-semibold">إجمالي المنتجات في قاعدة البيانات</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5 text-center shadow-sm">
               <div className="text-emerald-600 text-3xl font-bold">{importReport.createdProducts}</div>
               <div className="text-emerald-800 text-sm mt-2 font-medium">منتجات جديدة مضافة</div>
            </div>
            <div 
              className={`bg-orange-50 border border-orange-200 rounded-lg p-5 text-center shadow-sm cursor-pointer transition-all hover:bg-orange-100 active:scale-95 ${importReport.updatedProducts > 0 ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
              onClick={() => importReport.updatedProducts > 0 && setShowUpdatesModal(true)}
              title={importReport.updatedProducts > 0 ? "اضغط لعرض تفاصيل التحديثات" : ""}
            >
               <div className="text-orange-600 text-3xl font-bold">{importReport.updatedProducts}</div>
               <div className="text-orange-800 text-sm mt-2 font-medium">تحديث أسعار</div>
               {importReport.updatedProducts > 0 && (
                 <div className="text-orange-500 text-[10px] mt-1 font-bold animate-pulse">اضغط للتفاصيل</div>
               )}
            </div>
            <div 
              className={`bg-blue-50 border border-blue-100 rounded-lg p-5 text-center shadow-sm cursor-pointer transition-all hover:bg-blue-100 active:scale-95 ${importReport.createdPhones > 0 ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
              onClick={() => importReport.createdPhones > 0 && setShowPhonesModal(true)}
              title={importReport.createdPhones > 0 ? "اضغط لعرض الهواتف المضافة" : ""}
            >
               <div className="text-blue-600 text-3xl font-bold">{importReport.createdPhones}</div>
               <div className="text-blue-800 text-sm mt-2 font-medium">هواتف جديدة</div>
               {importReport.createdPhones > 0 && (
                 <div className="text-blue-500 text-[10px] mt-1 font-bold animate-pulse">اضغط للتفاصيل</div>
               )}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 text-center shadow-sm">
               <div className="text-amber-600 text-3xl font-bold">{importReport.duplicateInDb + importReport.duplicateInFile}</div>
               <div className="text-amber-800 text-sm mt-2 font-medium">مكررة (بدون تغيير)</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center shadow-sm">
               <div className="text-slate-600 text-3xl font-bold">{importReport.emptyRowsSkipped}</div>
               <div className="text-slate-800 text-sm mt-2 font-medium">صفوف فارغة</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-5 text-center shadow-sm">
               <div className="text-rose-600 text-3xl font-bold">{importReport.errorRows}</div>
               <div className="text-rose-800 text-sm mt-2 font-medium">أخطاء استيراد</div>
            </div>
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-5 text-center shadow-sm">
               <div className="text-cyan-600 text-3xl font-bold">{importReport.totalInDb - importReport.createdProducts > 0 ? (importReport.totalInDb - importReport.createdProducts).toLocaleString() : '0'}</div>
               <div className="text-cyan-800 text-sm mt-2 font-medium">منتجات سابقة محفوظة</div>
            </div>
          </div>

          {importReport.errors.length > 0 && (
            <div className="border border-rose-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <div className="bg-rose-50/80 border-b border-rose-200 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <AlertCircle className="h-5 w-5 text-rose-600" />
                   <h3 className="font-semibold text-rose-900 text-base">سجل الأخطاء والتفاصيل الكاملة ({importReport.errors.length})</h3>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto w-full custom-scrollbar">
                <table className="w-full text-right text-sm">
                  <thead className="bg-white text-slate-600 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-slate-800 w-1/3 border-l border-slate-100">المنتج (كما في الملف)</th>
                      <th className="px-5 py-3.5 font-semibold text-slate-800">تفاصيل وسبب الخطأ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importReport.errors.map((err: any, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/50 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-700 border-l border-slate-100 align-top leading-relaxed" dir="ltr">
                          {err?.productName || String(err)}
                        </td>
                        <td className="px-5 py-4 text-rose-600 font-medium align-top leading-relaxed">
                          {err?.reason || "خطأ غير معروف"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard
        title={editing ? "تعديل قطعة الغيار" : "إضافة قطعة غيار جديدة"}
        icon={<Package className="h-5 w-5" />}
      >
        {message && (
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
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">الماركة</label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedPhoneType("");
                setNewPhoneTypeName("");
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">الهاتف (الموديل)</label>
            <select
              value={selectedPhoneType}
              onChange={(e) => setSelectedPhoneType(e.target.value)}
              disabled={!selectedBrand}
              className="admin-select disabled:opacity-50"
            >
              <option value="">
                {selectedBrand ? "اختر الهاتف" : "اختر الماركة أولاً"}
              </option>
              {phoneTypes.map((pt) => (
                <option key={pt._id} value={pt._id}>
                  {pt.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newPhoneTypeName}
              onChange={(e) => setNewPhoneTypeName(e.target.value)}
              disabled={!selectedBrand}
              className="admin-input mt-2 disabled:opacity-50"
              placeholder="أو اكتب موديل جديد ليتم إنشاؤه تلقائياً"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">اسم قطعة الغيار</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-input"
              placeholder="مثال: شاشة لمس"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              سعر التجزئة (Retail) دج
            </label>
            <input
              type="number"
              min="0"
              step="1"
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
              step="1"
              value={priceWholesale}
              onChange={(e) => setPriceWholesale(e.target.value)}
              className="admin-input"
              placeholder="سعر الكميات الكبيرة"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              سعر Réparateur دج
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={priceReparateur}
              onChange={(e) => setPriceReparateur(e.target.value)}
              className="admin-input"
              placeholder="سعر الفني / مركز الصيانة"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              رابط صورة القطعة (اختياري)
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="admin-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            {editing && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                إلغاء التعديل
              </AdminButton>
            )}
            <AdminButton type="submit" variant="success">
              {editing ? "حفظ التعديلات" : "إضافة قطعة الغيار"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="قائمة قطع الغيار"
        description={`المجموع: ${loading ? "—" : totalParts.toLocaleString()} قطعة`}
        icon={<Package className="h-5 w-5" />}
      >
        <AdminTable
          columns={[
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "price", label: "السعر" },
            { key: "brand", label: "الماركة" },
            { key: "phone", label: "الهاتف" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={parts.map((p: SparePart) => ({
            _id: p._id,
            image: <AdminTableCellImage src={p.image} alt={p.name} />,
            name: <span className="font-medium text-slate-800">{p.name}</span>,
            price: (
              <span className="text-slate-700">
                {p.price != null ? Number(p.price).toLocaleString() : "—"} دج
              </span>
            ),
            brand: <span className="text-slate-600">{getBrandName(p)}</span>,
            phone: <span className="text-slate-600">{getPhoneTypeName(p)}</span>,
            actions: (
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => startEdit(p)}
                  title="تعديل"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(p)}
                  disabled={deletingId === p._id}
                  loading={deletingId === p._id}
                  className="hover:bg-rose-50 hover:text-rose-600"
                  title="حذف"
                />
              </div>
            ),
          }))}
          keyExtractor={(r) => r._id as string}
          emptyMessage="لا توجد قطع غيار مسجّلة."
          loading={loading}
        />
        {totalPages > 1 && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <AdminPagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalParts}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </AdminCard>

      <AdminModal
        open={showPhonesModal}
        onClose={() => setShowPhonesModal(false)}
        title="قائمة الهواتف (الموديلات) المضافة حديثاً"
        description="هذه الموديلات تم إنشاؤها تلقائياً أثناء عملية الاستيراد لأنها لم تكن موجودة في قاعدة البيانات."
        icon={<Package className="h-5 w-5 text-blue-600" />}
        size="md"
      >
        <div className="max-h-[400px] overflow-y-auto w-full custom-scrollbar pr-1">
          <div className="grid gap-2">
            {importReport?.createdPhonesList?.map((phone, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="font-semibold text-slate-800 truncate" dir="ltr">
                  {phone}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <AdminButton 
            variant="outline" 
            className="w-full"
            onClick={() => setShowPhonesModal(false)}
          >
            إغلاق النافذة
          </AdminButton>
        </div>
      </AdminModal>

      {/* Updated Products Modal */}
      <AdminModal
        open={showUpdatesModal}
        onClose={() => setShowUpdatesModal(false)}
        title="تفاصيل تحديث الأسعار"
        description="هذه المنتجات تم تحديث أسعارها تلقائياً لأنها كانت موجودة مسبقاً مع أسعار مختلفة."
        icon={<RefreshCw className="h-5 w-5 text-orange-600" />}
        size="lg"
      >
        <div className="max-h-[500px] overflow-y-auto w-full custom-scrollbar pr-1">
          <table className="w-full text-right text-sm">
            <thead className="bg-white text-slate-600 sticky top-0 border-b border-slate-200 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-800 w-10">#</th>
                <th className="px-4 py-3 font-semibold text-slate-800">المنتج</th>
                <th className="px-4 py-3 font-semibold text-slate-800">التغييرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importReport?.updatedProductsList?.map((item, idx) => (
                <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-700" dir="ltr">{item.productName}</td>
                  <td className="px-4 py-3 text-orange-700 font-medium" dir="ltr">{item.changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <AdminButton 
            variant="outline" 
            className="w-full"
            onClick={() => setShowUpdatesModal(false)}
          >
            إغلاق النافذة
          </AdminButton>
        </div>
      </AdminModal>
    </div>
  );
}
