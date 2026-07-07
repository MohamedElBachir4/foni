"use client";

import { useState } from "react";
import { getProductImageUrl, DEFAULT_PHONE_IMAGE } from "@/lib/productImage";

interface AdminTableProps {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, React.ReactNode>[];
  keyExtractor: (row: Record<string, React.ReactNode>) => string;
  emptyMessage?: string;
  loading?: boolean;
  imageColumn?: string;
}

export function AdminTable({
  columns,
  rows,
  keyExtractor,
  emptyMessage = "لا توجد بيانات",
  loading = false,
  imageColumn,
}: AdminTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
        <p className="mt-3 text-sm text-slate-500">جاري التحميل...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-table-scroll -mx-1 overflow-x-auto rounded-lg border border-slate-200 px-1 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[520px] text-right text-sm sm:min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 sm:px-4 sm:py-3 ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="transition-colors duration-150 hover:bg-slate-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 text-slate-700 sm:px-4 sm:py-3 ${col.className ?? ""} ${
                    col.key === imageColumn ? "align-middle" : ""
                  }`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminTableCellImage({
  src,
  alt,
  size = 40,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
}) {
  const [useFallback, setUseFallback] = useState(false);

  if (!src) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
        —
      </span>
    );
  }

  const imageSrc = useFallback ? DEFAULT_PHONE_IMAGE : getProductImageUrl(src);

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={alt ?? ""}
        width={size}
        height={size}
        className="h-10 w-10 object-cover"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}
