"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ShoppingCart,
  ClipboardList,
  Minus,
  Plus,
} from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";
import { ProductImage } from "@/components/ProductImage";
import {
  formatDzd,
  getEffectivePrice,
  getEffectivePriceForVariant,
  getPricingAccount,
  describeActivePriceTier,
  type TieredPrice,
} from "@/lib/pricing";
import type { PricedVariant } from "@/lib/productPricedOptions";
import { useAccount } from "@/context/AccountContext";
import { useCart } from "@/context/CartContext";
import { slugifyProductName } from "@/lib/seo";

type RelatedProduct = {
  _id: string;
  name: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  image?: string;
  colors?: string[];
};

type ProductDetailsModernProps = {
  backHref: string;
  backLabel: string;
  product: {
    id: string;
    name: string;
    price: number;
    priceRetail?: number;
    priceWholesale?: number;
    priceReparateur?: number;
    brandLabel: string;
    category: string;
    image: string;
    extraImages?: string[];
    description: string;
    colors?: string[];
    options?: string[];
    /** خيارات بأسعار ثلاثية — عند وجودها يُحدَّد السعر حسب الخيار ونوع الحساب */
    pricedOptions?: PricedVariant[];
    /** تعدد الخيارات بكميات منفصلة (قطع غيار / أكسسوارات) */
    hasVariants?: boolean;
    stock?: number;
    manageStock?: boolean;
  };
  relatedProducts: RelatedProduct[];
};

function cartProductType(category: string): "phone" | "accessory" | "sparePart" {
  if (category === "قطع غيار") return "sparePart";
  if (category === "أكسسوارات" || category === "اكسسوارات") return "accessory";
  return "phone";
}

function isHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeHtml(value: string) {
  // Basic hardening for admin-entered rich text.
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function ProductDetailsModern({
  backHref,
  backLabel,
  product,
  relatedProducts,
}: ProductDetailsModernProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { account } = useAccount();

  const tiered: TieredPrice = useMemo(
    () => ({
      price: product.price,
      priceRetail: product.priceRetail ?? product.price,
      priceWholesale: product.priceWholesale,
      priceReparateur: product.priceReparateur,
    }),
    [product.price, product.priceRetail, product.priceWholesale, product.priceReparateur]
  );

  const variantList = useMemo(
    () =>
      Array.isArray(product.pricedOptions) && product.pricedOptions.length > 0
        ? product.pricedOptions
        : [],
    [product.pricedOptions]
  );

  const multiVariantMode = useMemo(() => {
    const cat = product.category;
    const spareOrAccessory =
      cat === "قطع غيار" || cat === "أكسسوارات" || cat === "اكسسوارات";
    return Boolean(product.hasVariants) && variantList.length > 0 && spareOrAccessory;
  }, [product.category, product.hasVariants, variantList.length]);

  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  const images = useMemo(() => {
    const merged = [product.image, ...(product.extraImages || [])]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return Array.from(new Set(merged)).slice(0, 5);
  }, [product.image, product.extraImages]);

  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [orderHint, setOrderHint] = useState("");
  const [variantQtys, setVariantQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!multiVariantMode) {
      setVariantQtys({});
      return;
    }
    setVariantQtys((prev) => {
      const next: Record<string, number> = {};
      for (const v of variantList) {
        next[v.label] = prev[v.label] ?? 0;
      }
      return next;
    });
  }, [product.id, multiVariantMode, variantList]);

  const selectedVariant = useMemo(() => {
    if (!variantList.length) return null;
    const want = String(selectedOption || "").trim();
    const hit = variantList.find((v) => v.label === want);
    return hit ?? variantList[0];
  }, [variantList, selectedOption]);

  const effectivePrice = useMemo(() => {
    if (multiVariantMode) {
      let sum = 0;
      for (const v of variantList) {
        const q = variantQtys[v.label] ?? 0;
        if (q <= 0) continue;
        sum += getEffectivePriceForVariant(v, pricingAccount) * q;
      }
      return sum;
    }
    if (variantList.length && selectedVariant) {
      return getEffectivePriceForVariant(selectedVariant, pricingAccount);
    }
    return getEffectivePrice(tiered, pricingAccount);
  }, [
    multiVariantMode,
    variantList,
    variantQtys,
    selectedVariant,
    tiered,
    pricingAccount,
  ]);

  const variantCartSelections = useMemo(
    () =>
      variantList.map((v) => ({
        label: v.label,
        price: getEffectivePriceForVariant(v, pricingAccount),
        quantity: variantQtys[v.label] ?? 0,
      })),
    [variantList, variantQtys, pricingAccount]
  );

  useEffect(() => {
    const cols = product.colors || [];
    if (!cols.length) {
      setSelectedColorId("");
      return;
    }
    setSelectedColorId((prev) => {
      const p = String(prev || "").trim().toLowerCase();
      const hit = cols.find((c) => String(c).trim().toLowerCase() === p);
      return hit != null ? String(hit) : String(cols[0]);
    });
  }, [product.id, product.colors]);

  useEffect(() => {
    if (multiVariantMode) return;
    if (variantList.length) {
      setSelectedOption((prev) => {
        const p = String(prev || "").trim();
        const hit = variantList.find((v) => v.label === p);
        return hit ? hit.label : variantList[0].label;
      });
      return;
    }
    const opts = Array.isArray(product.options)
      ? product.options.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    setSelectedOption(opts[0] || "");
  }, [product.id, product.options, variantList, multiVariantMode]);

  const isAvailable = product.manageStock ? Number(product.stock || 0) > 0 : true;
  const sanitizedDescription = sanitizeHtml(product.description || "");
  const hasHtmlDescription = isHtml(sanitizedDescription);

  function handleOrderNow() {
    if (!isAvailable) {
      setOrderHint("نفد المخزون حالياً.");
      return;
    }
    const cols = product.colors || [];
    const optLabels =
      !multiVariantMode && variantList.length
      ? variantList.map((v) => v.label)
      : Array.isArray(product.options)
        ? product.options.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
    if (cols.length > 0 && !String(selectedColorId || "").trim()) {
      setOrderHint("اختر لوناً قبل إتمام الطلب.");
      return;
    }
    if (!multiVariantMode && optLabels.length > 0 && !String(selectedOption || "").trim()) {
      setOrderHint("اختر خيار المنتج قبل إتمام الطلب.");
      return;
    }
    if (multiVariantMode) {
      const selections = variantList
        .map((v) => ({
          label: v.label,
          price: getEffectivePriceForVariant(v, pricingAccount),
          quantity: variantQtys[v.label] ?? 0,
        }))
        .filter((x) => x.quantity > 0);
      if (selections.length === 0) {
        setOrderHint("حدّد كمية لخيار واحد على الأقل.");
        return;
      }
      setOrderHint("");
      const totalQty = selections.reduce((s, x) => s + x.quantity, 0);
      const subtotal = selections.reduce((s, x) => s + x.price * x.quantity, 0);
      const colorNorm = cols.length ? String(selectedColorId).trim().toLowerCase() : undefined;
      addToCart({
        id: product.id,
        name: product.name,
        price: totalQty > 0 ? subtotal / totalQty : 0,
        quantity: totalQty,
        image: product.image,
        color: colorNorm,
        availableColors: cols.length ? cols.map((c) => String(c).trim().toLowerCase()) : undefined,
        hasVariants: true,
        variantSelections: selections,
        productType: cartProductType(product.category),
      });
      router.push("/checkout");
      return;
    }
    setOrderHint("");
    const colorNorm = cols.length ? String(selectedColorId).trim().toLowerCase() : undefined;
    addToCart({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.image,
      quantity: 1,
      color: colorNorm,
      availableColors: cols.length ? cols.map((c) => String(c).trim().toLowerCase()) : undefined,
      option: optLabels.length ? selectedOption : undefined,
      availableOptions: optLabels.length ? optLabels : undefined,
      productType: cartProductType(product.category),
    });
    router.push("/checkout");
  }

  return (
    <div className="space-y-8">
      <nav>
        <Link
          href={backHref}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 sm:text-sm"
        >
          {backLabel}
        </Link>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-slate-100 p-4 sm:p-6 lg:border-b-0 lg:border-e">
            <div className="relative mb-4 h-[320px] overflow-hidden rounded-2xl bg-slate-50 sm:h-[460px]">
              <ProductImage
                src={selectedImage}
                alt={product.name}
                priority
                sizes="(max-width: 1024px) 95vw, min(640px, 45vw)"
                className="object-contain p-2 sm:p-4"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                      selectedImage === img
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={`${product.name}-${idx + 1}`}
                      sizes="64px"
                      className="object-cover p-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {product.brandLabel}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {product.category}
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {multiVariantMode ? "مجموع المختار" : "السعر"}
              </p>
              <p className="mt-1 text-3xl font-black text-blue-600">
                {formatDzd(effectivePrice)}
                <span className="ms-1 text-lg font-semibold text-blue-400">DA</span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {multiVariantMode
                  ? "يتجدّد المجموع فور تعديل الكميات حسب نوع حسابك (تجزئة / جملة / تاجر أو صاحب محل)."
                  : describeActivePriceTier(account)}
              </p>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-extrabold text-slate-800">الألوان المتوفرة</p>
                <ProductColorSwatches
                  colorIds={product.colors}
                  value={selectedColorId}
                  onChange={(id) => {
                    setSelectedColorId(id);
                    setOrderHint("");
                  }}
                  size="md"
                  className="justify-start"
                />
                <p className="mt-2 text-xs text-slate-500">يُستخدم اللون المحدّد عند «أضف للسلة» أو «اطلب الآن».</p>
              </div>
            )}

            {multiVariantMode && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="mb-2 text-sm font-extrabold text-slate-800">الخيارات والكميات</p>
                <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
                  حدّد الخيارات وكمياتها؛ يُحدَّث المجموع أعلاه حسب نوع حسابك. يمكنك تفعيل الصف من مربع
                  الاختيار أو من أسهم الكمية.
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[320px] border-collapse text-sm text-slate-800">
                    <thead>
                      <tr className="bg-slate-50">
                        <th
                          scope="col"
                          className="w-12 border border-slate-200 px-2 py-3 text-center text-xs font-bold text-slate-700 sm:w-14"
                        >
                          {/* عمود التحديد — بدون عنوان مطابقاً للمرجع */}
                        </th>
                        <th
                          scope="col"
                          className="border border-slate-200 px-3 py-3 text-start text-xs font-bold text-slate-900 sm:px-4"
                        >
                          الخيار
                        </th>
                        <th
                          scope="col"
                          className="border border-slate-200 px-3 py-3 text-center text-xs font-bold text-slate-900 sm:px-4"
                        >
                          الكمية
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantList.map((v) => {
                        const unit = getEffectivePriceForVariant(v, pricingAccount);
                        const q = variantQtys[v.label] ?? 0;
                        const setQty = (raw: number) => {
                          const maxByStock =
                            product.manageStock && Number.isFinite(Number(v.stock))
                              ? Math.max(0, Math.floor(Number(v.stock)))
                              : Number.POSITIVE_INFINITY;
                          const n = Math.min(
                            Math.max(0, Math.floor(Number(raw) || 0)),
                            maxByStock
                          );
                          setVariantQtys((prev) => ({
                            ...prev,
                            [v.label]: n,
                          }));
                          setOrderHint("");
                        };
                        return (
                          <tr key={v.label}>
                            <td className="border border-slate-200 px-2 py-3 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={q > 0}
                                onChange={() => setQty(q > 0 ? 0 : 1)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
                                aria-label={`اختيار ${v.label}`}
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-3 align-middle sm:px-4">
                              <p className="font-normal leading-snug text-slate-900">{v.label}</p>
                              <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                                {formatDzd(unit)} DA / وحدة
                              </p>
                            </td>
                            <td className="border border-slate-200 px-3 py-3 align-middle sm:px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setQty(q - 1)}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                                  aria-label="تقليل الكمية"
                                >
                                  <Minus className="h-4 w-4 stroke-[2.5]" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  inputMode="numeric"
                                  value={q}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "") {
                                      setQty(0);
                                      return;
                                    }
                                    const n = parseInt(v, 10);
                                    if (!Number.isNaN(n)) setQty(n);
                                  }}
                                  className="h-10 w-14 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none [appearance:textfield] focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:w-16"
                                  aria-label={`كمية ${v.label}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setQty(q + 1)}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                                  aria-label="زيادة الكمية"
                                >
                                  <Plus className="h-4 w-4 stroke-[2.5]" />
                                </button>
                              </div>
                              {q > 0 ? (
                                <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-blue-700">
                                  المجموع: {formatDzd(unit * q)} DA
                                </p>
                              ) : null}
                              {product.manageStock ? (
                                <p className="mt-1 text-center text-[10px] text-slate-500">
                                  المتاح: {Math.max(0, Math.floor(Number(v.stock || 0)))}
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!multiVariantMode &&
              (variantList.length > 0 ||
                (Array.isArray(product.options) && product.options.length > 0)) && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-extrabold text-slate-800">خيارات المنتج</p>
                <p className="mb-2 text-[11px] text-slate-500">
                  {variantList.length > 0
                    ? "اختر خياراً — يتغيّر السعر أعلاه مباشرة حسب خيارك ونوع حسابك (تجزئة / جملة / تاجر أو صاحب محل)."
                    : "اختر وصف الخيار قبل الإضافة للسلة."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(variantList.length
                    ? variantList.map((v) => v.label)
                    : (product.options || []).map((x) => String(x || "").trim()).filter(Boolean)
                  ).map((opt) => {
                    const isActive = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedOption(opt);
                          setOrderHint("");
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          isActive
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700"
                        }`}
                        aria-pressed={isActive}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm font-extrabold tracking-wide text-slate-700">
                الوصف
              </p>
              {hasHtmlDescription ? (
                <div
                  className="space-y-2 rounded-xl bg-slate-50 p-3 text-base leading-8 text-slate-800 sm:text-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              ) : (
                <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-base leading-8 text-slate-800 sm:text-lg">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">المواصفات</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">الماركة: {product.brandLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">الفئة: {product.category}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">تفاصيل إضافية</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  الحالة: {isAvailable ? "متوفر" : "غير متوفر"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  السعر: {formatDzd(effectivePrice)} DA
                </p>
              </div>
            </div>

            <div className="mt-4">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  متوفر
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                  <XCircle className="h-4 w-4" />
                  غير متوفر
                </span>
              )}
            </div>

            {orderHint ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {orderHint}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton
                id={product.id}
                name={product.name}
                price={effectivePrice}
                image={product.image}
                colors={product.colors || []}
                lockColorToSelection={!!(product.colors && product.colors.length > 0)}
                lockedColor={selectedColorId}
                variantCartSelections={multiVariantMode ? variantCartSelections : undefined}
                options={
                  multiVariantMode
                    ? []
                    : variantList.length > 0
                      ? variantList.map((v) => v.label)
                      : Array.isArray(product.options)
                        ? product.options
                        : []
                }
                lockOptionToSelection={
                  !multiVariantMode &&
                  (variantList.length > 0 || !!(product.options && product.options.length > 0))
                }
                lockedOption={selectedOption}
                productType={cartProductType(product.category)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
                disabled={
                  !isAvailable ||
                  (multiVariantMode && !variantCartSelections.some((x) => x.quantity > 0))
                }
              >
                <ShoppingCart className="h-5 w-5" />
                إضافة إلى السلة
              </AddToCartButton>
              <button
                type="button"
                onClick={handleOrderNow}
                disabled={!isAvailable}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                <ClipboardList className="h-5 w-5" />
                اطلب الآن
              </button>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">منتجات مشابهة</h2>
          <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-2 sm:gap-2 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const relatedEffective = getEffectivePrice(
                {
                  price: item.price,
                  priceRetail: item.priceRetail ?? item.price,
                  priceWholesale: item.priceWholesale,
                  priceReparateur: item.priceReparateur,
                },
                pricingAccount
              );
              return (
              <article
                key={item._id}
                className="group min-w-0 flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:border-slate-200 hover:shadow-xl sm:min-h-[360px] sm:rounded-[1.25rem]"
              >
                <div className="relative flex h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[130px]">
                  <ProductImage
                    src={item.image ?? ""}
                    alt={item.name}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain w-full max-w-[100px] sm:max-w-[130px]"
                  />
                  <span className="absolute start-2 top-2 rounded-lg bg-blue-600 px-2 py-1 text-[9px] font-bold text-white shadow-sm sm:start-3 sm:top-3 sm:px-2.5 sm:text-[10px]">
                    منتج
                  </span>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-slate-100 p-3">
                  <h3 className="mb-1.5 min-h-[2.5rem] text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 break-words [word-break:break-word] sm:text-base">
                    {item.name}
                  </h3>

                  <p className="mb-1.5 text-center">
                    <span className="text-xl font-black text-slate-900 sm:text-2xl">
                      {formatDzd(relatedEffective)}
                    </span>
                    <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                  </p>

                  <div className="mt-auto flex flex-col gap-2">
                    <Link
                      href={`/product/${item._id}/${slugifyProductName(item.name)}`}
                      className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 sm:py-3"
                    >
                      التفاصيل
                    </Link>
                    <AddToCartButton
                      id={item._id}
                      name={item.name}
                      price={relatedEffective}
                      image={item.image ?? ""}
                      colors={Array.isArray(item.colors) ? item.colors : []}
                      productType={cartProductType(product.category)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      أضف
                    </AddToCartButton>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
          </div>
        </section>
      )}
    </div>
  );
}
