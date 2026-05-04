"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAuthHeaders, API_URL, getToken } from "@/lib/adminAuth";
import {
  AdminButton,
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminProductColorsPicker,
  AdminTable,
  AdminTableCellImage,
} from "@/components/admin";
import { getProductColorHex } from "@/lib/productColors";
import {
  ADMIN_COPY_UNCHANGED_MESSAGE,
  buildPhoneCreateComparePayload,
  snapshotCreatePayload,
  snapshotFromPhoneForCopy,
} from "@/lib/adminCopyProduct";
import {
  createEmptyPricedOptionRow,
  pricedRowsFromApi,
  validatePricedOptionRows,
  type PricedOptionFormRow,
  type PricedOptionCompare,
} from "@/lib/adminPricedOptionsForm";
import {
  Smartphone,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Plus,
} from "lucide-react";

type Brand = { _id: string; name: string; slug?: string };
type Phone = {
  _id: string;
  name: string;
  brand: Brand | string;
  image?: string;
  extraImages?: string[];
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  details?: string;
  stock?: number;
  colors?: string[];
  options?: string[];
  pricedOptions?: PricedOptionCompare[];
};

const fld =
  "admin-input !h-7 !rounded-md !px-2 !py-1 text-[11px] text-slate-800 placeholder:text-slate-400";
const fldNum = `${fld} font-mono tabular-nums`;
const lbl = "mb-0.5 block text-[10px] font-medium text-slate-500";

