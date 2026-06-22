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
  createEmptyPricedOptionRow,
  pricedRowsFromApi,
  validatePricedOptionRows,
  type PricedOptionFormRow,
  type PricedOptionCompare,
} from "@/lib/adminPricedOptionsForm";
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
  Plus,
  Eye,
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
  AdminSparePartModelPicker,
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
  supplier?: string;
  creationSource?: "manual" | "excel";
  details?: string;
  image?: string;
  extraImages?: string[];
  colors?: string[];
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  manageStock?: boolean;
  stock?: number;
  brand?: Brand | string | null;
  phoneType?: PhoneType | string | null;
  phoneTypes?: PhoneType[] | string[] | null;
  options?: string[];
  pricedOptions?: PricedOptionCompare[];
  hasVariants?: boolean;
};

type ImportReportError = { productName: string; reason: string };
type InlinePriceDraft = {
  priceRetail: string;
  priceWholesale: string;
  priceReparateur: string;
};

type ImportArchiveStatus = "processing" | "success" | "partial" | "failed" | "deleted";

type ImportArchiveItem = {
  _id: string;
  fileName: string;
  uploadedByAdminEmail?: string;
  status: ImportArchiveStatus;
  createdAt: string;
  report?: {
    createdProducts?: number;
    updatedProducts?: number;
    createdPhones?: number;
    createdPhoneImages?: number;
    phonesNotFound?: number;
    phonesNotFoundList?: string[];
    imagesRecovered?: number;
    createdWithoutImage?: number;
    emptyRowsSkipped?: number;
    duplicateInDb?: number;
    duplicateInFile?: number;
    errorRows?: number;
    totalInDb?: number;
    errors?: ImportReportError[];
  };
};

type ImportArchiveProduct = {
  _id: string;
  name: string;
  image?: string;
  priceRetail?: number;
  price?: number;
  createdAt?: string;
  phoneType?: { _id?: string; name?: string } | string | null;
};

const fld =
  "admin-input !h-7 !rounded-md !px-2 !py-1 text-[11px] text-slate-800 placeholder:text-slate-400";
