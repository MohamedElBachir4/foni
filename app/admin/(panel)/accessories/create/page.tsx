"use client";

import { useState, useEffect, useCallback } from "react";
import { getPhoneTypeIdsFromAccessory } from "@/lib/accessoryVisibility";
import { API_URL, getAuthHeaders, getToken } from "@/lib/adminAuth";
import {
  ADMIN_COPY_UNCHANGED_MESSAGE,
  buildAccessoryCreateComparePayload,
  snapshotAccessoryAfterModelsResolved,
  snapshotCreatePayload,
} from "@/lib/adminCopyProduct";
import { Package, CheckCircle, AlertCircle, Pencil, Trash2, Copy, Plus } from "lucide-react";
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

const PAGE_SIZE = 12;

const fld =
  "admin-input !h-7 !rounded-md !px-2 !py-1 text-[11px] text-slate-800 placeholder:text-slate-400";
const fldNum = `${fld} font-mono tabular-nums`;
const lbl = "mb-0.5 block text-[10px] font-medium text-slate-500";

type AccessoryType = { _id: string; name: string };
type Brand = { _id: string; name: string; slug?: string };
type PhoneTypeRow = { _id: string; name: string };
type Accessory = {
  _id: string;
  name: string;
  type: AccessoryType | string;
  brand?: Brand | string;
  phoneType?: PhoneTypeRow | string;
  phoneTypes?: PhoneTypeRow[] | string[];
  image?: string;
  extraImages?: string[];
  colors?: string[];
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  stock?: number;
  details?: string;
  options?: string[];
};

