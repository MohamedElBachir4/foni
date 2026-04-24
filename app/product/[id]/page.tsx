import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProductById, getBrandLabel } from "@/lib/productsData";
import { ProductImage } from "@/components/ProductImage";
import { ShoppingCart, Phone, ArrowLeft, Shield, Truck, Heart } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatDzd } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const dynamic = "force-dynamic";

const COLOR_HEX: Record<string, string> = {
  white: "#ffffff",
  black: "#1f2937",
  gold: "#d4af37",
  silver: "#c0c0c0",
  purple: "#7c3aed",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productIdNum = parseInt(id, 10);
  const isNumericId = !Number.isNaN(productIdNum);
  let product: { id: string; name: string; price: number; brand: string; category: string; image: string; details?: string; colors?: string[] } | null = null;
  let brandLabel = "";

  if (isNumericId) {
    const staticProduct = getProductById(productIdNum);
    if (staticProduct) {
      product = { ...staticProduct, id: String(staticProduct.id) };
      brandLabel = getBrandLabel(staticProduct.brand);
    }
  }

  if (!product && /^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      const res = await fetch(`${API_URL}/api/phones/${id}`, { cache: "no-store" });
      if (res.ok) {
        const apiPhone = await res.json();
        const brand = apiPhone.brand;
        brandLabel = typeof brand === "object" && brand?.name ? brand.name : "";
        const colors = apiPhone?.colors;
        const colorsArr = Array.isArray(colors)
          ? colors.filter((c: string) => typeof c === "string" && c.trim())
          : [];
        product = {
          id: apiPhone._id,
          name: apiPhone.name,
          price: apiPhone.price ?? 0,
          brand: typeof brand === "object" && brand?.slug ? brand.slug : "",
          category: "هواتف",
          image: apiPhone.image ?? "",
          details: apiPhone.details,
          colors: colorsArr,
        };
      }
    } catch {
      // ignore
    }
  }

  if (!product) notFound();

  const defaultDescription = `هاتف ذكي من فئة ${product.category}، ماركة ${brandLabel}. جودة عالية وأسعار منافسة. متوفر للطلب الآن مع ضمان وتوصيل.`;
  const description = product.details?.trim() || defaultDescription;

  let relatedPhones: { _id: string; name: string; price?: number; image?: string; colors?: string[] }[] = [];
  const brandForApi = product.brand || brandLabel.toLowerCase().trim().replace(/\s+/g, "-");
  if (brandForApi) {
    try {
      const res = await fetch(`${API_URL}/api/phones?brand=${encodeURIComponent(brandForApi)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        relatedPhones = list
          .filter((p: { _id: string }) => p._id !== product!.id)
          .slice(0, 4)
          .map((p: { _id: string; name: string; price?: number; image?: string; colors?: string[] }) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            colors: p.colors,
          }));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen w-full antialiased bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
        {/* Back - بسيط على الموبايل */}
        <nav className="mb-4 sm:mb-6">
          <Link
            href={`/phones/${product.brand}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-blue-600 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            هواتف {brandLabel}
          </Link>
        </nav>

        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg sm:rounded-2xl sm:shadow-xl sm:shadow-slate-200/50 sm:ring-1 sm:ring-slate-100/50 lg:rounded-3xl">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr] lg:gap-0">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/3] lg:aspect-square lg:min-h-[260px]">
              <ProductImage
                src={product.image}
                alt={product.name}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 45vw"
                className="object-contain p-3 sm:p-6 lg:p-8"
              />
              <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-md sm:right-3 sm:top-3 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs sm:shadow-lg">
                {product.category}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col p-4 sm:p-8 lg:justify-between lg:p-10">
              <div>
                <p className="mb-1 text-xs font-medium text-blue-600 sm:mb-2 sm:text-sm">{brandLabel}</p>
                <h1 className="mb-3 text-xl font-extrabold leading-tight text-slate-900 sm:mb-4 sm:text-3xl lg:text-[1.75rem]">
                  {product.name}
                </h1>

                {product.price > 0 && (
                  <div className="mb-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100 sm:mb-6 sm:rounded-xl sm:bg-gradient-to-l sm:from-blue-50 sm:to-slate-50 sm:p-4 sm:ring-blue-100/50">
                    <p className="hidden text-sm font-medium text-slate-500 sm:block">السعر</p>
                    <p className="text-xl font-black text-blue-600 sm:text-3xl">
                      {formatDzd(product.price)}
                      <span className="mr-1 text-base font-semibold text-blue-400 sm:text-lg">DA</span>
                    </p>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2.5 sm:text-sm">
                      الألوان المتوفرة
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((colorId) => (
                        <span
                          key={colorId}
                          className="inline-block h-8 w-8 rounded-full border-2 border-slate-200 shadow-sm sm:h-9 sm:w-9"
                          style={{
                            backgroundColor: COLOR_HEX[colorId] || "#9ca3af",
                            boxShadow: colorId === "white" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                          }}
                          title={colorId}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-4 sm:mb-6">
                  <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2 sm:text-sm">
                    الوصف
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">
                    {description}
                  </p>
                </div>

                {/* Trust - بسيط على الموبايل */}
                <div className="mb-4 flex flex-wrap gap-2 sm:mb-6 sm:gap-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                    <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                    ضمان
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                    <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                    توصيل
                  </span>
                </div>
              </div>

              {/* أزرار كبيرة وواضحة على الموبايل */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <AddToCartButton
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  colors={product.category === "هواتف" ? product.colors : undefined}
                  productType="phone"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md active:scale-[0.98] sm:rounded-xl sm:bg-gradient-to-l sm:from-blue-600 sm:to-blue-500 sm:py-4 sm:shadow-lg sm:shadow-blue-500/30 sm:transition-all sm:duration-300 sm:hover:from-blue-500 sm:hover:to-blue-600 sm:hover:shadow-xl sm:hover:shadow-blue-500/40"
                >
                  <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
                  أضف للسلة
                </AddToCartButton>
                <Link
                  href="tel:+213000000000"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-700 active:scale-[0.98] sm:rounded-xl sm:py-4 sm:transition-all sm:duration-300 sm:hover:border-blue-400 sm:hover:bg-blue-50 sm:hover:text-blue-600"
                >
                  <Phone className="h-5 w-5" strokeWidth={2.5} />
                  اطلب الآن
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* هواتف أخرى من نفس الماركة - نفس تصميم بطاقات الهواتف */}
        {relatedPhones.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-800 sm:text-2xl">
              <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
              هواتف أخرى من {brandLabel}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-2 lg:grid-cols-4">
              {relatedPhones.map((phone) => (
                <div
                  key={phone._id}
                  className="group flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-200 sm:min-h-[360px] sm:rounded-[1.25rem]"
                >
                  <div className="relative flex h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[130px]">
                    <ProductImage
                      src={phone.image ?? ""}
                      alt={phone.name}
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain w-full max-w-[100px] sm:max-w-[130px]"
                    />
                    <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                      {product.category}
                    </span>
                    <button
                      type="button"
                      aria-label="إضافة للمفضلة"
                      className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                    >
                      <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                    <h3 className="mb-1.5 min-h-[2.5rem] text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                      {phone.name}
                    </h3>

                    {phone.price != null && Number(phone.price) > 0 ? (
                      <p className="mb-1.5 text-center">
                        <span className="text-xl font-black text-slate-900 sm:text-2xl">
                          {formatDzd(phone.price)}
                        </span>
                        <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                      </p>
                    ) : (
                      <p className="mb-1.5 min-h-[1.5rem] text-center text-sm font-semibold text-slate-400">— DA</p>
                    )}

                    <div className="mb-2 flex min-h-[28px] flex-wrap items-center justify-center gap-1.5">
                      {Array.isArray(phone.colors) && phone.colors.length > 0
                        ? phone.colors.slice(0, 5).map((colorId: string) => (
                            <span
                              key={colorId}
                              className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-200 sm:h-5 sm:w-5"
                              style={{ backgroundColor: COLOR_HEX[colorId] || "#9ca3af" }}
                            />
                          ))
                        : null}
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                      <AddToCartButton
                        id={phone._id}
                        name={phone.name}
                        price={phone.price ?? 0}
                        image={phone.image ?? ""}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
                        أضف للسلة
                      </AddToCartButton>
                      <Link
                        href={`/product/${phone._id}`}
                        className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 sm:py-3"
                      >
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
