"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImageUrl, DEFAULT_PHONE_IMAGE } from "@/lib/productImage";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** أولوية التحميل للصور الظاهرة أولاً (أسرع تحميلاً) */
  priority?: boolean;
  /** أحجام العرض المتوقعة (لتقليل حجم التحميل) */
  sizes?: string;
};

const BLUR_DATA =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

/**
 * يعرض صورة المنتج مع تحميل كسول وأولوية للصور الأولى. عند الفشل يعرض الصورة الافتراضية.
 */
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ProductImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const resolvedSrc = getProductImageUrl(src);
  /** مسارات نسبية من جذر الموقع (مثل /uploads) تمر عبر Next Image؛ أي رابط مطلق أو data: يعرض tag img */
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
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => setUseFallback(true)}
      />
    );
  }

  try {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={75}
        placeholder="blur"
        blurDataURL={BLUR_DATA}
        onError={() => setUseFallback(true)}
      />
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
