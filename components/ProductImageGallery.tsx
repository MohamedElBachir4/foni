"use client";

import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";

type ProductImageGalleryProps = {
  name: string;
  mainImage?: string;
  extraImages?: string[];
  category: string;
};

export function ProductImageGallery({
  name,
  mainImage = "",
  extraImages = [],
  category,
}: ProductImageGalleryProps) {
  const images = useMemo(() => {
    const merged = [mainImage, ...extraImages]
      .map((img) => String(img || "").trim())
      .filter(Boolean);
    return Array.from(new Set(merged)).slice(0, 5);
  }, [mainImage, extraImages]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedImage = images[selectedIdx] || mainImage || "";

  return (
    <div className="relative min-h-[340px] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 sm:min-h-[420px]">
      <ProductImage
        src={selectedImage}
        alt={name}
        priority
        sizes="(max-width: 1024px) 95vw, min(640px, 45vw)"
        className="object-contain p-0"
      />
      <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-md sm:right-3 sm:top-3 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs sm:shadow-lg">
        {category}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur sm:bottom-3 sm:left-3 sm:right-3">
          {images.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => setSelectedIdx(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === selectedIdx
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              <ProductImage
                src={img}
                alt={`${name} ${index + 1}`}
                sizes="56px"
                className="object-cover p-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