const fldNum = `${fld} font-mono tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
const lbl = "mb-0.5 block text-[10px] font-medium text-slate-500";

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
  /** متعدّد الموديلات (إنشاء/تعديل يدوي) — مطابق لتدفّق الإكسسوار */
  const [selectedPhoneTypes, setSelectedPhoneTypes] = useState<string[]>([]);
  const [newPhoneTypeName, setNewPhoneTypeName] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  /** تنبيهات داخل نافذة إنشاء/تعديل القطعة */
  const [partModalNotice, setPartModalNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [savingPart, setSavingPart] = useState(false);
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
    phonesNotFound: number;
    phonesNotFoundList: string[];
    createdPhones?: number;
    createdPhoneImages?: number;
    createdPhonesList?: string[];
    imagesRecovered?: number;
    createdWithoutImage?: number;
    emptyRowsSkipped: number;
    duplicateInDb: number;
    duplicateInFile: number;
    errorRows: number;
    errors: ImportReportError[];
    totalInDb: number;
  } | null>(null);
  const [importArchiveId, setImportArchiveId] = useState<string | null>(null);
  const [importReportDownloading, setImportReportDownloading] = useState(false);
  const [showPhonesModal, setShowPhonesModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSpareColors, setSelectedSpareColors] = useState<string[]>([]);
  const [pricedOptionRows, setPricedOptionRows] = useState<PricedOptionFormRow[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [manageStock, setManageStock] = useState(false);
  const [stock, setStock] = useState("");
  const [inlinePriceDrafts, setInlinePriceDrafts] = useState<Record<string, InlinePriceDraft>>({});
  const [inlineSavingIds, setInlineSavingIds] = useState<Record<string, boolean>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [archives, setArchives] = useState<ImportArchiveItem[]>([]);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotalPages, setArchiveTotalPages] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [archiveDetailsOpen, setArchiveDetailsOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ImportArchiveItem | null>(null);
  const [archiveProducts, setArchiveProducts] = useState<ImportArchiveProduct[]>([]);
  const [archiveProductsLoading, setArchiveProductsLoading] = useState(false);
  const [archiveProductsPage, setArchiveProductsPage] = useState(1);
  const [archiveProductsTotalPages, setArchiveProductsTotalPages] = useState(1);
  const [archiveProductsTotal, setArchiveProductsTotal] = useState(0);
  const [archiveDeleting, setArchiveDeleting] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<{
    mode: "single" | "all";
    archiveId: string;
    productId?: string;
    productName?: string;
  } | null>(null);

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
        // أساسي: /api/spare-parts/_admin/list — احتياطي: /api/admin/spare-parts (كلاهما في المستودع الحالي)
        const primaryUrl = getToken()
          ? `${API_URL}/api/spare-parts/_admin/list${query}`
          : `${API_URL}/api/spare-parts${query}`;
        const fallbackUrl =
          getToken() ? `${API_URL}/api/admin/spare-parts${query}` : null;

        let res = await fetch(primaryUrl, {
          headers: getAuthHeaders(), credentials: 'include',
         });
        if (!res.ok && res.status === 404 && fallbackUrl) {
          res = await fetch(fallbackUrl, {
            headers: getAuthHeaders(),
            credentials: "include",
          });
        }
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

  const fetchImportArchives = useCallback(async (page = 1) => {
    setArchivesLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/spare-parts/import-archives?page=${page}&limit=8`,
        { headers: getAuthHeaders(), credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setArchives([]);
        setArchiveTotalPages(1);
        setArchiveTotal(0);
        return;
      }
      const list = Array.isArray(data.archives) ? data.archives : [];
      setArchives(list);
      setArchiveTotalPages(data.totalPages ?? 1);
      setArchiveTotal(data.total ?? list.length);
    } catch {
      setArchives([]);
      setArchiveTotalPages(1);
      setArchiveTotal(0);
    } finally {
      setArchivesLoading(false);
    }
  }, []);

  const fetchArchiveProducts = useCallback(async (archiveId: string, page = 1) => {
    setArchiveProductsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/spare-parts/import-archives/${archiveId}/products?page=${page}&limit=10`,
        { headers: getAuthHeaders(), credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setArchiveProducts([]);
        setArchiveProductsTotalPages(1);
        setArchiveProductsTotal(0);
        return;
      }
      const list = Array.isArray(data.products) ? data.products : [];
      setArchiveProducts(list);
      setArchiveProductsTotalPages(data.totalPages ?? 1);
      setArchiveProductsTotal(data.total ?? list.length);
    } catch {
      setArchiveProducts([]);
      setArchiveProductsTotalPages(1);
      setArchiveProductsTotal(0);
    } finally {
      setArchiveProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (selectedBrand) {
      fetchPhoneTypesForBrand(selectedBrand);
    } else {
      setPhoneTypes([]);
      setSelectedPhoneType("");
      setSelectedPhoneTypes([]);
    }
  }, [selectedBrand, fetchPhoneTypesForBrand]);

  useEffect(() => {
    fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
  }, [fetchParts, brandFilter, currentPage, debouncedSearch]);

  useEffect(() => {
    fetchImportArchives(archivePage);
  }, [fetchImportArchives, archivePage]);

  useEffect(() => {
    if (!selectedArchive?._id) return;
    fetchArchiveProducts(selectedArchive._id, archiveProductsPage);
  }, [fetchArchiveProducts, selectedArchive, archiveProductsPage]);

  function sparePartPhoneTypeIds(item: SparePart): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    if (Array.isArray(item.phoneTypes)) {
      for (const pt of item.phoneTypes) {
        const id = typeof pt === "string" ? pt : pt?._id;
        if (id && !seen.has(id)) {
          seen.add(id);
          out.push(id);
        }
      }
    }
    const single = item.phoneType;
    const sid = typeof single === "string" ? single : single && typeof single === "object" ? single._id : "";
    if (sid && !seen.has(sid)) out.push(sid);
    return out;
  }

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
    setSelectedPhoneTypes([]);
    setNewPhoneTypeName("");
    setSelectedSpareColors([]);
    setPricedOptionRows([]);
    setHasVariants(false);
    setManageStock(false);
    setStock("");
    setEditing(null);
    setCopySnapshot(null);
    setPartModalNotice(null);
  }

  function closePartModal() {
    if (savingPart || uploadingImages) return;
    setPartModalOpen(false);
    setPartModalNotice(null);
    resetForm();
  }

  function openCreatePartModal() {
    resetForm();
    setPartModalOpen(true);
  }

  function openEditPartModal(item: SparePart) {
    startEdit(item);
    setPartModalNotice(null);
    setPartModalOpen(true);
  }

  function parseExtraImages(): string[] {
    return extraImagesText
      .split(/\r?\n/)
      .flatMap((line) =>
        line
          .split(/,\s*/u)
          .map((url) => url.trim())
          .filter(Boolean)
      )
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
    const names: string[] = [];
    if (Array.isArray(item.phoneTypes) && item.phoneTypes.length > 0) {
      for (const pt of item.phoneTypes) {
        if (typeof pt === "object" && pt?.name) names.push(pt.name);
        else if (typeof pt === "string") {
          const row = phoneTypes.find((x) => x._id === pt);
          if (row?.name) names.push(row.name);
        }
      }
    }
    if (names.length > 0) return [...new Set(names)].join("، ");
    const pt = item.phoneType;
    if (pt == null) return "—";
    if (typeof pt === "object" && pt?.name) return pt.name;
    return phoneTypes.find((x) => x._id === pt)?.name ?? "—";
  }

  function getAdminDisplayName(item: SparePart): string {
    const baseName = String(item.name || "").trim();
    const supplier = String(item.supplier || "").trim();
    if (!supplier) return baseName;
    return `${baseName} ${supplier}`.trim();
  }

  function retailValueOf(item: SparePart): number {
    const v = item.priceRetail ?? item.price ?? 0;
    return Number.isFinite(Number(v)) ? Number(v) : 0;
  }

  function formatDateTime(v?: string): string {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-DZ");
  }

  function archiveStatusBadge(status: ImportArchiveStatus) {
    if (status === "processing") {
      return "border-sky-200 bg-sky-50 text-sky-700";
    }
    if (status === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (status === "partial") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  function archiveStatusLabel(status: ImportArchiveStatus) {
    if (status === "processing") return "جاري المعالجة";
    return status;
  }

  function importReportFromArchive(report: ImportArchiveItem["report"]) {
    return {
      createdProducts: report?.createdProducts ?? 0,
      updatedProducts: report?.updatedProducts ?? 0,
      updatedProductsList: Array.isArray(
        (report as { updatedProductsList?: { productName: string; changes: string }[] })
          ?.updatedProductsList
      )
        ? (report as { updatedProductsList: { productName: string; changes: string }[] })
            .updatedProductsList
        : [],
      phonesNotFound: report?.phonesNotFound ?? 0,
      phonesNotFoundList: Array.isArray(report?.phonesNotFoundList)
        ? report.phonesNotFoundList
        : [],
      createdPhones: report?.createdPhones ?? 0,
      createdPhoneImages: (report as { createdPhoneImages?: number })?.createdPhoneImages ?? 0,
      createdPhonesList: Array.isArray(
        (report as { createdPhonesList?: string[] })?.createdPhonesList
      )
        ? (report as { createdPhonesList: string[] }).createdPhonesList
        : [],
      emptyRowsSkipped: report?.emptyRowsSkipped ?? 0,
      duplicateInDb: report?.duplicateInDb ?? 0,
      duplicateInFile: report?.duplicateInFile ?? 0,
      errorRows: report?.errorRows ?? 0,
      errors: Array.isArray(report?.errors) ? report.errors : [],
      totalInDb: report?.totalInDb ?? 0,
      imagesRecovered: report?.imagesRecovered ?? 0,
      createdWithoutImage: report?.createdWithoutImage ?? 0,
    };
  }

  async function downloadImportReportExcel(archiveId: string) {
    if (!archiveId) return;
    setImportReportDownloading(true);
    setMessage(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/api/spare-parts/import-archives/${archiveId}/report`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: data.error || "تعذّر تحميل تقرير Excel",
        });
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainMatch = disposition.match(/filename="([^"]+)"/i);
      const fileName = utf8Match
        ? decodeURIComponent(utf8Match[1])
        : plainMatch?.[1] || `تقرير_رفع_${archiveId}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "تعذّر الاتصال بالخادم أثناء تحميل التقرير" });
    } finally {
      setImportReportDownloading(false);
    }
  }

  async function pollImportArchive(archiveId: string, token: string | null) {
    const pollMs = 4000;
    const maxPolls = 2700;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
      const statusRes = await fetch(`${API_URL}/api/spare-parts/import-archives/${archiveId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const statusData = await statusRes.json().catch(() => ({}));
      if (!statusRes.ok || !statusData.archive) continue;
      const archive = statusData.archive as ImportArchiveItem;
      if (archive.status === "processing") {
        void fetchImportArchives(1);
        continue;
      }
      return archive;
    }
    return null;
  }

  async function openArchiveDetails(archive: ImportArchiveItem) {
    setSelectedArchive(archive);
    setArchiveProductsPage(1);
    setArchiveDetailsOpen(true);
    await fetchArchiveProducts(archive._id, 1);
  }

  async function executeArchiveDelete() {
    if (!archiveConfirm) return;
    setArchiveDeleting(true);
    try {
      const url =
        archiveConfirm.mode === "all"
          ? `${API_URL}/api/spare-parts/import-archives/${archiveConfirm.archiveId}/products`
          : `${API_URL}/api/spare-parts/import-archives/${archiveConfirm.archiveId}/products/${archiveConfirm.productId}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل الحذف" });
        return;
      }
      setMessage({ type: "success", text: data.message || "تم الحذف بنجاح" });
      setArchiveConfirm(null);
      await fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
      await fetchImportArchives(archivePage);
      if (selectedArchive?._id === archiveConfirm.archiveId) {
        if (archiveConfirm.mode === "all") {
          setArchiveDetailsOpen(false);
          setSelectedArchive(null);
          setArchiveProducts([]);
        } else {
          await fetchArchiveProducts(archiveConfirm.archiveId, archiveProductsPage);
        }
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم أثناء الحذف" });
    } finally {
      setArchiveDeleting(false);
    }
  }

  function getInlineDraft(item: SparePart): InlinePriceDraft {
    const existing = inlinePriceDrafts[item._id];
    if (existing) return existing;
    return {
      priceRetail: String(retailValueOf(item)),
      priceWholesale: String(item.priceWholesale ?? 0),
      priceReparateur: String(item.priceReparateur ?? 0),
    };
  }

  function setInlineDraftValue(
    item: SparePart,
    field: keyof InlinePriceDraft,
    value: string
  ) {
    setInlinePriceDrafts((prev) => {
      const current = prev[item._id] ?? getInlineDraft(item);
      return {
        ...prev,
        [item._id]: { ...current, [field]: value },
      };
    });
  }

  async function saveInlinePrices(item: SparePart) {
    const draft = getInlineDraft(item);
    const parseOrKeep = (raw: string, fallback: number) => {
      const t = String(raw ?? "").trim();
      if (t === "") return fallback;
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    };
    const priceRetailNum = parseOrKeep(draft.priceRetail, retailValueOf(item));
    const priceWholesaleNum = parseOrKeep(
      draft.priceWholesale,
      Number(item.priceWholesale ?? 0)
    );
    const priceReparateurNum = parseOrKeep(
      draft.priceReparateur,
      Number(item.priceReparateur ?? 0)
    );

    if (
      !Number.isFinite(priceRetailNum) ||
      !Number.isFinite(priceWholesaleNum) ||
      !Number.isFinite(priceReparateurNum)
    ) {
      setMessage({ type: "error", text: "تحقق من الأسعار: يجب أن تكون أرقامًا صالحة" });
      return;
    }

    setInlineSavingIds((prev) => ({ ...prev, [item._id]: true }));
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/spare-parts/${item._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          price: priceRetailNum,
          priceRetail: priceRetailNum,
          priceWholesale: priceWholesaleNum,
          priceReparateur: priceReparateurNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل حفظ الأسعار" });
        return;
      }

      setParts((prev) =>
        prev.map((p) =>
          p._id === item._id
            ? {
                ...p,
                price: priceRetailNum,
                priceRetail: priceRetailNum,
                priceWholesale: priceWholesaleNum,
                priceReparateur: priceReparateurNum,
              }
            : p
        )
      );
      setMessage({ type: "success", text: "تم حفظ الأسعار بسرعة" });
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم أثناء حفظ الأسعار" });
    } finally {
      setInlineSavingIds((prev) => ({ ...prev, [item._id]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPartModalNotice(null);
    setMessage(null);
    if (!name.trim()) {
      setPartModalNotice({ type: "error", text: "اسم قطعة الغيار مطلوب" });
      return;
    }
    const normalizedDetails = details.trim();
    const strictExcelForm =
      !!editing && editing.creationSource === "excel";

    if (strictExcelForm && !selectedBrand) {
      setPartModalNotice({ type: "error", text: "اختر الماركة" });
      return;
    }
    if (strictExcelForm && !selectedPhoneType && !newPhoneTypeName.trim()) {
      setPartModalNotice({ type: "error", text: "اختر الهاتف أو أدخل موديل جديد" });
      return;
    }
    if (!strictExcelForm && selectedPhoneTypes.length > 0 && !selectedBrand) {
      setPartModalNotice({ type: "error", text: "اختر الماركة عند اختيار موديل واحد أو أكثر" });
      return;
    }

    const effectivePrice =
      price.trim().length > 0
        ? Number(price)
        : priceRetail.trim().length > 0
          ? Number(priceRetail)
          : 0;
    const pricedValidation = validatePricedOptionRows(pricedOptionRows);
    if (!pricedValidation.ok) {
      setPartModalNotice({ type: "error", text: pricedValidation.text });
      return;
    }
    if (hasVariants && pricedValidation.data.length === 0) {
      setPartModalNotice({
        type: "error",
        text: "تعدد الخيارات يتطلّب خياراً واحداً على الأقل مع أسعار التجزئة والجملة والتاجر أو صاحب المحل.",
      });
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      details: normalizedDetails,
      description: normalizedDetails,
      image: image.trim(),
      extraImages: parseExtraImages(),
      price: effectivePrice,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      colors: selectedSpareColors,
      pricedOptions: pricedValidation.data,
      hasVariants,
      manageStock,
      stock: manageStock ? (stock.trim() ? Number(stock) : 0) : 0,
    };

    /** إنشاء يدوي فقط يُطبَّق عبر هذا النموذج — المصدر لا يصل من واجهة الاستيراد */
    const isCreating = !editing?._id;
    if (isCreating) {
      payload.creationSource = "manual";
      payload.brand = selectedBrand || null;
      if (selectedPhoneTypes.length > 0) payload.phoneTypes = [...selectedPhoneTypes];
      else {
        payload.phoneType = null;
        if (newPhoneTypeName.trim()) payload.phoneTypeName = newPhoneTypeName.trim();
      }
    } else if (strictExcelForm) {
      payload.brand = selectedBrand;
      payload.phoneType = selectedPhoneType || undefined;
      payload.phoneTypeName = selectedPhoneType ? undefined : newPhoneTypeName.trim() || undefined;
    } else {
      payload.brand = selectedBrand || null;
      payload.phoneTypes = [...selectedPhoneTypes];
      payload.phoneType = selectedPhoneTypes.length > 0 ? selectedPhoneTypes[0] : null;
      payload.phoneTypeName =
        selectedPhoneTypes.length === 0 && newPhoneTypeName.trim()
          ? newPhoneTypeName.trim()
          : selectedPhoneTypes.length === 0
            ? ""
            : undefined;
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
          selectedPhoneTypes,
          newPhoneTypeName,
          selectedSpareColors,
          pricedOptions: pricedValidation.data,
          hasVariants,
        })
      );
      if (current === copySnapshot) {
        setPartModalNotice({ type: "error", text: ADMIN_COPY_UNCHANGED_MESSAGE });
        return;
      }
    }

    setSavingPart(true);
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
        setPartModalOpen(false);
        resetForm();
        setMessage({
          type: "success",
          text: isEdit ? "تم تحديث قطعة الغيار بنجاح" : "تم إنشاء قطعة الغيار بنجاح",
        });
        await fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
      } else {
        setPartModalNotice({
          type: "error",
          text: data.error || (isEdit ? "فشل التحديث" : "فشل الإنشاء"),
        });
      }
    } catch {
      setPartModalNotice({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSavingPart(false);
    }
  }

  function startCopyFrom(item: SparePart) {
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
    const linkedIds = sparePartPhoneTypeIds(item);
    const fromExcelCopy = item.creationSource === "excel";
    const phoneTypeId = typeof item.phoneType === "string" ? item.phoneType : item.phoneType?._id;
    setSelectedBrand(brandId || "");
    if (fromExcelCopy) {
      setSelectedPhoneType(phoneTypeId || "");
      setSelectedPhoneTypes([]);
    } else {
      setSelectedPhoneType("");
      setSelectedPhoneTypes(linkedIds);
    }
    setNewPhoneTypeName("");
    setSelectedSpareColors(Array.isArray(item.colors) ? [...item.colors] : []);
    setPricedOptionRows(pricedRowsFromApi(item.pricedOptions));
    setHasVariants(Boolean(item.hasVariants));
    setManageStock(Boolean(item.manageStock));
    setStock(item.stock != null ? String(item.stock) : "");
    if (brandId) fetchPhoneTypesForBrand(brandId);
    setPartModalNotice(null);
    setPartModalOpen(true);
  }

  function startEdit(item: SparePart) {
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
    const linkedIds = sparePartPhoneTypeIds(item);
    const fromExcel = item.creationSource === "excel";
    const phoneTypeId = typeof item.phoneType === "string" ? item.phoneType : item.phoneType?._id;
    setSelectedBrand(brandId || "");
    if (fromExcel) {
      setSelectedPhoneType(phoneTypeId || "");
      setSelectedPhoneTypes([]);
    } else {
      setSelectedPhoneType("");
      setSelectedPhoneTypes(linkedIds);
    }
    setNewPhoneTypeName("");
    setSelectedSpareColors(Array.isArray(item.colors) ? [...item.colors] : []);
    setPricedOptionRows(pricedRowsFromApi(item.pricedOptions));
    setHasVariants(Boolean(item.hasVariants));
    setManageStock(Boolean(item.manageStock));
    setStock(item.stock != null ? String(item.stock) : "");
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

  function togglePartSelection(id: string) {
    setSelectedPartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllVisibleParts() {
    setSelectedPartIds((prev) => {
      const merged = new Set(prev);
      for (const part of parts) merged.add(part._id);
      return [...merged];
    });
  }

  function clearSelectedParts() {
    setSelectedPartIds([]);
  }

  function toggleSelectionMode() {
    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedPartIds([]);
      }
      return next;
    });
  }

  async function handleBulkDeleteParts() {
    if (selectedPartIds.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    setBulkDeleting(true);
    setMessage(null);
    try {
      const idsToDelete = [...selectedPartIds];
      const res = await fetch(`${API_URL}/api/spare-parts/bulk-delete`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل حذف المنتجات المحددة" });
        return;
      }

      const deletedSet = new Set(idsToDelete);
      setParts((prev) => prev.filter((part) => !deletedSet.has(part._id)));
      setSelectedPartIds((prev) => prev.filter((id) => !deletedSet.has(id)));
      setTotalParts((prev) => Math.max(0, prev - Number(data.deletedCount || 0)));
      setBulkDeleteOpen(false);
      setMessage({
        type: "success",
        text: `تم حذف ${Number(data.deletedCount || 0)} منتج بنجاح${
          data.missingCount ? ` (غير موجود: ${data.missingCount})` : ""
        }`,
      });
      await fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم أثناء الحذف الجماعي" });
    } finally {
      setBulkDeleting(false);
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
    setImportArchiveId(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/spare-parts/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "فشل الاستيراد" });
        if (data.report) {
          setImportReport(importReportFromArchive(data.report));
          setImportOpen(false);
          setImportFile(null);
        }
        return;
      }

      const archiveId = typeof data.archiveId === "string" ? data.archiveId : "";
      if (!archiveId) {
        setMessage({ type: "error", text: "لم يُرجَع معرّف عملية الاستيراد" });
        return;
      }

      setMessage({
        type: "success",
        text: data.message || "جاري معالجة الملف في الخلفية…",
      });
      setArchivePage(1);
      void fetchImportArchives(1);

      const finalArchive = await pollImportArchive(archiveId, token);
      if (!finalArchive) {
        setMessage({
          type: "error",
          text: "ما زالت المعالجة جارية. تابع الحالة من أرشيف الرفع أدناه.",
        });
        setImportFile(null);
        setImportOpen(false);
        return;
      }

      const report = importReportFromArchive(finalArchive.report);
      setImportReport(report);
      setImportArchiveId(archiveId);

      if (finalArchive.status === "success" || finalArchive.status === "partial") {
        let doneText = `تم انتهاء الاستيراد — ${report.createdProducts} منتج جديد`;
        if ((report.createdPhones ?? 0) > 0) {
          doneText += ` — ${report.createdPhones} هاتف أُنشئ تلقائياً من Modèle`;
        }
        if (report.phonesNotFound > 0) {
          doneText += `. لم يُعثر على ${report.phonesNotFound} هاتف في القاعدة — راجع التقرير أدناه`;
        }
        setMessage({
          type: report.phonesNotFound > 0 ? "error" : "success",
          text: doneText,
        });
        fetchParts(brandFilter || undefined, currentPage, debouncedSearch);
      } else {
        const errText = report.errors[0]?.reason || "فشل الاستيراد";
        setMessage({ type: "error", text: errText });
      }

      setArchivePage(1);
      fetchImportArchives(1);
      setImportFile(null);
      setImportOpen(false);
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
  };

  const clearImportReport = () => {
    setImportReport(null);
    setImportArchiveId(null);
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
    <div className="mx-auto w-full max-w-[1600px] space-y-4">
      <AdminPageHeader
        className="mb-0 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        title="قطع الغيار"
        description="إنشاء وتعديل القطع من نافذة منبثقة؛ لا حاجة لإعادة تحميل القائمة بعد الحفظ."
        icon={<Package className="h-5 w-5" />}
        actions={
          <>
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus className="h-4 w-4" />}
              onClick={openCreatePartModal}
            >
              إنشاء قطعة غيار
            </AdminButton>
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

      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          {message.text}
        </div>
      )}

      <AdminModal
        open={importOpen}
        onClose={closeImportModal}
        title="استيراد قطع الغيار من Excel"
        description="الملفات المدعومة: .xlsx, .xls, .csv — حتى 5000 سطر بيانات (غير فارغ) و25 ميجابايت. المعالجة تتم في الخلفية ويمكن متابعتها من أرشيف الرفع."
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
              {importing ? "جاري المعالجة…" : "استيراد"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {importReport && (
        <div className="max-h-[30vh] min-h-0 shrink-0 overflow-y-auto overscroll-contain rounded-2xl border border-transparent xl:max-h-[22vh]">
        <AdminCard
          title="تقرير نتائج استيراد ملف الإكسيل"
          icon={<FileSpreadsheet className="h-5 w-5 text-indigo-600" />}
          actions={
            <div className="flex gap-2">
              {importArchiveId && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  loading={importReportDownloading}
                  disabled={importReportDownloading}
                  onClick={() => void downloadImportReportExcel(importArchiveId)}
                >
                  <Download className="h-4 w-4" /> تحميل تقرير Excel
                </AdminButton>
              )}
              <AdminButton variant="ghost" size="sm" onClick={clearImportReport}>
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
            {(importReport.createdPhones ?? 0) > 0 ? (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-5 text-center shadow-sm">
               <div className="text-sky-600 text-3xl font-bold">{importReport.createdPhones}</div>
               <div className="text-sky-900 text-sm mt-2 font-medium">هواتف أُنشئت تلقائياً من Modèle</div>
               {(importReport.createdPhoneImages ?? 0) > 0 ? (
                 <div className="text-sky-700 text-xs mt-1">
                   {importReport.createdPhoneImages} صورة هاتف جُلبت
                 </div>
               ) : null}
            </div>
            ) : null}
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
              className={`bg-rose-50 border border-rose-200 rounded-lg p-5 text-center shadow-sm cursor-pointer transition-all hover:bg-rose-100 active:scale-95 ${importReport.phonesNotFound > 0 ? 'ring-2 ring-rose-400 ring-offset-2' : ''}`}
              onClick={() => importReport.phonesNotFound > 0 && setShowPhonesModal(true)}
              title={importReport.phonesNotFound > 0 ? "اضغط لعرض الهواتف غير الموجودة" : ""}
            >
               <div className="text-rose-600 text-3xl font-bold">{importReport.phonesNotFound}</div>
               <div className="text-rose-800 text-sm mt-2 font-medium">هواتف غير موجودة</div>
               {importReport.phonesNotFound > 0 && (
                 <div className="text-rose-500 text-[10px] mt-1 font-bold animate-pulse">اضغط للتفاصيل</div>
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
            {(importReport.createdWithoutImage ?? 0) > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-5 text-center shadow-sm col-span-2 lg:col-span-7">
               <div className="text-violet-600 text-3xl font-bold">{importReport.createdWithoutImage}</div>
               <div className="text-violet-900 text-sm mt-2 font-medium">منتجات جديدة محفوظة بدون صورة (فشل Serper/Cloudinary)</div>
            </div>
            )}
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
        </div>
      )}

      <AdminCard
        title="أرشيف الرفع"
        description={`إجمالي العمليات: ${archivesLoading ? "—" : archiveTotal}`}
        icon={<FileSpreadsheet className="h-5 w-5 text-emerald-600" />}
      >
        <div className="space-y-3">
          {archivesLoading ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              جارٍ تحميل أرشيف الرفع...
            </div>
          ) : archives.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              لا توجد عمليات رفع محفوظة بعد.
            </div>
          ) : (
            archives.map((archive) => (
              <div
                key={archive._id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-800">{archive.fileName}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(archive.createdAt)} •
                      {" "}أنشئ {Number(archive.report?.createdProducts || 0)} منتج
                      {" "}• {archive.uploadedByAdminEmail || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${archiveStatusBadge(
                        archive.status
                      )}`}
                    >
                      {archiveStatusLabel(archive.status)}
                    </span>
                    <AdminButton
                      size="sm"
                      variant="outline"
                      icon={<Download className="h-4 w-4" />}
                      disabled={archive.status === "processing" || importReportDownloading}
                      onClick={() => void downloadImportReportExcel(archive._id)}
                    >
                      تقرير Excel
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="outline"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => void openArchiveDetails(archive)}
                    >
                      عرض المنتجات المرفوعة
                    </AdminButton>
                  </div>
                </div>
              </div>
            ))
          )}
          {archiveTotalPages > 1 && (
            <AdminPagination
              page={archivePage}
              totalPages={archiveTotalPages}
              onPageChange={setArchivePage}
              totalItems={archiveTotal}
              pageSize={8}
            />
          )}
        </div>
      </AdminCard>

      <AdminModal
        open={partModalOpen}
        onClose={closePartModal}
        size="md"
        frameClassName="!p-3"
        panelClassName="!max-w-[min(26rem,calc(100vw-1.75rem))] !w-full sm:!max-w-[min(32rem,calc(100vw-1.75rem))] lg:!max-w-[min(44rem,calc(100vw-1.75rem))] max-h-[min(92dvh,720px)]"
        headerDense
        bodyScroll={true}
        closeOnBackdrop={!savingPart && !uploadingImages}
        disableClose={savingPart || uploadingImages}
        icon={<Package className="h-4 w-4 text-emerald-600 sm:h-[18px] sm:w-[18px]" />}
        title={
          excelOriginEdit
            ? "تعديل قطعة (استيراد Excel)"
            : editing
              ? "تعديل قطعة الغيار"
              : copySnapshot
                ? "قطعة جديدة من نسخة"
                : "إنشاء قطعة غيار"
        }
        description={
          copySnapshot && !editing
            ? "عدّل حقلًا ثم احفظ."
            : excelOriginEdit
              ? "ماركة + موديل مطلوبان."
              : "إلزامي: الاسم فقط."
        }
        contentClassName="!px-3 !py-2 sm:!px-3.5 sm:!py-2.5"
      >
        {partModalNotice && (
          <div
            className={`mb-1.5 flex shrink-0 items-start gap-1.5 rounded-md border px-2 py-1 text-[10px] leading-snug ${
              partModalNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {partModalNotice.type === "success" ? (
              <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            )}
            {partModalNotice.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="space-y-2">
            {excelOriginEdit ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="min-w-0">
                  <label className={lbl}>الماركة</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedPhoneType("");
                      setSelectedPhoneTypes([]);
                      setNewPhoneTypeName("");
                    }}
                    className="admin-select !h-7 !py-0.5 w-full rounded-md px-2 text-[11px]"
                  >
                    <option value="">اختر الماركة</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={lbl}>الموديل</label>
                  <select
                    value={selectedPhoneType}
                    onChange={(e) => setSelectedPhoneType(e.target.value)}
                    disabled={!selectedBrand}
                    className="admin-select !h-7 !py-0.5 w-full rounded-md px-2 text-[11px] disabled:opacity-50"
                  >
                    <option value="">
                      {selectedBrand ? "اختر الهاتف" : "ماركة أولاً"}
                    </option>
                    {phoneTypes.map((pt) => (
                      <option key={pt._id} value={pt._id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={lbl}>موديل بالاسم</label>
                  <input
                    type="text"
                    value={newPhoneTypeName}
                    onChange={(e) => setNewPhoneTypeName(e.target.value)}
                    disabled={!selectedBrand}
                    className={fld}
                    placeholder="إن لم يكن في القائمة"
                    dir="auto"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className={lbl} htmlFor="spare-part-name">
                اسم القطعة <span className="text-rose-600">*</span>
              </label>
              <input
                id="spare-part-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fld}
                placeholder="مثلاً شاشة لمس OEM"
                autoComplete="off"
              />
            </div>

            <div>
              <label className={lbl} htmlFor="spare-part-details">
                الوصف
              </label>
              <textarea
                id="spare-part-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                className={`${fld} !h-[3.25rem] resize-none py-1.5 leading-snug`}
                placeholder="موجز للمعروض في المتجر"
              />
            </div>

            {!excelOriginEdit ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:items-start">
                <div className="min-w-0 space-y-1">
                  <label className={lbl}>الماركة (اختياري)</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedPhoneType("");
                      setSelectedPhoneTypes([]);
                      setNewPhoneTypeName("");
                    }}
                    className="admin-select !h-7 !py-0.5 w-full rounded-md px-2 text-[11px]"
                  >
                    <option value="">—</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={lbl}>الموديلات</label>
                  <AdminSparePartModelPicker
                    brandSelected={!!selectedBrand}
                    phoneTypes={phoneTypes}
                    selectedIds={selectedPhoneTypes}
                    onChangeIds={setSelectedPhoneTypes}
                    newModelName={newPhoneTypeName}
                    onNewModelNameChange={setNewPhoneTypeName}
                    blockedNewBecauseSelection={selectedPhoneTypes.length > 0}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-1.5">
              <div className="min-w-0">
                <label className={lbl}>تجزئة</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={priceRetail}
                  onChange={(e) => setPriceRetail(e.target.value)}
                  className={fldNum}
                  placeholder="دج"
                />
              </div>
              <div className="min-w-0">
                <label className={lbl}>جملة</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={priceWholesale}
                  onChange={(e) => setPriceWholesale(e.target.value)}
                  className={fldNum}
                  placeholder="دج"
                />
              </div>
              <div className="min-w-0">
                <label className={lbl}>تاجر أو صاحب محل</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={priceReparateur}
                  onChange={(e) => setPriceReparateur(e.target.value)}
                  className={fldNum}
                  placeholder="دج"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={manageStock}
                  onChange={(e) => setManageStock(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                تفعيل إدارة المخزون
              </label>
              {manageStock ? (
                <div className="mt-2 max-w-[220px]">
                  <label className={lbl}>الكمية في المخزون</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className={fldNum}
                    placeholder="0"
                  />
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-2">
              <label className={lbl}>رابط الصورة الرئيسية</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={fld}
                placeholder="https://…"
                dir="ltr"
              />
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <div className="min-w-0">
                  <label className={`${lbl} truncate`}>رفع رئيسية</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-sky-50 file:px-1.5 file:text-[10px] file:text-sky-800"
                    onChange={async (e) => {
                      setPartModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const urls = await uploadImages(e.target.files);
                        if (urls[0]) {
                          setImage(urls[0]);
                          setPartModalNotice({
                            type: "success",
                            text: "تم رفع الصورة الرئيسية",
                          });
                        }
                      } catch (err) {
                        setPartModalNotice({
                          type: "error",
                          text:
                            err instanceof Error ? err.message : "فشل رفع الصورة",
                        });
                      } finally {
                        setUploadingImages(false);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <label className={`${lbl} truncate`}>رفع حتى ٤</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-slate-50 file:px-1.5 file:text-[10px]"
                    onChange={async (e) => {
                      setPartModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const uploaded = await uploadImages(e.target.files);
                        if (uploaded.length > 0) {
                          const merged = [...parseExtraImages(), ...uploaded].slice(0, 4);
                          setExtraImagesText(merged.join("\n"));
                          setPartModalNotice({
                            type: "success",
                            text: `تم رفع ${uploaded.length} صورة إضافية`,
                          });
                        }
                      } catch (err) {
                        setPartModalNotice({
                          type: "error",
                          text:
                            err instanceof Error ? err.message : "فشل رفع الصور",
                        });
                      } finally {
                        setUploadingImages(false);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-1.5">
                <label className={lbl}>روابط إضافية (٤)</label>
                <textarea
                  value={extraImagesText}
                  onChange={(e) => setExtraImagesText(e.target.value)}
                  rows={2}
                  className={`${fld} !min-h-[2.25rem] resize-none py-1.5 leading-snug`}
                  placeholder="سطر أو فاصلة"
                  dir="ltr"
                />
              </div>
              <div className="mt-2 border-t border-slate-100 pt-1.5">
                <label className={`${lbl} mb-1`}>ألوان الاختيار</label>
                <AdminProductColorsPicker
                  variant="compact"
                  value={selectedSpareColors}
                  onChange={setSelectedSpareColors}
                />
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <label className="mb-2 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-[11px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    تفعيل تعدد الخيارات (Variants): الزبون يختار عدة خيارات مع تحديد الكمية لكل واحد في المتجر.
                    بدون التفعيل تبقى الخيارات أقراص اختيار واحدة كما سابقاً.
                  </span>
                </label>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className={lbl}>
                    خيارات المنتج (اسم + تجزئة / جملة / تاجر أو صاحب محل)
                  </label>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPricedOptionRows((prev) => [
                        ...prev,
                        createEmptyPricedOptionRow({
                          retailPrice: priceRetail,
                          wholesalePrice: priceWholesale,
                          repairPrice: priceReparateur,
                        }),
                      ])
                    }
                    icon={<Plus className="h-3.5 w-3.5" />}
                  >
                    إضافة خيار
                  </AdminButton>
                </div>
                {pricedOptionRows.length === 0 ? (
                  <p className="text-[10px] text-slate-500">
                    اختياري: مثال شاشة OLED / Incell بأسعار مختلفة لكل نوع زبون.
                  </p>
                ) : (
                  <div className="max-h-[220px] space-y-2 overflow-y-auto pe-0.5">
                    {pricedOptionRows.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/80 p-2"
                      >
                        <div className="mb-1.5 flex items-center gap-1">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) =>
                              setPricedOptionRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, label: e.target.value } : r
                                )
                              )
                            }
                            className={`${fld} min-w-0 flex-1`}
                            placeholder="اسم الخيار"
                          />
                          <AdminButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="shrink-0 hover:bg-rose-50 hover:text-rose-600"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() =>
                              setPricedOptionRows((prev) => prev.filter((r) => r.id !== row.id))
                            }
                            title="حذف الخيار"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <span className={lbl}>تجزئة</span>
                            <input
                              type="number"
                              min={1}
                              step="1"
                              inputMode="numeric"
                              value={row.retailPrice}
                              onChange={(e) =>
                                setPricedOptionRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, retailPrice: e.target.value } : r
                                  )
                                )
                              }
                              className={fldNum}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <span className={lbl}>جملة</span>
                            <input
                              type="number"
                              min={1}
                              step="1"
                              inputMode="numeric"
                              value={row.wholesalePrice}
                              onChange={(e) =>
                                setPricedOptionRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, wholesalePrice: e.target.value }
                                      : r
                                  )
                                )
                              }
                              className={fldNum}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <span className={lbl}>تاجر أو صاحب محل</span>
                            <input
                              type="number"
                              min={1}
                              step="1"
                              inputMode="numeric"
                              value={row.repairPrice}
                              onChange={(e) =>
                                setPricedOptionRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, repairPrice: e.target.value } : r
                                  )
                                )
                              }
                              className={fldNum}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <span className={lbl}>المخزون</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              inputMode="numeric"
                              value={row.stock}
                              onChange={(e) =>
                                setPricedOptionRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, stock: e.target.value } : r
                                  )
                                )
                              }
                              className={fldNum}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 flex shrink-0 flex-wrap items-center justify-end gap-1.5 border-t border-slate-100/90 pt-2">
            <AdminButton
              type="button"
              variant="outline"
              onClick={closePartModal}
              disabled={savingPart || uploadingImages}
              size="sm"
            >
              إغلاق
            </AdminButton>
            <AdminButton
              type="submit"
              variant="success"
              disabled={uploadingImages}
              loading={savingPart}
              className="min-w-[100px]"
              size="sm"
            >
              {uploadingImages ? "رفع الصور…" : "حفظ"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminCard
        headerClassName="!py-3"
        className="flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden xl:min-h-0"
        title="قائمة قطع الغيار"
        description={`المجموع: ${loading ? "—" : totalParts.toLocaleString()} قطعة`}
        icon={<Package className="h-5 w-5" />}
        contentClassName="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4 sm:p-4"
      >
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label className="shrink-0 text-xs font-medium text-slate-600 sm:block sm:w-24" htmlFor="spare-parts-search">
            بحث سريع
          </label>
          <div className="relative min-w-0 flex-1 max-w-xl">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="spare-parts-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-input w-full py-2 ps-3 pe-9 text-sm"
              placeholder="اسم، ماركة، موديل، وصف، نوع…"
              autoComplete="off"
            />
          </div>
          <span className="hidden text-[11px] text-slate-400 xl:inline">التمرير داخل الجدول فقط</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton
            variant={selectionMode ? "outline" : "primary"}
            size="sm"
            onClick={toggleSelectionMode}
          >
            {selectionMode ? "إلغاء وضع التحديد" : "تفعيل التحديد"}
          </AdminButton>
          {selectionMode && (
            <>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={selectAllVisibleParts}
                disabled={parts.length === 0}
              >
                تحديد الكل (المعروض)
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={clearSelectedParts}
                disabled={selectedPartIds.length === 0}
              >
                إلغاء التحديد
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={selectedPartIds.length === 0}
                loading={bulkDeleting}
              >
                حذف المحدد
              </AdminButton>
              <span className="text-xs font-medium text-slate-600">
                تم تحديد {selectedPartIds.length} منتج
              </span>
            </>
          )}
        </div>
        <div className="min-h-[200px] min-w-0 flex-1 overflow-auto rounded-xl border border-slate-200/90 bg-white shadow-inner">
          <div className="min-w-max sm:min-w-0">
        <AdminTable
          columns={[
            ...(selectionMode ? [{ key: "select", label: "" }] : []),
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "priceRetail", label: "سعر التجزئة" },
            { key: "priceWholesale", label: "سعر الجملة" },
            { key: "priceReparateur", label: "سعر التاجر أو صاحب المحل" },
            { key: "colors", label: "الألوان" },
            { key: "brand", label: "الماركة" },
            { key: "phone", label: "الهاتف" },
            { key: "stock", label: "المخزون" },
            { key: "actions", label: "إجراءات", className: "w-24" },
          ]}
          rows={parts.map((p: SparePart) => ({
            _id: p._id,
            ...(selectionMode
              ? {
                  select: (
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedPartIds.includes(p._id)}
                        onChange={() => togglePartSelection(p._id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                  ),
                }
              : {}),
            image: <AdminTableCellImage src={p.image} alt={getAdminDisplayName(p)} />,
            name: <span className="font-medium text-slate-800">{getAdminDisplayName(p)}</span>,
            priceRetail: (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={getInlineDraft(p).priceRetail}
                  onChange={(e) => setInlineDraftValue(p, "priceRetail", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveInlinePrices(p);
                    }
                  }}
                  className="admin-input h-8 w-24 px-2 py-1 text-xs"
                />
              </div>
            ),
            priceWholesale: (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={getInlineDraft(p).priceWholesale}
                  onChange={(e) => setInlineDraftValue(p, "priceWholesale", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveInlinePrices(p);
                    }
                  }}
                  className="admin-input h-8 w-24 px-2 py-1 text-xs"
                />
              </div>
            ),
            priceReparateur: (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={getInlineDraft(p).priceReparateur}
                  onChange={(e) => setInlineDraftValue(p, "priceReparateur", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveInlinePrices(p);
                    }
                  }}
                  className="admin-input h-8 w-24 px-2 py-1 text-xs"
                />
              </div>
            ),
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
            brand: <span className="text-slate-600">{getBrandName(p)}</span>,
            phone: <span className="text-slate-600">{getPhoneTypeName(p)}</span>,
            stock: (
              <span className={`text-xs font-semibold ${
                !p.manageStock
                  ? "text-slate-400"
                  : Number(p.stock || 0) <= 0
                    ? "text-rose-600"
                    : Number(p.stock || 0) <= 1
                      ? "text-amber-600"
                      : "text-emerald-700"
              }`}>
                {!p.manageStock
                  ? "غير مُفعّل"
                  : Number(p.stock || 0) <= 0
                    ? "نفذ المخزون"
                    : Number(p.stock || 0) <= 1
                      ? "آخر قطعة"
                      : `متوفر (${Number(p.stock || 0)})`}
              </span>
            ),
            actions: (
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => void saveInlinePrices(p)}
                  loading={!!inlineSavingIds[p._id]}
                  disabled={!!inlineSavingIds[p._id]}
                  title="حفظ الأسعار بسرعة"
                >
                  حفظ
                </AdminButton>
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
                  onClick={() => openEditPartModal(p)}
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
          </div>
        </div>
        {totalPages > 1 && (
          <div className="shrink-0 border-t border-slate-200 pt-3">
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
        open={bulkDeleteOpen}
        onClose={() => !bulkDeleting && setBulkDeleteOpen(false)}
        title="تأكيد الحذف الجماعي"
        description="سيتم حذف المنتجات المحددة نهائياً."
        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            هل أنت متأكد من حذف {selectedPartIds.length} منتج؟
            <br />
            لا يمكن التراجع عن هذه العملية.
          </p>
          <div className="flex gap-2">
            <AdminButton
              variant="outline"
              className="flex-1"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkDeleting}
            >
              إلغاء
            </AdminButton>
            <AdminButton
              variant="danger"
              className="flex-1"
              onClick={handleBulkDeleteParts}
              loading={bulkDeleting}
              disabled={bulkDeleting || selectedPartIds.length === 0}
            >
              حذف المحدد
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={showPhonesModal}
        onClose={() => setShowPhonesModal(false)}
        title="هواتف غير موجودة في قاعدة البيانات"
        description="هذه الموديلات لم تُعثر عليها أثناء الاستيراد — أضفها يدوياً ثم أعد رفع الملف."
        icon={<Package className="h-5 w-5 text-rose-600" />}
        size="md"
      >
        <div className="max-h-[400px] overflow-y-auto w-full custom-scrollbar pr-1">
          <div className="grid gap-2">
            {importReport?.phonesNotFoundList?.map((phone, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
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

      <AdminModal
        open={archiveDetailsOpen}
        onClose={() => {
          if (archiveDeleting) return;
          setArchiveDetailsOpen(false);
          setSelectedArchive(null);
          setArchiveProducts([]);
        }}
        title="تفاصيل المنتجات المرفوعة"
        description={selectedArchive ? `الملف: ${selectedArchive.fileName}` : ""}
        icon={<FileSpreadsheet className="h-5 w-5 text-emerald-600" />}
        size="lg"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            {selectedArchive && selectedArchive.status !== "processing" ? (
              <AdminButton
                variant="outline"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                disabled={importReportDownloading}
                loading={importReportDownloading}
                onClick={() => void downloadImportReportExcel(selectedArchive._id)}
              >
                تحميل تقرير Excel
              </AdminButton>
            ) : null}
            <AdminButton
              variant="danger"
              size="sm"
              disabled={!selectedArchive || archiveDeleting || archiveProductsTotal === 0}
              loading={archiveDeleting && archiveConfirm?.mode === "all"}
              onClick={() =>
                selectedArchive &&
                setArchiveConfirm({
                  mode: "all",
                  archiveId: selectedArchive._id,
                })
              }
            >
              حذف جميع المنتجات
            </AdminButton>
          </div>
          <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-2">الصورة</th>
                  <th className="px-3 py-2">المنتج</th>
                  <th className="px-3 py-2">السعر</th>
                  <th className="px-3 py-2">الهاتف</th>
                  <th className="px-3 py-2">تاريخ الإنشاء</th>
                  <th className="px-3 py-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {archiveProductsLoading ? (
                  <tr>
                    <td className="px-3 py-5 text-center text-slate-500" colSpan={6}>
                      جارٍ تحميل المنتجات...
                    </td>
                  </tr>
                ) : archiveProducts.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-center text-slate-500" colSpan={6}>
                      لا توجد منتجات مرتبطة بهذه العملية.
                    </td>
                  </tr>
                ) : (
                  archiveProducts.map((product) => (
                    <tr key={product._id} className="border-b border-slate-100">
                      <td className="px-3 py-2">
                        <AdminTableCellImage src={product.image} alt={product.name} />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{product.name}</td>
                      <td className="px-3 py-2">{Number(product.priceRetail ?? product.price ?? 0)} دج</td>
                      <td className="px-3 py-2">
                        {typeof product.phoneType === "object"
                          ? product.phoneType?.name || "—"
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {formatDateTime(product.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          className="hover:bg-rose-50 hover:text-rose-600"
                          onClick={() =>
                            selectedArchive &&
                            setArchiveConfirm({
                              mode: "single",
                              archiveId: selectedArchive._id,
                              productId: product._id,
                              productName: product.name,
                            })
                          }
                        >
                          حذف
                        </AdminButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {archiveProductsTotalPages > 1 && selectedArchive && (
            <AdminPagination
              page={archiveProductsPage}
              totalPages={archiveProductsTotalPages}
              onPageChange={setArchiveProductsPage}
              totalItems={archiveProductsTotal}
              pageSize={10}
            />
          )}
        </div>
      </AdminModal>

      <AdminModal
        open={!!archiveConfirm}
        onClose={() => !archiveDeleting && setArchiveConfirm(null)}
        title="تأكيد الحذف"
        description="لن يمكن التراجع بعد تنفيذ العملية."
        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            {archiveConfirm?.mode === "all"
              ? "هل تريد حذف جميع المنتجات المرتبطة بعملية الرفع هذه؟"
              : `هل تريد حذف المنتج "${archiveConfirm?.productName || ""}" من هذه العملية؟`}
          </p>
          <div className="flex gap-2">
            <AdminButton
              variant="outline"
              className="flex-1"
              disabled={archiveDeleting}
              onClick={() => setArchiveConfirm(null)}
            >
              إلغاء
            </AdminButton>
            <AdminButton
              variant="danger"
              className="flex-1"
              loading={archiveDeleting}
              disabled={archiveDeleting}
              onClick={executeArchiveDelete}
            >
              تأكيد الحذف
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
