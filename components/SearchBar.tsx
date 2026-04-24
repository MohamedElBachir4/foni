"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";
import { formatDzd } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DEBOUNCE_MS = 300;
const SUGGESTIONS_LIMIT = 8;

export type SearchSuggestion = {
  type: string;
  _id: string;
  name: string;
  price: number;
  image: string;
  href: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(q)}&limit=${SUGGESTIONS_LIMIT}`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setHighlightIndex(-1);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        router.push(suggestions[highlightIndex].href);
        setOpen(false);
        setQuery("");
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  const categoryLabel = (type: string) => {
    if (type === "phone") return "هاتف";
    if (type === "accessory") return "أكسسوار";
    if (type === "sparePart") return "قطعة غيار";
    return "";
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
          placeholder="ابحث عن منتج..."
          dir="rtl"
          aria-label="بحث عن المنتجات"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="search-suggestions-ul"
          className="w-full rounded-full border border-gray-200 bg-white/90 py-2.5 pr-10 pl-10 text-right text-[15px] text-gray-900 placeholder:text-black placeholder:text-right shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:py-3"
        />
        {loading && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
      </div>

      {open && (query.trim() || suggestions.length > 0) && (
        <div
          className="absolute top-full left-0 right-0 z-[100] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">اقتراحات</span>
            {query.trim() && (
              <button
                type="button"
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  setOpen(false);
                }}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                عرض الكل
              </button>
            )}
          </div>

          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>جاري البحث...</span>
            </div>
          ) : suggestions.length === 0 && query.trim() ? (
            <div className="py-10 text-center text-gray-500">لا توجد نتائج</div>
          ) : (
            <ul
              id="search-suggestions-ul"
              className="max-h-[min(65vh,420px)] overflow-auto py-1.5 sm:max-h-[min(65vh,480px)]"
              role="listbox"
            >
              {suggestions.map((item, index) => (
                <li key={`${item.type}-${item._id}`} role="option" aria-selected={index === highlightIndex}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex flex-row-reverse items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-blue-50/80 ${
                      index === highlightIndex ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 sm:h-14 sm:w-14">
                      <img
                        src={getProductImageUrl(item.image)}
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900 sm:line-clamp-1 sm:text-[15px]">
                        {item.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                          {categoryLabel(item.type)}
                        </span>
                        {item.price != null && Number(item.price) > 0 && (
                          <span className="font-bold text-slate-800">
                            {formatDzd(item.price)}
                            <span className="mr-1 text-[10px] font-semibold text-slate-500">DA</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
