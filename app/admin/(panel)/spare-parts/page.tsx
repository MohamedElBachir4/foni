"use client";

import { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import {
  ADMIN_COPY_UNCHANGED_MESSAGE,
  buildSparePartManualCreateComparePayload,
  snapshotCreatePayload,
  snapshotFromSparePartForCopy,
} from "@/lib/adminCopyProduct";
import {
  Package,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  FileSpreadsheet,
  X,
  Download,
  RefreshCw,
  Search,
  Copy,
} from "lucide-react";
import {
  AdminButton,
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminTable,
  AdminTableCellImage,
  AdminPagination,
  AdminProductColorsPicker,
} from "@/components/admin";
import { getProductColorHex } from "@/lib/productColors";

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
  creationSource?: "manual" | "excel";
  details?: string;
  image?: string;
  extraImages?: string[];
  colors?: string[];
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand?: Brand | string | null;
  phoneType?: PhoneType | string | null;
};

type ImportReportError = { productName: string; reason: string };

export default function AdminSparePartsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phoneTypes, setPhoneTypes] = useState<PhoneType[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [totalParts, setTotalParts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [image, setImage] = useState("");
  const [extraImagesText, setExtraImagesText] = useState("");
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
  const [copySnapshot, setCopySnapshot] = useState<string | null>(null);
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
    imagesRecovered?: number;
    emptyRowsSkipped: number;
    duplicateInDb: number;
    duplicateInFile: number;
    errorRows: number;
    errors: ImportReportError[];
    totalInDb: number;
  } | null>(null);
  const [showPhonesModal, setShowPhonesModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSpareColors, setSelectedSpareColors] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useLayoutEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, brandFilter]);

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
        `${API_URL}/api/phone-types?brand=${encodeURIComponent(brandId)}`,
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
    async (brandId?: string, page = 1, searchTerm?: string) => {
      setLoading(true);
      try {
        let query = `?page=${page}&limit=${PAGE_SIZE}`;
        if (brandId) query += `&brand=${encodeURIComponent(brandId)}`;
        const sq = (searchTerm ?? "").trim();
        if (sq) {
          const encoded = encodeURIComponent(sq);
          // Backward-compatible: some deployed backends still read `q` instead of `search`.
          query += `&search=${encoded}&q=${encoded}`;
        }
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
    fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
  }, [fetchParts, brandFilter, currentPage, debouncedSearch]);

  function resetForm() {
    setName("");
    setDetails("");
    setImage("");
    setExtraImagesText("");
    setPrice("");
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
    setSelectedBrand("");
    setSelectedPhoneType("");
    setNewPhoneTypeName("");
    setSelectedSpareColors([]);
    setEditing(null);
    setCopySnapshot(null);
  }

  function parseExtraImages(): string[] {
    return extraImagesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  async function uploadImages(files: FileList | null): Promise<string[]> {
    if (!files || files.length === 0) return [];
    const formData = new FormData();
    Array.from(files)
      .slice(0, 5)
      .forEach((file) => formData.append("images", file));
    const token = getToken();
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

  function getBrandName(item: SparePart): string {
    const b = item.brand;
    if (b == null) return "—";
    if (typeof b === "object" && b?.name) return b.name;
    return brands.find((x) => x._id === b)?.name ?? "—";
  }

  function getPhoneTypeName(item: SparePart): string {
    const pt = item.phoneType;
    if (pt == null) return "—";
    if (typeof pt === "object" && pt?.name) return pt.name;
    return phoneTypes.find((x) => x._id === pt)?.name ?? "—";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: "error", text: "اسم قطعة الغيار مطلوب" });
      return;
    }
    const normalizedDetails = details.trim();
    const strictExcelForm =
      !!editing && editing.creationSource === "excel";

    if (strictExcelForm && !selectedBrand) {
      setMessage({ type: "error", text: "اختر الماركة" });
      return;
    }
    if (strictExcelForm && !selectedPhoneType && !newPhoneTypeName.trim()) {
      setMessage({ type: "error", text: "اختر الهاتف أو أدخل موديل جديد" });
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      details: normalizedDetails,
      description: normalizedDetails,
      image: image.trim(),
      extraImages: parseExtraImages(),
      price: price.trim() ? Number(price) : 0,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      colors: selectedSpareColors,
    };

    /** إنشاء يدوي فقط يُطبَّق عبر هذا النموذج — المصدر لا يصل من واجهة الاستيراد */
    const isCreating = !editing?._id;
    if (isCreating) {
      payload.creationSource = "manual";
      payload.brand = selectedBrand || null;
      if (selectedPhoneType) payload.phoneType = selectedPhoneType;
      else payload.phoneType = null;
      if (!selectedPhoneType && newPhoneTypeName.trim())
        payload.phoneTypeName = newPhoneTypeName.trim();
    } else if (strictExcelForm) {
      payload.brand = selectedBrand;
      payload.phoneType = selectedPhoneType || undefined;
      payload.phoneTypeName = selectedPhoneType ? undefined : newPhoneTypeName.trim() || undefined;
    } else {
      payload.brand = selectedBrand || null;
      if (selectedPhoneType) payload.phoneType = selectedPhoneType;
      else payload.phoneType = null;
      if (!selectedPhoneType && newPhoneTypeName.trim())
        payload.phoneTypeName = newPhoneTypeName.trim();
    }

    if (isCreating && copySnapshot) {
      const current = snapshotCreatePayload(
        buildSparePartManualCreateComparePayload({
          name,
          details,
          image,
          extraImagesText,
          price,
          priceRetail,
          priceWholesale,
          priceReparateur,
          selectedBrand,
          selectedPhoneType,
          newPhoneTypeName,
          selectedSpareColors,
        })
      );
      if (current === copySnapshot) {
        setMessage({ type: "error", text: ADMIN_COPY_UNCHANGED_MESSAGE });
        return;
      }
    }

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
        fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
      } else {
        setMessage({ type: "error", text: data.error || (isEdit ? "فشل التحديث" : "فشل الإنشاء") });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    }
  }

  function startCopyFrom(item: SparePart) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditing(null);
    setCopySnapshot(snapshotFromSparePartForCopy(item));
    setMessage(null);
    setName(item.name || "");
    setDetails(item.details || "");
    setImage((item.image as string) || "");
    setExtraImagesText((item.extraImages || []).join("\n"));
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
    setSelectedSpareColors(Array.isArray(item.colors) ? [...item.colors] : []);
    if (brandId) fetchPhoneTypesForBrand(brandId);
  }

  function startEdit(item: SparePart) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCopySnapshot(null);
    setEditing(item);
    setName(item.name || "");
    setDetails(item.details || "");
    setImage((item.image as string) || "");
    setExtraImagesText((item.extraImages || []).join("\n"));
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
    setSelectedSpareColors(Array.isArray(item.colors) ? [...item.colors] : []);
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
        fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
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
        fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
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
    importReport.errors.forEach((err: ImportReportError) => {
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
        fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
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

  const excelOriginEdit = !!(editing && editing.creationSource === "excel");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader
        title="قطع الغيار"
        description="الإدخال اليدوي: اسم حر، والماركة والموديل اختياريان. استيراد Excel يفرض ربط الماركة والموديل وقواعد التحقق السابقة دون أي تعديل على مسار الملف."
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
            {(importReport.imagesRecovered ?? 0) > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 text-center shadow-sm col-span-2 lg:col-span-7">
               <div className="text-teal-600 text-3xl font-bold">{importReport.imagesRecovered}</div>
               <div className="text-teal-900 text-sm mt-2 font-medium">صور أُضيفت لمنتجات قديمة كانت بلا صورة (نفس الاستيراد)</div>
            </div>
            )}
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
                    {importReport.errors.map((err: ImportReportError, idx) => (
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
        title={
          editing
            ? "تعديل قطعة الغيار"
            : copySnapshot
              ? "إضافة قطعة (من نسخة)"
              : "إضافة قطعة غيار جديدة"
        }
        description={
          copySnapshot && !editing
            ? "تم تعبئة الحقول من منتج موجود. عدّل حقلًا واحدًا على الأقل ثم احفظ."
            : undefined
        }
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
          {excelOriginEdit ? (
            <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              هذه القطعة من استيراد Excel: حافظ على ربط الماركة والموديل عند التعديل.
            </p>
          ) : (
            <p className="sm:col-span-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-950">
              إنشاء أو تعديل يدوي: يمكن تعبئة أي اسم للقطعة؛ الماركة والموديل غير إلزاميين ولن يُتحقَّق الاسم ضد قائمة الهواتف.
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              الماركة{excelOriginEdit ? "" : " (اختياري)"}
            </label>
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              الهاتف (الموديل){excelOriginEdit ? "" : " (اختياري)"}
            </label>
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

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              وصف المنتج
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="admin-input min-h-[140px] resize-y"
              rows={8}
              placeholder="اكتب وصفاً واضحاً يشرح وظيفة القطعة، جودتها، والتوافق مع الموديلات..."
            />
            <p className="mt-1 text-xs text-slate-500">
              بلا حد لطول النص. يظهر الوصف كاملاً في صفحة «التفاصيل» للزبون وليس في بطاقة القائمة.
            </p>
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
              placeholder="https:// أو //... — أي رابط صورة"
            />
          </div>

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
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

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              صور إضافية (حتى 4 روابط - كل رابط في سطر)
            </label>
            <textarea
              value={extraImagesText}
              onChange={(e) => setExtraImagesText(e.target.value)}
              rows={3}
              className="admin-input"
              placeholder="https://...\nhttps://..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">الألوان المتوفرة (اختياري)</label>
            <p className="mb-2 text-xs text-slate-500">
              إن وُجدت ألوان، يختار الزبون اللون عند الشراء من الموقع.
            </p>
            <AdminProductColorsPicker value={selectedSpareColors} onChange={setSelectedSpareColors} />
          </div>

          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            {(editing || copySnapshot) && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                {editing ? "إلغاء التعديل" : "إلغاء النسخ"}
              </AdminButton>
            )}
            <AdminButton type="submit" variant="success" disabled={uploadingImages}>
              {uploadingImages
                ? "جاري رفع الصور..."
                : editing
                ? "حفظ التعديلات"
                : copySnapshot
                ? "حفظ القطعة الجديدة"
                : "إضافة قطعة الغيار"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="قائمة قطع الغيار"
        description={`المجموع: ${loading ? "—" : totalParts.toLocaleString()} قطعة`}
        icon={<Package className="h-5 w-5" />}
      >
        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="spare-parts-search">
            بحث في المنتجات
          </label>
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="spare-parts-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-input w-full py-2.5 pe-10 ps-3"
              placeholder="اسم القطعة، الماركة، الموديل، التفاصيل، نوع القطعة…"
              autoComplete="off"
            />
          </div>
          <p className="max-w-xl text-xs text-slate-500">
            بحث ضمن الاسم والوصف وتفاصيل المنتج ومسمى الموديل؛ يمكنك كتابة عدة كلمات لتضييق النتائج. يمكنك التعديل أو الحذف مباشرة من الجدول.
          </p>
        </div>
        <AdminTable
          columns={[
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "colors", label: "الألوان" },
            { key: "price", label: "السعر" },
            { key: "brand", label: "الماركة" },
            { key: "phone", label: "الهاتف" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={parts.map((p: SparePart) => ({
            _id: p._id,
            image: <AdminTableCellImage src={p.image} alt={p.name} />,
            name: <span className="font-medium text-slate-800">{p.name}</span>,
            colors: (
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(p.colors) ? p.colors : []).map((c) => (
                  <span
                    key={c}
                    className="inline-block h-5 w-5 rounded-full border border-slate-200"
                    style={{
                      backgroundColor: getProductColorHex(c),
                      boxShadow:
                        String(c).toLowerCase() === "white" || String(c).toLowerCase() === "cream"
                          ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                          : undefined,
                    }}
                    title={c}
                  />
                ))}
                {(!p.colors || p.colors.length === 0) && <span className="text-xs text-slate-400">—</span>}
              </div>
            ),
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
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => startCopyFrom(p)}
                  title="نسخ إلى نموذج إضافة جديد"
                />
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
