"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Smartphone } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";
import { highlightTokensInText } from "@/lib/highlightSearch";
import { useSearchSuggestions, type SearchResultItem } from "@/lib/useSearch";

const LIMIT = 24;

export type SearchSuggestion = SearchResultItem;

function collapseForCompare(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { grouped, interpretedQuery, matchedTokens, debouncedQuery, loading } =
    useSearchSuggestions(query, { limit: LIMIT });

  const highlightTokens =
    matchedTokens.length > 0
      ? matchedTokens
      : interpretedQuery && collapseForCompare(interpretedQuery) !== collapseForCompare(debouncedQuery)
        ? interpretedQuery.split(/\s+/).filter(Boolean)
        : debouncedQuery.split(/\s+/).filter(Boolean);

  const flatList = (g: typeof grouped) =>
    g.phones.map((item) => ({ item, section: "phones" as const }));

  useEffect(() => {
    if (debouncedQuery) {
      setOpen(true);
      setHighlightIndex(0);
    } else {
      setOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const list = flatList(grouped);
  const total = list.length + 1;
  const hasSearchResults = list.length > 0;
  const showPanel = open && Boolean(query.trim());
  const showInterpretedHint =
    Boolean(interpretedQuery) &&
    collapseForCompare(interpretedQuery || "") !== collapseForCompare(debouncedQuery);

  /**
   * Enter أو تأكيد البحث: الانتقال لأول نتيجة إن وُجدت، وإلا صفحة البحث.
   */
  const goToFirstResult = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const items = flatList(grouped);
    if (items.length > 0) {
      router.push(items[0].item.href);
      setOpen(false);
      setQuery("");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }, [grouped, query, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      if (highlightIndex > 0) {
        const cur = list[highlightIndex - 1];
        if (cur) {
          router.push(cur.item.href);
          setOpen(false);
          setQuery("");
          return;
        }
      }
      goToFirstResult();
      return;
    }
    if (!open || total === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < total - 1 ? i + 1 : i));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن موديل الهاتف…"
          dir="ltr"
          aria-label="بحث عن موديلات الهواتف"
          aria-autocomplete="list"
          aria-expanded={open && Boolean(query.trim())}
          className="w-full rounded-full border border-gray-200 bg-white/90 py-2.5 pl-10 pr-10 text-left text-[15px] text-gray-900 placeholder:text-gray-500 shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:py-3"
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
            aria-hidden
          />
        )}
      </div>

      {showPanel && (
        <div
          className="absolute right-0 left-0 z-[1300] mt-2 max-h-[min(72vh,520px)] overflow-hidden overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-2.5">
            {showInterpretedHint ? (
              <p className="text-right text-[13px] leading-relaxed text-slate-600" dir="auto">
                <span className="font-semibold text-slate-700">التفسير المرن للبحث: </span>
                <Link
                  href={`/search?q=${encodeURIComponent(interpretedQuery || "")}`}
                  className="font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700"
                  onClick={() => setOpen(false)}
                >
                  {interpretedQuery}
                </Link>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">موديلات الهواتف</span>
              {hasSearchResults ? (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  className="text-xs font-semibold text-blue-600 hover:underline sm:text-sm"
                  onClick={() => setOpen(false)}
                >
                  عرض الكل
                </Link>
              ) : null}
            </div>
          </div>

          {loading && !hasSearchResults ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>جاري البحث...</span>
            </div>
          ) : (
            <ul className="py-1.5" role="listbox" id="search-suggestions-ul">
              <li role="option" aria-selected={highlightIndex === 0}>
                <Link
                  href="/request-part"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`mx-2 mb-1 flex items-center justify-between rounded-xl px-4 py-3 text-right transition-colors ${
                    highlightIndex === 0
                      ? "bg-amber-100"
                      : "bg-amber-50 hover:bg-amber-100/80"
                  }`}
                >
                  <span className="text-sm font-bold text-amber-900">لم تجد قطعتك؟</span>
                  <span className="text-xs font-semibold text-amber-700">طلب قطعة</span>
                </Link>
              </li>
              {!loading && !hasSearchResults ? (
                <li className="px-4 py-3 text-center text-sm text-slate-500">
                  لا توجد نتائج أخرى
                </li>
              ) : null}
              {(() => {
                let row = 1;
                return (
                  <>
                    {grouped.phones.length > 0 && (
                      <li className="px-3 pt-2 pb-1">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Smartphone className="h-3.5 w-3.5" />
                          موديلات الهواتف
                        </div>
                      </li>
                    )}
                    {grouped.phones.map((item) => {
                      const idx = row;
                      row += 1;
                      return (
                        <li key={`p-${item.type}-${item._id}`} role="option" aria-selected={idx === highlightIndex}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                            className={`flex flex-row-reverse items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-blue-50/80 ${
                              idx === highlightIndex ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 sm:h-14 sm:w-14">
                              <img
                                src={getProductImageUrl(item.image, { size: "thumb" })}
                                alt=""
                                className="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="line-clamp-2 text-left text-sm font-semibold text-slate-900 sm:line-clamp-1 sm:text-[15px]"
                                dir="ltr"
                              >
                                {highlightTokensInText(item.name, highlightTokens)}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                  موديل
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </>
                );
              })()}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
