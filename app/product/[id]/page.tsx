import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProductById, getBrandLabel } from "@/lib/productsData";
import { ProductDetailsModern } from "@/components/product/ProductDetailsModern";
import { buildMetadata, getSiteUrl, slugifyProductName } from "@/lib/seo";
import { publicFetch } from "@/lib/publicFetch";
import {
  parsePricedVariantsFromApi,
  type PricedVariant,
} from "@/lib/productPricedOptions";

export const dynamic = "force-dynamic";
const DIGITS_ONLY = /^\d+$/;

function normalizeExtraImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 9);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 9);
  }
  return [];
}

function pickFirstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

type RefLike = { _id?: string; name?: string } | string | undefined | null;

function oidFromRef(value: RefLike): string {
  if (!value) return "";
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function nameFromRef(value: RefLike): string {
  if (!value || typeof value !== "object") return "";
  return value.name ? String(value.name) : "";
}

function brandSlugFromBrand(
  brand: { slug?: string; name?: string } | string | undefined
): string {
  if (!brand) return "";
  if (typeof brand === "object") {
    if (brand.slug) return String(brand.slug);
    if (brand.name) {
      return String(brand.name).toLowerCase().trim().replace(/\s+/g, "-");
    }
  }
  return "";
}

function firstPhoneTypeFromDoc(doc: {
  phoneType?: RefLike;
  phoneTypes?: RefLike[];
}): { id: string; name: string } {
  const pts = doc.phoneTypes;
  if (Array.isArray(pts) && pts.length > 0) {
    const first = pts[0];
    return { id: oidFromRef(first), name: nameFromRef(first) };
  }
  return { id: oidFromRef(doc.phoneType), name: nameFromRef(doc.phoneType) };
}

function buildModelHubContext(
  brandSlug: string,
  phoneTypeId: string,
  phoneTypeName: string
): { href: string; label: string } | null {
  if (!brandSlug || !phoneTypeId) return null;
  return {
    href: `/brand/${brandSlug}/model/${phoneTypeId}`,
    label: phoneTypeName ? `العودة إلى ${phoneTypeName}` : "العودة إلى الموديل",
  };
}

type RelatedPhone = {
  _id: string;
  name: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  image?: string;
  colors?: string[];
};

async function getProductSeoData(id: string) {
  const numericId = DIGITS_ONLY.test(id) ? Number.parseInt(id, 10) : Number.NaN;
  if (!Number.isNaN(numericId)) {
    const staticProduct = getProductById(numericId);
    if (staticProduct) {
      const brandLabel = getBrandLabel(staticProduct.brand);
      return {
        id: String(staticProduct.id),
        name: staticProduct.name,
        image: staticProduct.image || "/LOGO.jpeg",
        price: Number(staticProduct.price) || 0,
        brandLabel,
        description:
          staticProduct.details ||
          `${staticProduct.name} من ${brandLabel || "Foni"} متوفر الآن في الجزائر مع توصيل سريع.`,
      };
    }
  }

  if (/^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      const res = await publicFetch(`/api/phones/${id}`, { cache: "no-store" });
      if (res.ok) {
        const phone = await res.json();
        const brandLabel =
          typeof phone.brand === "object" && phone.brand?.name
            ? String(phone.brand.name)
            : "";
        return {
          id: String(phone._id),
          name: String(phone.name || "منتج"),
          image: String(phone.image || "/LOGO.jpeg"),
          price: Number(phone.priceRetail ?? phone.price ?? 0),
          brandLabel,
          description:
            String(phone.details || phone.description || "").trim() ||
            `${String(phone.name || "منتج")} من ${brandLabel || "Foni"} متوفر الآن في الجزائر بسعر مناسب.`,
        };
      }
    } catch {
      // ignore
    }

    try {
      let part: { _id?: string; [key: string]: unknown } | null = null;
      const byIdRes = await publicFetch(`/api/spare-parts/${id}`, { cache: "no-store" });
      if (byIdRes.ok) {
        part = await byIdRes.json();
      } else {
        const listRes = await publicFetch(`/api/spare-parts?limit=1000`, {
          cache: "no-store",
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const parts = listData?.parts ?? (Array.isArray(listData) ? listData : []);
          part = Array.isArray(parts)
            ? parts.find((item: { _id?: string }) => item?._id === id) ?? null
            : null;
        }
      }

      if (part?._id) {
        const brand = part.brand as { name?: string } | undefined;
        const brandLabel =
          typeof brand === "object" && brand?.name ? String(brand.name) : "";
        const name = String(part.name || "قطعة غيار");
        const desc =
          String(part.details || part.description || part.desc || "").trim() ||
          `قطعة غيار ${name} من ${brandLabel || "Foni"} متوفرة في الجزائر.`;
        return {
          id: String(part._id),
          name,
          image: pickFirstNonEmptyString(
            part.image,
            part.imageUrl,
            part.image_url,
            part.thumbnail,
            "/LOGO.jpeg"
          ),
          price: Number(part.priceRetail ?? part.price ?? 0),
          brandLabel,
          description: desc,
        };
      }
    } catch {
      // ignore
    }

    try {
      const accRes = await publicFetch(`/api/accessories/${id}`, { cache: "no-store" });
      if (accRes.ok) {
        const acc = await accRes.json();
        const brand = acc.brand as { name?: string } | undefined;
        const brandLabel =
          typeof brand === "object" && brand?.name ? String(brand.name) : "";
        const name = String(acc.name || "اكسسوار");
        const desc =
          String(acc.details || "").trim() ||
          `اكسسوار ${name}${brandLabel ? ` من ${brandLabel}` : ""} في الجزائر.`;
        return {
          id: String(acc._id),
          name,
          image: pickFirstNonEmptyString(
            acc.image,
            acc.imageUrl,
            acc.image_url,
            acc.thumbnail,
            "/LOGO.jpeg"
          ),
          price: Number(acc.priceRetail ?? acc.price ?? 0),
          brandLabel,
          description: desc,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const seo = await getProductSeoData(id);
  if (!seo) {
    return buildMetadata({
      title: "المنتج غير موجود",
      description: "تعذر العثور على المنتج المطلوب.",
      path: `/product/${id}`,
    });
  }
  return buildMetadata({
    title: `${seo.name} في الجزائر | Foni`,
    description: seo.description,
    keywords: [
      seo.name,
      `${seo.name} في الجزائر`,
      seo.brandLabel ? `هواتف ${seo.brandLabel}` : "هواتف ذكية",
      "سعر المنتج في الجزائر",
      "Foni",
    ],
    path: `/product/${seo.id}/${slugifyProductName(seo.name)}`,
    image: seo.image || "/LOGO.jpeg",
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = DIGITS_ONLY.test(id) ? Number.parseInt(id, 10) : Number.NaN;
  const isNumericId = !Number.isNaN(numericId);

  let product: {
    id: string;
    name: string;
    price: number;
    priceRetail?: number;
    priceWholesale?: number;
    priceReparateur?: number;
    brand: string;
    category: string;
    image: string;
    extraImages?: string[];
    video?: string;
    /** يُحمَّل من الـ API عند الهاتف / قطعة غيار / أكسسوار */
    details?: string;
    colors?: string[];
    options?: string[];
    pricedOptions?: PricedVariant[];
    hasVariants?: boolean;
    stock?: number;
    manageStock?: boolean;
  } | null = null;
  let source: "static" | "phone" | "sparePart" | "accessory" = "static";
  let brandLabel = "";
  let sparePartContext: { brandId?: string; phoneTypeId?: string; brandSlug?: string } = {};
  let accessoryContext: { typeId?: string; typeLabel?: string } = {};
  let modelHubContext: { href: string; label: string } | null = null;
  /** فشل شبكة/5xx أثناء الجلب — لا يُعامل كـ notFound (سبب شائع لـ 404 متقطع) */
  let transientFetchFailure = false;

  if (isNumericId) {
    const staticProduct = getProductById(numericId);
    if (staticProduct) {
      product = {
        ...staticProduct,
        id: String(staticProduct.id),
      };
      brandLabel = getBrandLabel(staticProduct.brand);
      source = "static";
    }
  }

  if (!product && /^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      const res = await publicFetch(`/api/phones/${id}`, { cache: "no-store" });
      if (res.ok) {
        const phone = await res.json();
        const brand = phone.brand;
        brandLabel = typeof brand === "object" && brand?.name ? String(brand.name) : "";
        const brandSlug = brandSlugFromBrand(brand);
        const { id: phoneTypeId, name: phoneTypeName } = firstPhoneTypeFromDoc(phone);
        modelHubContext =
          buildModelHubContext(brandSlug, phoneTypeId, phoneTypeName) ?? modelHubContext;

        const priced = parsePricedVariantsFromApi(phone.pricedOptions);
        const phoneRetail = Number(phone.priceRetail ?? phone.price ?? 0);
        const displayRetail =
          priced.length > 0 ? priced[0].retailPrice : phoneRetail;
        product = {
          id: String(phone._id),
          name: String(phone.name || ""),
          price: displayRetail,
          priceRetail:
            typeof phone.priceRetail === "number" && !Number.isNaN(phone.priceRetail)
              ? phone.priceRetail
              : typeof phone.price === "number"
                ? phone.price
                : undefined,
          priceWholesale:
            typeof phone.priceWholesale === "number" && !Number.isNaN(phone.priceWholesale)
              ? phone.priceWholesale
              : undefined,
          priceReparateur:
            typeof phone.priceReparateur === "number" && !Number.isNaN(phone.priceReparateur)
              ? phone.priceReparateur
              : undefined,
          brand:
            typeof brand === "object" && brand?.slug
              ? String(brand.slug)
              : String(brand?.name || "").toLowerCase().trim().replace(/\s+/g, "-"),
          category: "هواتف",
          image: pickFirstNonEmptyString(
            phone.image,
            phone.imageUrl,
            phone.image_url,
            phone.thumbnail
          ),
          extraImages: normalizeExtraImages(
            phone.extraImages ??
              phone.extra_images ??
              phone.images ??
              phone.galleryImages ??
              phone.gallery_images
          ),
          video: pickFirstNonEmptyString(phone.video),
          details: pickFirstNonEmptyString(phone.details, phone.description, phone.desc),
          colors: Array.isArray(phone.colors) ? phone.colors : [],
          options: priced.length
            ? priced.map((p) => p.label)
            : Array.isArray(phone.options)
              ? phone.options.map((x: unknown) => String(x || "").trim()).filter(Boolean)
              : [],
          pricedOptions: priced.length ? priced : undefined,
          stock: typeof phone.stock === "number" ? phone.stock : undefined,
          manageStock: Boolean(phone.manageStock),
        };
        source = "phone";
      } else if (res.status !== 404) {
        transientFetchFailure = true;
      }
    } catch {
      transientFetchFailure = true;
    }
  }

  if (!product && /^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      let part: { _id?: string; [key: string]: unknown } | null = null;
      const byIdRes = await publicFetch(`/api/spare-parts/${id}`, { cache: "no-store" });
      if (byIdRes.ok) {
        part = await byIdRes.json();
      } else if (byIdRes.status === 404) {
        const listRes = await publicFetch(`/api/spare-parts?limit=1000`, {
          cache: "no-store",
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const parts = listData?.parts ?? (Array.isArray(listData) ? listData : []);
          part = Array.isArray(parts)
            ? parts.find((item: { _id?: string }) => item?._id === id) ?? null
            : null;
        } else if (listRes.status !== 404) {
          transientFetchFailure = true;
        }
      } else {
        transientFetchFailure = true;
      }

      if (part?._id) {
        const brand = part.brand as { _id?: string; name?: string; slug?: string } | string | undefined;
        const brandId = typeof brand === "object" && brand?._id ? String(brand._id) : "";
        brandLabel = typeof brand === "object" && brand?.name ? String(brand.name) : "";
        const brandSlug = brandSlugFromBrand(brand);
        const { id: phoneTypeId, name: phoneTypeName } = firstPhoneTypeFromDoc(part);

        const pricedPart = parsePricedVariantsFromApi(part.pricedOptions);
        const partRetail = Number(part.priceRetail ?? part.price ?? 0);
        const displayPartRetail =
          pricedPart.length > 0 ? pricedPart[0].retailPrice : partRetail;
        product = {
          id: String(part._id),
          name: String(part.name || ""),
          price: displayPartRetail,
          priceRetail:
            typeof part.priceRetail === "number" && !Number.isNaN(part.priceRetail as number)
              ? (part.priceRetail as number)
              : typeof part.price === "number"
                ? (part.price as number)
                : undefined,
          priceWholesale:
            typeof part.priceWholesale === "number" && !Number.isNaN(part.priceWholesale as number)
              ? (part.priceWholesale as number)
              : undefined,
          priceReparateur:
            typeof part.priceReparateur === "number" && !Number.isNaN(part.priceReparateur as number)
              ? (part.priceReparateur as number)
              : undefined,
          brand: brandId,
          category: "قطع غيار",
          image: pickFirstNonEmptyString(
            part.image,
            part.imageUrl,
            part.image_url,
            part.thumbnail
          ),
          extraImages: normalizeExtraImages(
            part.extraImages ??
              part.extra_images ??
              part.images ??
              part.galleryImages ??
              part.gallery_images
          ),
          video: pickFirstNonEmptyString(part.video),
          details: pickFirstNonEmptyString(part.details, part.description, part.desc),
          colors: Array.isArray(part.colors) ? part.colors : [],
          options: pricedPart.length
            ? pricedPart.map((p) => p.label)
            : Array.isArray(part.options)
              ? part.options.map((x: unknown) => String(x || "").trim()).filter(Boolean)
              : [],
          pricedOptions: pricedPart.length ? pricedPart : undefined,
          hasVariants: Boolean(part.hasVariants),
          stock: typeof part.stock === "number" ? (part.stock as number) : undefined,
          manageStock: Boolean(part.manageStock),
        };
        source = "sparePart";
        sparePartContext = { brandId, phoneTypeId, brandSlug };
        modelHubContext =
          buildModelHubContext(brandSlug, phoneTypeId, phoneTypeName) ?? modelHubContext;
      }
    } catch {
      transientFetchFailure = true;
    }
  }

  if (!product && /^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      const accRes = await publicFetch(`/api/accessories/${id}`, { cache: "no-store" });
      if (accRes.ok) {
        const acc = await accRes.json();
        const brand = acc.brand as { _id?: string; name?: string; slug?: string } | string | undefined;
        brandLabel =
          typeof brand === "object" && brand?.name ? String(brand.name) : "";
        const brandSlug = brandSlugFromBrand(brand);
        const { id: phoneTypeId, name: phoneTypeName } = firstPhoneTypeFromDoc(acc);
        modelHubContext =
          buildModelHubContext(brandSlug, phoneTypeId, phoneTypeName) ?? modelHubContext;

        const typeObj = acc.type as { _id?: string; name?: string } | undefined;
        accessoryContext = {
          typeId: typeof typeObj === "object" && typeObj?._id ? String(typeObj._id) : "",
          typeLabel: typeof typeObj === "object" && typeObj?.name ? String(typeObj.name) : "",
        };

        const pricedAcc = parsePricedVariantsFromApi(acc.pricedOptions);
        const accRetail = Number(acc.priceRetail ?? acc.price ?? 0);
        const displayAccRetail =
          pricedAcc.length > 0 ? pricedAcc[0].retailPrice : accRetail;

        product = {
          id: String(acc._id),
          name: String(acc.name || ""),
          price: displayAccRetail,
          priceRetail:
            typeof acc.priceRetail === "number" && !Number.isNaN(acc.priceRetail as number)
              ? (acc.priceRetail as number)
              : typeof acc.price === "number"
                ? (acc.price as number)
                : undefined,
          priceWholesale:
            typeof acc.priceWholesale === "number" && !Number.isNaN(acc.priceWholesale as number)
              ? (acc.priceWholesale as number)
              : undefined,
          priceReparateur:
            typeof acc.priceReparateur === "number" && !Number.isNaN(acc.priceReparateur as number)
              ? (acc.priceReparateur as number)
              : undefined,
          brand:
            typeof brand === "object" && brand?.slug
              ? String(brand.slug)
              : typeof brand === "object" && brand?.name
                ? String(brand.name).toLowerCase().trim().replace(/\s+/g, "-")
                : "",
          category: "أكسسوارات",
          image: pickFirstNonEmptyString(
            acc.image,
            acc.imageUrl,
            acc.image_url,
            acc.thumbnail
          ),
          extraImages: normalizeExtraImages(
            acc.extraImages ??
              acc.extra_images ??
              acc.images ??
              acc.galleryImages ??
              acc.gallery_images
          ),
          video: pickFirstNonEmptyString(acc.video),
          details: pickFirstNonEmptyString(acc.details, acc.description, acc.desc),
          colors: Array.isArray(acc.colors) ? acc.colors : [],
          options: pricedAcc.length
            ? pricedAcc.map((p) => p.label)
            : Array.isArray(acc.options)
              ? acc.options.map((x: unknown) => String(x || "").trim()).filter(Boolean)
              : [],
          pricedOptions: pricedAcc.length ? pricedAcc : undefined,
          hasVariants: Boolean(acc.hasVariants),
          stock: typeof acc.stock === "number" ? acc.stock : undefined,
          manageStock: Boolean(acc.manageStock),
        };
        source = "accessory";
      } else if (accRes.status !== 404) {
        transientFetchFailure = true;
      }
    } catch {
      transientFetchFailure = true;
    }
  }

  if (!product) {
    if (transientFetchFailure) {
      throw new Error("تعذّر تحميل المنتج مؤقتاً بسبب الشبكة أو الخادم. حاول مجدداً.");
    }
    notFound();
  }
  const descriptionFallback =
    source === "sparePart"
      ? `قطعة غيار عالية الجودة من ${brandLabel || "الماركة المطلوبة"}، مصممة لأداء ثابت واعتمادية طويلة.`
      : source === "accessory"
        ? `اكسسوار ${product.name}${brandLabel ? ` من ${brandLabel}` : ""}، متوفر للطلب مع توصيل في الجزائر.`
        : `منتج عالي الجودة من ${brandLabel || "الماركة"}، متوفر الآن مع تجربة شراء سلسة وتوصيل سريع.`;
  const description = pickFirstNonEmptyString(product.details, descriptionFallback);

  let relatedProducts: RelatedPhone[] = [];
  const brandForApi =
    product.brand || String(brandLabel || "").toLowerCase().trim().replace(/\s+/g, "-");
  if (source !== "sparePart" && source !== "accessory" && brandForApi) {
    try {
      const res = await publicFetch(
        `/api/phones?brand=${encodeURIComponent(brandForApi)}`,
        {
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        relatedProducts = list
          .filter((item: { _id?: string }) => item?._id && item._id !== product.id)
          .slice(0, 4)
          .map(
            (item: {
              _id: string;
              name: string;
              price?: number;
              priceRetail?: number;
              priceWholesale?: number;
              priceReparateur?: number;
              image?: string;
              colors?: string[];
            }) => ({
              _id: item._id,
              name: item.name,
              price: Number(item.priceRetail ?? item.price ?? 0),
              priceRetail: item.priceRetail,
              priceWholesale: item.priceWholesale,
              priceReparateur: item.priceReparateur,
              image: item.image,
              colors: Array.isArray(item.colors) ? item.colors : [],
            })
          );
      }
    } catch {
      // ignore
    }
  }

  if (source === "sparePart") {
    try {
      const query = sparePartContext.phoneTypeId
        ? `phoneType=${encodeURIComponent(sparePartContext.phoneTypeId)}`
        : sparePartContext.brandId
        ? `brand=${encodeURIComponent(sparePartContext.brandId)}`
        : "";
      const res = await publicFetch(
        `/api/spare-parts${query ? `?${query}&limit=50` : "?limit=50"}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const list = data?.parts ?? (Array.isArray(data) ? data : []);
        relatedProducts = (Array.isArray(list) ? list : [])
          .filter((item: { _id?: string }) => item?._id && item._id !== product.id)
          .slice(0, 4)
          .map(
            (item: {
              _id: string;
              name: string;
              price?: number;
              priceRetail?: number;
              priceWholesale?: number;
              priceReparateur?: number;
              image?: string;
              colors?: string[];
            }) => ({
              _id: item._id,
              name: item.name,
              price: Number(item.priceRetail ?? item.price ?? 0),
              priceRetail: item.priceRetail,
              priceWholesale: item.priceWholesale,
              priceReparateur: item.priceReparateur,
              image: item.image,
              colors: Array.isArray(item.colors) ? item.colors : [],
            })
          );
      }
    } catch {
      // ignore
    }
  }

  if (source === "accessory" && accessoryContext.typeId) {
    try {
      const res = await publicFetch(
        `/api/accessories?type=${encodeURIComponent(accessoryContext.typeId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        relatedProducts = list
          .filter((item: { _id?: string }) => item?._id && item._id !== product.id)
          .slice(0, 4)
          .map(
            (item: {
              _id: string;
              name: string;
              price?: number;
              priceRetail?: number;
              priceWholesale?: number;
              priceReparateur?: number;
              image?: string;
              colors?: string[];
            }) => ({
              _id: item._id,
              name: item.name,
              price: Number(item.priceRetail ?? item.price ?? 0),
              priceRetail: item.priceRetail,
              priceWholesale: item.priceWholesale,
              priceReparateur: item.priceReparateur,
              image: item.image,
              colors: Array.isArray(item.colors) ? item.colors : [],
            })
          );
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              image: [product.image, ...(product.extraImages || [])].filter(Boolean),
              description,
              brand: brandLabel ? { "@type": "Brand", name: brandLabel } : undefined,
              offers: {
                "@type": "Offer",
                priceCurrency: "DZD",
                price: Number(product.price) || 0,
                availability:
                  typeof product.stock === "number" && product.stock <= 0
                    ? "https://schema.org/OutOfStock"
                    : "https://schema.org/InStock",
                url: `${getSiteUrl()}/product/${product.id}/${slugifyProductName(product.name)}`,
              },
            }),
          }}
        />
        <ProductDetailsModern
          homeHref="/"
          homeLabel="الرئيسية"
          modelHubHref={modelHubContext?.href}
          modelHubLabel={modelHubContext?.label}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            priceRetail: product.priceRetail,
            priceWholesale: product.priceWholesale,
            priceReparateur: product.priceReparateur,
            brandLabel,
            category: product.category,
            image: product.image,
            extraImages: product.extraImages || [],
            video: product.video || "",
            description,
            colors: product.colors || [],
            options: product.options || [],
            pricedOptions: product.pricedOptions,
            hasVariants: product.hasVariants,
            stock: product.stock,
            manageStock: product.manageStock,
          }}
          relatedProducts={relatedProducts}
        />
      </main>
      <Footer />
    </div>
  );
}
