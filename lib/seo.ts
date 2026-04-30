import type { Metadata } from "next";

const SITE_NAME = "Foni";
const DEFAULT_TITLE = "Foni - عالم الهواتف في الجزائر";
const DEFAULT_DESCRIPTION =
  "متجر Foni في الجزائر لبيع الهواتف، الاكسسوارات، وقطع الغيار الأصلية مع تجربة شراء سهلة وسريعة.";
const DEFAULT_KEYWORDS = [
  "هواتف في الجزائر",
  "اكسسوارات هواتف",
  "قطع غيار هواتف",
  "متجر هواتف الجزائر",
  "Foni",
];

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return value.replace(/\/+$/, "");
}

export function buildMetadata(input?: {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const title = input?.title || DEFAULT_TITLE;
  const description = input?.description || DEFAULT_DESCRIPTION;
  const keywords = input?.keywords?.length ? input.keywords : DEFAULT_KEYWORDS;
  const path = input?.path || "/";
  const image = input?.image || "/LOGO.jpeg";
  const canonical = `${siteUrl}${path}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ar_DZ",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function slugifyProductName(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
