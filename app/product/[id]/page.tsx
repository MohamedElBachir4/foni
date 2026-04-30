import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProductById, getBrandLabel } from "@/lib/productsData";
import { ProductDetailsModern } from "@/components/product/ProductDetailsModern";
import { buildMetadata, getSiteUrl, slugifyProductName } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const dynamic = "force-dynamic";

function normalizeExtraImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 4);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
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

type RelatedPhone = {
  _id: string;
  name: string;
  price?: number;
  image?: string;
  colors?: string[];
};

async function getProductSeoData(id: string) {
  const numericId = Number.parseInt(id, 10);
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
      const res = await fetch(`${API_URL}/api/phones/${id}`, { cache: "no-store" });
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
  const numericId = Number.parseInt(id, 10);
  const isNumericId = !Number.isNaN(numericId);

  let product: {
    id: string;
    name: string;
    price: number;
    brand: string;
    category: string;
    image: string;
    extraImages?: string[];
    details?: string;
    colors?: string[];
    stock?: number;
  } | null = null;
  let source: "static" | "phone" | "sparePart" = "static";
  let brandLabel = "";
  let sparePartContext: { brandId?: string; phoneTypeId?: string } = {};

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
      const res = await fetch(`${API_URL}/api/phones/${id}`, { cache: "no-store" });
      if (res.ok) {
        const phone = await res.json();
        const brand = phone.brand;
        brandLabel = typeof brand === "object" && brand?.name ? String(brand.name) : "";

        product = {
          id: String(phone._id),
          name: String(phone.name || ""),
          price: Number(phone.priceRetail ?? phone.price ?? 0),
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
          details: pickFirstNonEmptyString(phone.details, phone.description, phone.desc),
          colors: Array.isArray(phone.colors) ? phone.colors : [],
          stock: typeof phone.stock === "number" ? phone.stock : undefined,
        };
        source = "phone";
      }
    } catch {
      // ignore
    }
  }

  if (!product && /^[a-f0-9A-F]{24}$/.test(id)) {
    try {
      let part: { _id?: string; [key: string]: unknown } | null = null;
      const byIdRes = await fetch(`${API_URL}/api/spare-parts/${id}`, { cache: "no-store" });
      if (byIdRes.ok) {
        part = await byIdRes.json();
      } else {
        const listRes = await fetch(`${API_URL}/api/spare-parts?limit=1000`, {
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
        const brand = part.brand as { _id?: string; name?: string } | string | undefined;
        const phoneType = part.phoneType as { _id?: string } | string | undefined;
        const brandId = typeof brand === "object" && brand?._id ? String(brand._id) : "";
        brandLabel = typeof brand === "object" && brand?.name ? String(brand.name) : "";

        product = {
          id: String(part._id),
          name: String(part.name || ""),
          price: Number(part.priceRetail ?? part.price ?? 0),
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
          details: pickFirstNonEmptyString(part.details, part.description, part.desc),
        };
        source = "sparePart";
        sparePartContext = {
          brandId,
          phoneTypeId: typeof phoneType === "object" && phoneType?._id ? String(phoneType._id) : "",
        };
      }
    } catch {
      // ignore
    }
  }

  if (!product) notFound();

  const descriptionFallback =
    source === "sparePart"
      ? `قطعة غيار عالية الجودة من ${brandLabel || "الماركة المطلوبة"}، مصممة لأداء ثابت واعتمادية طويلة.`
      : `منتج عالي الجودة من ${brandLabel || "الماركة"}، متوفر الآن مع تجربة شراء سلسة وتوصيل سريع.`;
  const description = pickFirstNonEmptyString(product.details, descriptionFallback);

  const backHref =
    source === "sparePart" && sparePartContext.brandId && sparePartContext.phoneTypeId
      ? `/spare-parts/${sparePartContext.brandId}/${sparePartContext.phoneTypeId}`
      : `/phones/${product.brand}`;
  const backLabel =
    source === "sparePart" ? `قطع غيار ${brandLabel || ""}`.trim() : `هواتف ${brandLabel}`;

  let relatedProducts: RelatedPhone[] = [];
  const brandForApi =
    product.brand || String(brandLabel || "").toLowerCase().trim().replace(/\s+/g, "-");
  if (source !== "sparePart" && brandForApi) {
    try {
      const res = await fetch(`${API_URL}/api/phones?brand=${encodeURIComponent(brandForApi)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        relatedProducts = list
          .filter((item: { _id?: string }) => item?._id && item._id !== product.id)
          .slice(0, 4)
          .map((item: { _id: string; name: string; price?: number; image?: string; colors?: string[] }) => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            colors: Array.isArray(item.colors) ? item.colors : [],
          }));
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
      const res = await fetch(
        `${API_URL}/api/spare-parts${query ? `?${query}&limit=50` : "?limit=50"}`,
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
              image?: string;
              colors?: string[];
            }) => ({
              _id: item._id,
              name: item.name,
              price: item.priceRetail ?? item.price ?? 0,
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
          backHref={backHref}
          backLabel={backLabel}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            brandLabel,
            category: product.category,
            image: product.image,
            extraImages: product.extraImages || [],
            description,
            colors: product.colors || [],
            stock: product.stock,
          }}
          relatedProducts={relatedProducts}
        />
      </main>
      <Footer />
    </div>
  );
}
