"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  showInfo?: boolean;
}

const PAGE_DISPLAY = 5;

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  showInfo = true,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !showInfo) return null;

  const start = Math.max(1, page - Math.floor(PAGE_DISPLAY / 2));
  const end = Math.min(totalPages, start + PAGE_DISPLAY - 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const from = totalItems ? (page - 1) * pageSize + 1 : 0;
  const to = totalItems ? Math.min(page * pageSize, totalItems) : 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {showInfo && totalItems != null && (
        <p className="text-sm text-slate-600">
          عرض {from}–{to} من أصل {totalItems}
        </p>
      )}
      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-medium transition ${
                p === page
                  ? "bg-sky-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            aria-label="الصفحة التالية"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
