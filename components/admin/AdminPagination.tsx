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

function buildPageList(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = page - 1; i <= page + 1; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    const prev = sorted[i - 1];
    if (prev != null && current - prev > 1) out.push("ellipsis");
    out.push(current);
  }
  return out;
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  showInfo = true,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !showInfo) return null;

  const pages = buildPageList(page, totalPages);
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
          {pages.map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="inline-flex h-9 min-w-[2rem] items-center justify-center text-sm font-medium text-slate-400"
              >
                …
              </span>
            ) : (
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
            )
          )}
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
