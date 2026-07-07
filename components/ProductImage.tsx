"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getProductImageUrl,
  DEFAULT_PHONE_IMAGE,
  type ProductImageSize,
} from "@/lib/productImage";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** thumb للمصغّرات، card للبطاقات، hero لصفحة المنتج */
  size?: ProductImageSize;
  /** أولوية التحميل للصورة الأولى فقط (LCP) */
  priority?: boolean;
  /** أحجام العرض المتوقعة (لتقليل حجم التحميل) */
  sizes?: string;
  quality?: number;
};

const BLUR_DATA =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

/**
 * يعرض صورة المنتج مع تحميل كسول. روابط Cloudinary تُضغَّط تلقائياً حسب size.
 */
export function ProductImage({
  src,
  alt,
  className,
  size = "card",
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  quality: qualityProp,
}: ProductImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const resolvedSrc = getProductImageUrl(src, { size });
  const jpegQuality = qualityProp ?? (priority ? 82 : 75);
  const isLocalPathForOptimizer =
    resolvedSrc.startsWith("/") &&
    !resolvedSrc.toLowerCase().startsWith("///");
  const useNativeImg = !isLocalPathForOptimizer && resolvedSrc !== DEFAULT_PHONE_IMAGE;

  if (useFallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={DEFAULT_PHONE_IMAGE}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }

  if (useNativeImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => setUseFallback(true)}
      />
    );
  }

  try {
    return (
      <div className="relative h-full w-full">
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          placeholder="blur"
          blurDataURL={BLUR_DATA}
          quality={jpegQuality}
          onError={() => setUseFallback(true)}
        />
      </div>
    );
  } catch {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={DEFAULT_PHONE_IMAGE}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }
}