export default function AccessoriesPage() {
  const [types, setTypes] = useState<AccessoryType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [phoneTypes, setPhoneTypes] = useState<PhoneTypeRow[]>([]);
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPhoneTypes, setSelectedPhoneTypes] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [extraImagesText, setExtraImagesText] = useState("");
  const [price, setPrice] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [priceReparateur, setPriceReparateur] = useState("");
  const [stock, setStock] = useState("");
  const [details, setDetails] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [copySnapshot, setCopySnapshot] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [accessoryModalNotice, setAccessoryModalNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [accessoryModalOpen, setAccessoryModalOpen] = useState(false);
  const [savingAccessory, setSavingAccessory] = useState(false);
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
    setSelectedPhoneTypes([]);
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
    setOptions([]);
    setEditing(null);
    setCopySnapshot(null);
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

  function closeAccessoryModal() {
    if (savingAccessory || uploadingImages) return;
    setAccessoryModalOpen(false);
    setAccessoryModalNotice(null);
    resetForm();
  }

  function openCreateAccessoryModal() {
    resetForm();
    setAccessoryModalNotice(null);
    setAccessoryModalOpen(true);
  }

  async function openEditAccessory(item: Accessory) {
    setAccessoryModalNotice(null);
    await startEdit(item);
    setAccessoryModalOpen(true);
  }

  async function openCopyAccessory(item: Accessory) {
    setAccessoryModalNotice(null);
    await startCopyFrom(item);
    setAccessoryModalOpen(true);
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
    const normalizedOptions = options.map((x) => x.trim()).filter(Boolean);
    if (options.length > 0 && normalizedOptions.length !== options.length) {
      setAccessoryModalNotice({ type: "error", text: "لا يمكن ترك خيار نصي فارغ." });
      return;
    }
    e.preventDefault();
    setAccessoryModalNotice(null);
    setMessage(null);
    if (!name.trim()) {
      setAccessoryModalNotice({ type: "error", text: "اسم الأكسسوار مطلوب" });
      return;
    }
    if (!selectedType) {
      setAccessoryModalNotice({ type: "error", text: "اختر نوع الأكسسوار" });
      return;
    }
    if (!selectedBrand || selectedPhoneTypes.length === 0) {
      setAccessoryModalNotice({
        type: "error",
        text: "اختر الماركة وموديل هاتف واحد على الأقل (يمكن اختيار عدة موديلات)",
      });
      return;
    }

    const effectivePrice =
      price.trim().length > 0
        ? Number(price)
        : priceRetail.trim().length > 0
          ? Number(priceRetail)
          : 0;

    const payload = {
      name: name.trim(),
      type: selectedType,
      brand: String(selectedBrand).trim(),
      phoneTypes: selectedPhoneTypes,
      image: image.trim(),
      extraImages: parseExtraImages(),
      colors,
      price: effectivePrice,
      priceRetail: priceRetail.trim() ? Number(priceRetail) : undefined,
      priceWholesale: priceWholesale.trim() ? Number(priceWholesale) : undefined,
      priceReparateur: priceReparateur.trim() ? Number(priceReparateur) : undefined,
      stock: stock.trim() ? Number(stock) : 0,
      details: details.trim(),
      options: normalizedOptions,
    };
    if (!editing && copySnapshot) {
      const current = snapshotCreatePayload(
        buildAccessoryCreateComparePayload({
          name,
          selectedType,
          selectedBrand,
          selectedPhoneTypes,
          image,
          extraImagesText,
          colors,
          price,
          priceRetail,
          priceWholesale,
          priceReparateur,
          stock,
          details,
          options,
        })
      );
      if (current === copySnapshot) {
        setAccessoryModalNotice({ type: "error", text: ADMIN_COPY_UNCHANGED_MESSAGE });
        return;
      }
    }
    setSavingAccessory(true);
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
        setAccessoryModalOpen(false);
        resetForm();
        setMessage({
          type: "success",
          text: editing ? "تم تحديث الأكسسوار بنجاح" : "تم إنشاء الأكسسوار بنجاح",
        });
        await fetchItems();
      } else {
        setAccessoryModalNotice({
          type: "error",
          text: data.error || "فشل العملية",
        });
      }
    } catch {
      setAccessoryModalNotice({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setSavingAccessory(false);
    }
  }

  async function startCopyFrom(item: Accessory) {
    setEditing(null);
    setCopySnapshot(null);
    setMessage(null);
    setName(item.name);
    setSelectedType(typeof item.type === "object" ? (item.type as AccessoryType)._id : "");
    const bid = String(
      typeof item.brand === "object" && item.brand && "_id" in item.brand
        ? (item.brand as Brand)._id
        : typeof item.brand === "string"
          ? item.brand
          : ""
    );
    const storedIds = getPhoneTypeIdsFromAccessory(item);

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
    setOptions(Array.isArray(item.options) ? [...item.options] : []);

    if (bid) {
      let list = await loadPhoneTypes(bid);

      function displayNameForId(id: string): string {
        if (Array.isArray(item.phoneTypes)) {
          for (const pt of item.phoneTypes) {
            if (typeof pt === "object" && pt !== null && "_id" in pt && (pt as PhoneTypeRow)._id === id) {
              const n = (pt as PhoneTypeRow).name;
              return `${n ?? id.slice(0, 8)} (محفوظ)`;
            }
          }
        }
        if (typeof item.phoneType === "object" && item.phoneType && "_id" in item.phoneType) {
          const row = item.phoneType as PhoneTypeRow;
          if (row._id === id) return `${row.name ?? id.slice(0, 8)} (محفوظ)`;
        }
        return `${id.slice(0, 8)}… (محفوظ)`;
      }

      const missing = storedIds.filter((id) => !list.some((p) => p._id === id));
      for (const id of [...missing].reverse()) {
        list = [{ _id: id, name: displayNameForId(id) }, ...list];
      }

      const selected = storedIds.filter((id) => list.some((p) => p._id === id));
      setCopySnapshot(snapshotAccessoryAfterModelsResolved(item, selected));
      setPhoneTypes(list);
      setSelectedBrand(bid);
      setSelectedPhoneTypes(selected);
    } else {
      setPhoneTypes([]);
      setSelectedBrand("");
      setSelectedPhoneTypes([]);
      setCopySnapshot(snapshotAccessoryAfterModelsResolved(item, []));
    }
  }

  async function startEdit(item: Accessory) {
    setCopySnapshot(null);
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
    const storedIds = getPhoneTypeIdsFromAccessory(item);

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
    setOptions(Array.isArray(item.options) ? [...item.options] : []);

    if (bid) {
      let list = await loadPhoneTypes(bid);

      function displayNameForId(id: string): string {
        if (Array.isArray(item.phoneTypes)) {
          for (const pt of item.phoneTypes) {
            if (typeof pt === "object" && pt !== null && "_id" in pt && (pt as PhoneTypeRow)._id === id) {
              const n = (pt as PhoneTypeRow).name;
              return `${n ?? id.slice(0, 8)} (محفوظ)`;
            }
          }
        }
        if (typeof item.phoneType === "object" && item.phoneType && "_id" in item.phoneType) {
          const row = item.phoneType as PhoneTypeRow;
          if (row._id === id) return `${row.name ?? id.slice(0, 8)} (محفوظ)`;
        }
        return `${id.slice(0, 8)}… (محفوظ)`;
      }

      const missing = storedIds.filter((id) => !list.some((p) => p._id === id));
      for (const id of [...missing].reverse()) {
        list = [{ _id: id, name: displayNameForId(id) }, ...list];
      }

      setPhoneTypes(list);
      setSelectedBrand(bid);
      setSelectedPhoneTypes(storedIds.filter((id) => list.some((p) => p._id === id)));
    } else {
      setPhoneTypes([]);
      setSelectedBrand("");
      setSelectedPhoneTypes([]);
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
    if (Array.isArray(a.phoneTypes) && a.phoneTypes.length > 0) {
      const names = a.phoneTypes.map((pt) =>
        typeof pt === "object" && pt !== null && "name" in pt
          ? (pt as PhoneTypeRow).name
          : null
      ).filter(Boolean) as string[];
      if (names.length > 1) return `${names.slice(0, 2).join("، ")}${names.length > 2 ? ` +${names.length - 2}` : ""}`;
      if (names.length === 1) return names[0]!;
    }
    if (typeof a.phoneType === "object" && a.phoneType) {
      return (a.phoneType as PhoneTypeRow).name;
    }
    return a.phoneType ? String(a.phoneType) : "—";
  };

  const accessoryMissingBrandOrModel = (a: Accessory) => {
    const hasBrand =
      (typeof a.brand === "object" && a.brand && "_id" in a.brand) ||
      (typeof a.brand === "string" && /^[a-f0-9]{24}$/i.test(a.brand));
    const hasModel = getPhoneTypeIdsFromAccessory(a).length > 0;
    return !hasBrand || !hasModel;
  };

  const hasIncompleteRows = items.some(accessoryMissingBrandOrModel);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4">
      <AdminPageHeader
        className="mb-0 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        title="منتجات الأكسسوارات"
        description="إنشاء وتعديل الأكسسوار من نافذة منبثقة وبنفس تدفّق قطع الغيار؛ الربط بماركة وعدة موديلات لهاتفك."
        icon={<Package className="h-5 w-5" />}
        actions={
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={openCreateAccessoryModal}
          >
            إنشاء أكسسوار
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
        open={accessoryModalOpen}
        onClose={closeAccessoryModal}
        size="md"
        frameClassName="!p-3"
        panelClassName="!max-w-[min(26rem,calc(100vw-1.75rem))] !w-full sm:!max-w-[min(32rem,calc(100vw-1.75rem))] lg:!max-w-[min(44rem,calc(100vw-1.75rem))] max-h-[min(92dvh,720px)]"
        headerDense
        bodyScroll
        closeOnBackdrop={!savingAccessory && !uploadingImages}
        disableClose={savingAccessory || uploadingImages}
        icon={<Package className="h-4 w-4 text-emerald-600 sm:h-[18px] sm:w-[18px]" />}
        title={
          editing
            ? "تعديل أكسسوار"
            : copySnapshot
              ? "أكسسوار جديد من نسخة"
              : "إنشاء أكسسوار"
        }
        description={
          copySnapshot && !editing ? "عدّل حقلًا ثم احفظ." : "الماركة + موديل واحد على الأقل."
        }
        contentClassName="!px-3 !py-2 sm:!px-3.5 sm:!py-2.5"
      >
        {accessoryModalNotice ? (
          <div
            className={`mb-1.5 flex shrink-0 items-start gap-1.5 rounded-md border px-2 py-1 text-[10px] leading-snug ${
              accessoryModalNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {accessoryModalNotice.type === "success" ? (
              <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            )}
            {accessoryModalNotice.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0">
                <label className={lbl} htmlFor="accessory-name">
                  اسم الأكسسوار <span className="text-rose-600">*</span>
                </label>
                <input
                  id="accessory-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fld}
                  placeholder="مثال: شاحن سريع 25W"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-0">
                <label className={lbl} htmlFor="accessory-type-select">
                  نوع الأكسسوار <span className="text-rose-600">*</span>
                </label>
                <select
                  id="accessory-type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="admin-select !h-7 !py-0.5 w-full rounded-md px-2 text-[11px]"
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

            <div>
              <label className={lbl} htmlFor="accessory-details">
                الوصف
              </label>
              <textarea
                id="accessory-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                className={`${fld} !h-[3.25rem] resize-none py-1.5 leading-snug`}
                placeholder="موجز للمعروض في المتجر"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:items-start">
              <div className="min-w-0 space-y-1">
                <label className={lbl}>الماركة (الهاتف)</label>
                <select
                  value={selectedBrand}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setSelectedPhoneTypes([]);
                    setSelectedBrand(v);
                    setPhoneTypes(v ? await loadPhoneTypes(v) : []);
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
                <label className={lbl}>الموديلات</label>
                <AdminSparePartModelPicker
                  brandSelected={!!selectedBrand}
                  phoneTypes={phoneTypes}
                  selectedIds={selectedPhoneTypes}
                  onChangeIds={setSelectedPhoneTypes}
                  newModelName=""
                  onNewModelNameChange={() => {}}
                  blockedNewBecauseSelection={false}
                  showNewModelRow={false}
                />
              </div>
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

            <div className="min-w-0">
              <label className={lbl}>المخزون</label>
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
                      setAccessoryModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const urls = await uploadImages(e.target.files);
                        if (urls[0]) {
                          setImage(urls[0]);
                          setAccessoryModalNotice({
                            type: "success",
                            text: "تم رفع الصورة الرئيسية",
                          });
                        }
                      } catch (err) {
                        setAccessoryModalNotice({
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
                      setAccessoryModalNotice(null);
                      try {
                        setUploadingImages(true);
                        const uploaded = await uploadImages(e.target.files);
                        if (uploaded.length > 0) {
                          const merged = [...parseExtraImages(), ...uploaded].slice(0, 4);
                          setExtraImagesText(merged.join("\n"));
                          setAccessoryModalNotice({
                            type: "success",
                            text: `تم رفع ${uploaded.length} صورة إضافية`,
                          });
                        }
                      } catch (err) {
                        setAccessoryModalNotice({
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
                <AdminProductColorsPicker variant="compact" value={colors} onChange={setColors} />
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="mb-1 flex items-center justify-between">
                  <label className={lbl}>خيارات نصية (اختيار واحد للزبون)</label>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOptions((prev) => [...prev, ""])}
                    icon={<Plus className="h-3.5 w-3.5" />}
                  >
                    إضافة خيار
                  </AdminButton>
                </div>
                {options.length === 0 ? (
                  <p className="text-[10px] text-slate-500">
                    مثال: أسود، أبيض، Type-C، نسخة أصلية.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {options.map((opt, idx) => (
                      <div key={`option-${idx}`} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            setOptions((prev) =>
                              prev.map((item, i) => (i === idx ? e.target.value : item))
                            )
                          }
                          className={fld}
                          placeholder={`الخيار ${idx + 1}`}
                        />
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="hover:bg-rose-50 hover:text-rose-600"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                          title="حذف الخيار"
                        />
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
              onClick={closeAccessoryModal}
              disabled={savingAccessory || uploadingImages}
              size="sm"
            >
              إغلاق
            </AdminButton>
            <AdminButton
              type="submit"
              variant="success"
              disabled={uploadingImages}
              loading={savingAccessory}
              className="min-w-[100px]"
              size="sm"
            >
              {uploadingImages ? "رفع الصور…" : "حفظ"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

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
            <p className="font-semibold">تنبيه: ماركة أو ربط موديل غير مكتمل</p>
            <p className="mt-1 text-amber-900/90">
              الصفوف التي تظهر «—» في الماركة أو الموديل (قد تكون أُنشئت قديماً) لا تظهر في الموقع تحت
              أي موديل. اضغط «تعديل» واختر <strong>الماركة</strong> ثم واحدًا أو أكثر من{" "}
              <strong>موديلات الهاتف</strong> ثم احفظ — يظهر نفس الأكسسوار في كل صفحة موديل مرتبط.
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
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => {
                    void openCopyAccessory(a);
                  }}
                  title="نسخ إلى نموذج إضافة جديد"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    void openEditAccessory(a);
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

