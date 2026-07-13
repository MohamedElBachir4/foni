"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, ImagePlus, Search } from "lucide-react";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import { uploadProductImages } from "@/lib/adminProductMedia";
import { getProductImageUrl } from "@/lib/productImage";
import { AdminButton } from "./AdminButton";
import { AdminModal } from "./AdminModal";

const SEARCH_LIMIT = 50;

type BulkAssignPart = {
  _id: string;
  name: string;
  supplier?: string;
  image?: string;
  imageUrl?: string;
  brand?: { _id?: string; name?: string } | string | null;
  phoneType?: { _id?: string; name?: string } | string | null;
  phoneTypes?: Array<{ _id?: string; name?: string } | string> | null;
};

type BulkAssignSparePartImageModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedCount: number) => void;
};

function brandName(part: BulkAssignPart): string {
  const b = part.brand;
  if (b && typeof b === "object" && b.name) return b.name;
  return "—";
}

function phoneNames(part: BulkAssignPart): string {
  const names: string[] = [];
  if (Array.isArray(part.phoneTypes)) {
    for (const pt of part.phoneTypes) {
      if (pt && typeof pt === "object" && pt.name) names.push(pt.name);
    }
  }
  if (names.length > 0) return [...new Set(names)].join("، ");
  const pt = part.phoneType;
  if (pt && typeof pt === "object" && pt.name) return pt.name;
  return "—";
}

function displayName(part: BulkAssignPart): string {
  const base = String(part.name || "").trim();
  const supplier = String(part.supplier || "").trim();
  return supplier ? `${base} ${supplier}`.trim() : base;
}

