"use client";

import { useState } from "react";
import { getProductImageUrl } from "@/lib/productImage";

type MaintenanceToolGalleryProps = {
  images: string[];
  name: string;
};

export function MaintenanceToolGallery({ images, name }: MaintenanceToolGalleryProps) {
  const gallery = images.filter(Boolean);
  const [selected, setSelected] = useState(gallery[0] || "");

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
        لا توجد صورة
      </div>
    );
  }

  const active = gallery.includes(selected) ? selected : gallery[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:aspect-[4/3] lg:aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImageUrl(active)}
          alt={name}
          className="h-full w-full object-contain p-2 sm:p-4"
        />
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {gallery.map((url, idx) => {
            const isActive = url === active;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setSelected(url)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                  isActive
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-blue-300"
                }`}
                aria-label={`صورة ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProductImageUrl(url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
