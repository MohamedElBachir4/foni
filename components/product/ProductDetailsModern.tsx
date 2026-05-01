"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ShoppingCart, ClipboardList } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";
import { ProductImage } from "@/components/ProductImage";
import { formatDzd } from "@/lib/pricing";
import { useCart } from "@/context/CartContext";
import { slugifyProductName } from "@/lib/seo";

type RelatedProduct = {
  _id: string;
  name: string;
  price?: number;
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
    brandLabel: string;
    category: string;
    image: string;
    extraImages?: string[];
    description: string;
    colors?: string[];
    stock?: number;
  };
  relatedProducts: RelatedProduct[];
};

function cartProductType(category: string): "phone" | "sparePart" {
  return category === "قطع غيار" ? "sparePart" : "phone";
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
  const images = useMemo(() => {
    const merged = [product.image, ...(product.extraImages || [])]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return Array.from(new Set(merged)).slice(0, 5);
  }, [product.image, product.extraImages]);

  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [orderHint, setOrderHint] = useState("");

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

  /** الهواتف: في الـ API الافتراضي stock=0 ولا يعني «غير متوفر» حتى يُضبط تتبع المخزون. */
  const isAvailable =
    product.category === "هواتف"
      ? true
      : product.stock === undefined
        ? true
        : Number(product.stock) > 0;
  const sanitizedDescription = sanitizeHtml(product.description || "");
  const hasHtmlDescription = isHtml(sanitizedDescription);

  function handleOrderNow() {
    const cols = product.colors || [];
    if (cols.length > 0 && !String(selectedColorId || "").trim()) {
      setOrderHint("اختر لوناً قبل إتمام الطلب.");
      return;
    }
    setOrderHint("");
    const colorNorm = cols.length ? String(selectedColorId).trim().toLowerCase() : undefined;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      color: colorNorm,
      availableColors: cols.length ? cols.map((c) => String(c).trim().toLowerCase()) : undefined,
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
                السعر
              </p>
              <p className="mt-1 text-3xl font-black text-blue-600">
                {formatDzd(product.price)}
                <span className="ms-1 text-lg font-semibold text-blue-400">DA</span>
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
                  السعر: {formatDzd(product.price)} DA
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
                price={product.price}
                image={product.image}
                colors={product.colors || []}
                lockColorToSelection={!!(product.colors && product.colors.length > 0)}
                lockedColor={selectedColorId}
                productType={cartProductType(product.category)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
              >
                <ShoppingCart className="h-5 w-5" />
                إضافة إلى السلة
              </AddToCartButton>
              <button
                type="button"
                onClick={handleOrderNow}
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
            {relatedProducts.map((item) => (
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
                      {formatDzd(item.price ?? 0)}
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
                      price={item.price ?? 0}
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
            ))}
          </div>
          </div>
        </section>
      )}
    </div>
  );
}