export function BulkAssignSparePartImageModal({
  open,
  onClose,
  onSuccess,
}: BulkAssignSparePartImageModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<BulkAssignPart[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;
    setImageFile(null);
    setPreviewUrl("");
    setSearchInput("");
    setDebouncedSearch("");
    setResults([]);
    setSelectedIds([]);
    setConfirmOpen(false);
    setApplying(false);
    setNotice(null);
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchResults = useCallback(async (searchTerm: string) => {
    setSearching(true);
    try {
      let query = `?page=1&limit=${SEARCH_LIMIT}`;
      if (searchTerm) {
        const encoded = encodeURIComponent(searchTerm);
        query += `&search=${encoded}&q=${encoded}`;
      }
      const primaryUrl = getToken()
        ? `${API_URL}/api/spare-parts/_admin/list${query}`
        : `${API_URL}/api/spare-parts${query}`;
      const fallbackUrl = getToken() ? `${API_URL}/api/admin/spare-parts${query}` : null;

      let res = await fetch(primaryUrl, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok && res.status === 404 && fallbackUrl) {
        res = await fetch(fallbackUrl, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
      }
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = await res.json();
      const list = data.parts ?? (Array.isArray(data) ? data : []);
      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchResults(debouncedSearch);
  }, [open, debouncedSearch, fetchResults]);

  function handleFileChange(file: File | null) {
    setNotice(null);
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "يرجى اختيار ملف صورة صالح" });
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function toggleId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      for (const part of results) merged.add(part._id);
      return [...merged];
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function requestApply() {
    setNotice(null);
    if (!imageFile) {
      setNotice({ type: "error", text: "اختر صورة أولاً" });
      return;
    }
    if (selectedIds.length === 0) {
      setNotice({ type: "error", text: "حدد منتجاً واحداً على الأقل" });
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmApply() {
    if (!imageFile || selectedIds.length === 0) {
      setConfirmOpen(false);
      return;
    }
    setApplying(true);
    setNotice(null);
    try {
      const transfer = new DataTransfer();
      transfer.items.add(imageFile);
      const urls = await uploadProductImages(transfer.files);
      const imageUrl = urls[0];
      if (!imageUrl) {
        setNotice({ type: "error", text: "فشل رفع الصورة" });
        setConfirmOpen(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/spare-parts/bulk-update-image`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds, image: imageUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error || "فشل تعيين الصورة للمنتجات" });
        setConfirmOpen(false);
        return;
      }

      const updatedCount = Number(data.updatedCount || selectedIds.length);
      setConfirmOpen(false);
      onSuccess(updatedCount);
      onClose();
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "تعذر الاتصال بالخادم",
      });
      setConfirmOpen(false);
    } finally {
      setApplying(false);
    }
  }

  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    results.length > 0 && results.every((p) => selectedIds.includes(p._id));

  return (
    <>
      <AdminModal
        open={open}
        onClose={onClose}
        title="تعيين صورة لعدة منتجات"
        description="ارفع صورة واحدة ثم اختر المنتجات التي تريد تطبيقها عليها. لا يتم تعديل أي بيانات أخرى."
        icon={<ImagePlus className="h-5 w-5" />}
        size="xl"
        closeOnBackdrop={!applying}
        disableClose={applying}
        contentClassName="space-y-4"
      >
        {notice && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {notice.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">رفع الصورة</label>
            <input
              type="file"
              accept="image/*"
              disabled={applying}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="admin-input file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sky-700"
            />
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="معاينة الصورة"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">معاينة الصورة قبل الحفظ</span>
              )}
            </div>
            {imageFile && (
              <p className="truncate text-[11px] text-slate-500" title={imageFile.name}>
                {imageFile.name}
              </p>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="bulk-image-search">
              البحث عن المنتجات
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="bulk-image-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={applying}
                className="admin-input w-full py-2 ps-3 pe-9 text-sm"
                placeholder="اسم المنتج، اسم الهاتف، الماركة، الموديل…"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                disabled={applying || results.length === 0 || allVisibleSelected}
              >
                تحديد الكل (المعروض)
              </AdminButton>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={applying || selectedCount === 0}
              >
                إلغاء التحديد
              </AdminButton>
              <span className="text-xs font-medium text-slate-600">
                تم تحديد {selectedCount} منتج
              </span>
              {searching && <span className="text-[11px] text-slate-400">جاري البحث…</span>}
            </div>

            <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200 bg-white">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  {searching ? "جاري البحث…" : "لا توجد نتائج"}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {results.map((part) => {
                    const checked = selectedIds.includes(part._id);
                    const thumb = part.image || part.imageUrl;
                    return (
                      <li key={part._id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={applying}
                            onChange={() => toggleId(part._id)}
                            className="h-4 w-4 shrink-0 rounded border-slate-300"
                          />
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getProductImageUrl(thumb)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-slate-300">
                                —
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-slate-800">
                              {displayName(part)}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {brandName(part)} · {phoneNames(part)}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            سيتم استبدال الصورة الحالية للمنتجات المحددة فقط.
          </p>
          <div className="flex gap-2">
            <AdminButton type="button" variant="outline" onClick={onClose} disabled={applying}>
              إغلاق
            </AdminButton>
            <AdminButton
              type="button"
              variant="success"
              onClick={requestApply}
              disabled={applying || !imageFile || selectedCount === 0}
              loading={applying}
            >
              تطبيق الصورة ({selectedCount})
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={confirmOpen}
        onClose={() => {
          if (!applying) setConfirmOpen(false);
        }}
        title="تأكيد استبدال الصور"
        size="sm"
        closeOnBackdrop={!applying}
        disableClose={applying}
      >
        <p className="text-sm text-slate-700">
          سيتم استبدال صورة ({selectedCount}) منتجاً بالصورة الجديدة، هل تريد المتابعة؟
        </p>
        <div className="mt-4 flex gap-2">
          <AdminButton
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmOpen(false)}
            disabled={applying}
          >
            إلغاء
          </AdminButton>
          <AdminButton
            type="button"
            variant="success"
            className="flex-1"
            onClick={() => void confirmApply()}
            loading={applying}
            disabled={applying}
          >
            متابعة
          </AdminButton>
        </div>
      </AdminModal>
    </>
  );
}