export default function CreatePhonePage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneName, setPhoneName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [image, setImage] = useState("");
  const [extraImagesText, setExtraImagesText] = useState("");
  const [price, setPrice] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");
  const [details, setDetails] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [pricedOptionRows, setPricedOptionRows] = useState<PricedOptionFormRow[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [phoneModalNotice, setPhoneModalNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [editing, setEditing] = useState<Phone | null>(null);
  const [copySnapshot, setCopySnapshot] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/brands`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
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
    setExtraImagesText("");
    setPrice("");
    setPriceRetail("");
    setPriceWholesale("");
    setPriceReparateur("");
    setDetails("");
    setSelectedColors([]);
    setPricedOptionRows([]);
    setEditing(null);
    setCopySnapshot(null);
  }

  function closePhoneModal() {
    if (savingPhone || uploadingImages) return;
    setPhoneModalOpen(false);
    setPhoneModalNotice(null);
    resetForm();
  }

  function openCreatePhoneModal() {
    resetForm();
    setPhoneModalNotice(null);
    setPhoneModalOpen(true);
  }

  function openEditPhone(phone: Phone) {
    setPhoneModalNotice(null);
    setMessage(null);
    startEdit(phone);
    setPhoneModalOpen(true);
  }

  function openCopyPhone(phone: Phone) {
    setPhoneModalNotice(null);
    setMessage(null);
    startCopyFrom(phone);
    setPhoneModalOpen(true);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pricedValidation = validatePricedOptionRows(pricedOptionRows);
    if (!pricedValidation.ok) {
      setPhoneModalNotice({ type: "error", text: pricedValidation.text });
      return;
    }
    setPhoneModalNotice(null);
    setMessage(null);
    if (!phoneName.trim()) {
      setPhoneModalNotice({ type: "error", text: "اسم الهاتف مطلوب" });
      return;
    }
    if (!selectedBrand) {
      setPhoneModalNotice({ type: "error", text: "اختر الماركة" });
      return;
    }

    const effectivePrice =
      price.trim().length > 0
        ? Number(price)
        : priceRetail.trim().length > 0
          ? Number(priceRetail)
          : 0;

    if (!editing && copySnapshot) {
      const current = snapshotCreatePayload(
        buildPhoneCreateComparePayload({
          phoneName,
          selectedBrand,
          image,
          extraImagesText,
          price,
          priceRetail,
          priceWholesale,
          priceReparateur,
          details,
          selectedColors,
          pricedOptions: pricedValidation.data,
        })
      );
      if (current === copySnapshot) {
        setPhoneModalNotice({ type: "error", text: ADMIN_COPY_UNCHANGED_MESSAGE });
        return;
      }
    }

    const payload = {
      name: phoneName.trim(),
      brand: selectedBrand,
      image: image.trim(),
      extraImages: parseExtraImages(),
      price: effectivePrice,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      details: details.trim(),
      colors: selectedColors,
      pricedOptions: pricedValidation.data,
    };

    setSavingPhone(true);
    try {
      const isEdit = !!editing;
      const res = await fetch(
        isEdit ? `${API_URL}/api/phones/${editing._id}` : `${API_URL}/api/phones`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhoneModalOpen(false);
        resetForm();
        setMessage({
          type: "success",
          text: isEdit ? "تم تحديث الهاتف بنجاح" : "تم إنشاء الهاتف بنجاح",
        });
        await fetchPhones();
      } else {
        setPhoneModalNotice({
          type: "error",
          text: data.error || (isEdit ? "فشل التحديث" : "فشل الإنشاء"),
        });
      }
    } catch {
      setPhoneModalNotice({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSavingPhone(false);
    }
  }

  function startCopyFrom(phone: Phone) {
    setEditing(null);
    setCopySnapshot(snapshotFromPhoneForCopy(phone));
    setMessage(null);
    setPhoneName(phone.name);
    setSelectedBrand(
      typeof phone.brand === "string" ? phone.brand : phone.brand?._id || ""
    );
    setImage(phone.image || "");
    setExtraImagesText((phone.extraImages || []).join("\n"));
    setPrice(phone.price != null ? String(phone.price) : "");
    setPriceRetail(phone.priceRetail != null ? String(phone.priceRetail) : "");
    setPriceWholesale(phone.priceWholesale != null ? String(phone.priceWholesale) : "");
    setPriceReparateur(phone.priceReparateur != null ? String(phone.priceReparateur) : "");
    setDetails(phone.details || "");
    setSelectedColors(Array.isArray(phone.colors) ? [...phone.colors] : []);
    setPricedOptionRows(pricedRowsFromApi(phone.pricedOptions));
  }

  function startEdit(phone: Phone) {
    setCopySnapshot(null);
    setEditing(phone);
    setPhoneName(phone.name);
    setSelectedBrand(
      typeof phone.brand === "string" ? phone.brand : phone.brand?._id || ""
    );
    setImage(phone.image || "");
    setExtraImagesText((phone.extraImages || []).join("\n"));
    setPrice(phone.price != null ? String(phone.price) : "");
    setPriceRetail(phone.priceRetail != null ? String(phone.priceRetail) : "");
    setPriceWholesale(phone.priceWholesale != null ? String(phone.priceWholesale) : "");
    setPriceReparateur(phone.priceReparateur != null ? String(phone.priceReparateur) : "");
    setDetails(phone.details || "");
    setSelectedColors(Array.isArray(phone.colors) ? [...phone.colors] : []);
    setPricedOptionRows(pricedRowsFromApi(phone.pricedOptions));
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API_URL}/api/phones/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
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

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-8">
      <AdminPageHeader
        className="mb-0 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        title="إدارة الهواتف"
        description="إنشاء وتعديل الهاتف من نافذة منبثقة بنفس تدفّق قطع الغيار والأكسسوار."
        icon={<Smartphone className="h-5 w-5" />}
        actions={
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={openCreatePhoneModal}
          >
            إنشاء هاتف
          </AdminButton>
        }
      />

      {message ? (
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
      ) : null}

      <AdminModal
        open={phoneModalOpen}
        onClose={closePhoneModal}
        size="md"
        frameClassName="!p-3"
        panelClassName="!max-w-[min(26rem,calc(100vw-1.75rem))] !w-full sm:!max-w-[min(32rem,calc(100vw-1.75rem))] lg:!max-w-[min(44rem,calc(100vw-1.75rem))] max-h-[min(92dvh,720px)]"
        headerDense
        bodyScroll
        closeOnBackdrop={!savingPhone && !uploadingImages}
        disableClose={savingPhone || uploadingImages}
        icon={<Smartphone className="h-4 w-4 text-emerald-600 sm:h-[18px] sm:w-[18px]" />}
        title={
          editing
            ? "تعديل هاتف"
            : copySnapshot
              ? "هاتف جديد من نسخة"
              : "إنشاء هاتف"
        }
        description={
          copySnapshot && !editing ? "عدّل حقلًا ثم احفظ." : "إلزامي: الاسم والماركة."
        }
        contentClassName="!px-3 !py-2 sm:!px-3.5 sm:!py-2.5"
      >
        {phoneModalNotice ? (
          <div
            className={`mb-1.5 flex shrink-0 items-start gap-1.5 rounded-md border px-2 py-1 text-[10px] leading-snug ${
              phoneModalNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {phoneModalNotice.type === "success" ? (
              <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            )}
            {phoneModalNotice.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0 sm:col-span-2">
                <label className={lbl} htmlFor="phone-name">
                  اسم الهاتف <span className="text-rose-600">*</span>
                </label>
                <input
                  id="phone-name"
                  type="text"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  className={fld}
                  placeholder="مثال: Apple iPhone 15 Pro Max 256GB"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-0 sm:col-span-2">
                <label className={lbl} htmlFor="phone-brand-select">
                  الماركة <span className="text-rose-600">*</span>
                </label>
                <select
                  id="phone-brand-select"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
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
            </div>

            <div>
              <label className={lbl} htmlFor="phone-details">
                التفاصيل والمواصفات
              </label>
              <textarea
                id="phone-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className={`${fld} resize-none py-1.5 leading-snug`}
                placeholder="موجز أو مواصفات للمتجر…"
              />
            </div>

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
                <label className={lbl}>Réparateur</label>
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
                      setPhoneModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const urls = await uploadImages(e.target.files);
                        if (urls[0]) {
                          setImage(urls[0]);
                          setPhoneModalNotice({
                            type: "success",
                            text: "تم رفع الصورة الرئيسية",
                          });
                        }
                      } catch (err) {
                        setPhoneModalNotice({
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
                <div className="min-w-0">
                  <label className={`${lbl} truncate`}>رفع حتى ٤</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-slate-50 file:px-1.5 file:text-[10px]"
                    onChange={async (e) => {
                      setPhoneModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const uploaded = await uploadImages(e.target.files);
                        if (uploaded.length > 0) {
                          const merged = [...parseExtraImages(), ...uploaded].slice(0, 4);
                          setExtraImagesText(merged.join("\n"));
                          setPhoneModalNotice({
                            type: "success",
                            text: `تم رفع ${uploaded.length} صورة إضافية`,
                          });
                        }
                      } catch (err) {
                        setPhoneModalNotice({
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
                  value={selectedColors}
                  onChange={setSelectedColors}
                />
                <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-500">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  يظهر للزبون اختيار اللون عند الشراء عند وجود أكثر من لون.
                </p>
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className={lbl}>
                    خيارات المنتج (اسم + سعر تجزئة / جملة / مصلحين)
                  </label>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPricedOptionRows((prev) => [...prev, createEmptyPricedOptionRow()])}
                    icon={<Plus className="h-3.5 w-3.5" />}
                  >
                    إضافة خيار
                  </AdminButton>
                </div>
                {pricedOptionRows.length === 0 ? (
                  <p className="text-[10px] text-slate-500">
                    اضغط «إضافة خيار» لإضافة مثلاً 64GB أو 128GB مع أسعار مختلفة لكل نوع زبون.
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
                            placeholder="اسم الخيار (مثلاً 128GB)"
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
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <span className={lbl}>تجزئة (DA)</span>
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
                            <span className={lbl}>جملة (DA)</span>
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
                            <span className={lbl}>مصلح (DA)</span>
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
              onClick={closePhoneModal}
              disabled={savingPhone || uploadingImages}
              size="sm"
            >
              إغلاق
            </AdminButton>
            <AdminButton
              type="submit"
              variant="success"
              disabled={uploadingImages}
              loading={savingPhone}
              className="min-w-[100px]"
              size="sm"
            >
              {uploadingImages ? "رفع الصور…" : "حفظ"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminCard
        title="الهواتف المُنشأة"
        description={`المجموع: ${phones.length}`}
        icon={<Smartphone className="h-5 w-5" />}
      >
        <AdminTable
          columns={[
            { key: "image", label: "الصورة" },
            { key: "name", label: "الاسم" },
            { key: "brand", label: "الماركة" },
            { key: "colors", label: "الألوان" },
            { key: "price", label: "السعر" },
            { key: "details", label: "التفاصيل" },
            { key: "actions", label: "إجراءات", className: "w-[9rem]" },
          ]}
          rows={phones.map((p) => ({
            _id: p._id,
            image: <AdminTableCellImage src={p.image} alt={p.name} />,
            name: <span className="font-medium text-slate-800">{p.name}</span>,
            brand: <span className="text-slate-600">{brandName(p)}</span>,
            colors: (
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(p.colors) ? p.colors : []).map((c) => (
                  <span
                    key={c}
                    className="inline-block h-5 w-5 rounded-full border border-slate-200"
                    style={{
                      backgroundColor: getProductColorHex(c),
                      boxShadow:
                        String(c).toLowerCase() === "white" ||
                        String(c).toLowerCase() === "cream"
                          ? "inset 0 0 0 1px rgba(0,0,0,0.15)"
                          : undefined,
                    }}
                    title={c}
                  />
                ))}
                {(!p.colors || p.colors.length === 0) && (
                  <span className="text-[11px] text-slate-400">—</span>
                )}
              </div>
            ),
            price: (
              <span className="text-slate-700">{(p.price ?? 0).toLocaleString()} دج</span>
            ),
            details: (
              <span className="line-clamp-2 max-w-[14rem] text-[11px] text-slate-500" title={p.details}>
                {p.details || "—"}
              </span>
            ),
            actions: (
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={`/product/${p._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="عرض في الموقع"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-slate-400/20"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => openCopyPhone(p)}
                  title="نسخ إلى نموذج جديد"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => openEditPhone(p)}
                  title="تعديل"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  className="hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => setDeleteConfirm(p._id)}
                  title="حذف"
                />
              </div>
            ),
          }))}
          keyExtractor={(r) => r._id as string}
          emptyMessage="لا توجد هواتف مسجلة بعد."
          loading={loading}
        />
      </AdminCard>

      <AdminModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="حذف هاتف"
        description="لا يمكن التراجع بعد التأكيد."
        icon={<Trash2 className="h-4 w-4 text-rose-600" />}
        size="sm"
        headerDense
      >
        <p className="text-sm text-slate-700">هل تريد حذف هذا الهاتف؟</p>
        <div className="mt-4 flex justify-end gap-2">
          <AdminButton type="button" variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
            إلغاء
          </AdminButton>
          <AdminButton
            type="button"
            variant="danger"
            size="sm"
            onClick={() => deleteConfirm && void handleDelete(deleteConfirm)}
          >
            حذف
          </AdminButton>
        </div>
      </AdminModal>
    </div>
  );
}
