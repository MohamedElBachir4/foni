"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Smartphone, Wrench, Headphones } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";
import { formatDzd } from "@/lib/pricing";
import { highlightQueryInText } from "@/lib/highlightSearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DEBOUNCE_MS = 300;
const LIMIT = 8;

export type SearchSuggestion = {
  type: string;
  _id: string;
  name: string;
  price: number;
  image: string;
  href: string;
};

type Grouped = {
  phones: SearchSuggestion[];
  spareParts: SearchSuggestion[];
  accessories: SearchSuggestion[];
  interpretedQuery?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

const emptyGrouped: Grouped = { phones: [], spareParts: [], accessories: [] };

function typeLabel(t: string) {
  if (t === "phone") return "هاتف";
  if (t === "phoneType") return "موديل";
  if (t === "accessory") return "أكسسوار";
  if (t === "sparePart") return "قطعة غيار";
  return "";
}

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
  const [grouped, setGrouped] = useState<Grouped>(emptyGrouped);
  const [interpretedQuery, setInterpretedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  const highlightSource =
    interpretedQuery && collapseForCompare(interpretedQuery) !== collapseForCompare(debouncedQuery)
      ? interpretedQuery
      : debouncedQuery;

  const flatList = (g: Grouped) => {
    const out: { item: SearchSuggestion; section: keyof Grouped }[] = [];
    for (const s of g.phones) out.push({ item: s, section: "phones" });
    for (const s of g.spareParts) out.push({ item: s, section: "spareParts" });
    for (const s of g.accessories) out.push({ item: s, section: "accessories" });
    return out;
  };

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q) {
      setGrouped(emptyGrouped);
      setInterpretedQuery(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(q)}&limit=${LIMIT}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.phones && data.spareParts && data.accessories) {
          const iq =
            typeof data.interpretedQuery === "string" ? data.interpretedQuery.trim() : "";
          setInterpretedQuery(iq || null);
          setGrouped({
            phones: Array.isArray(data.phones) ? data.phones : [],
            spareParts: Array.isArray(data.spareParts) ? data.spareParts : [],
            accessories: Array.isArray(data.accessories) ? data.accessories : [],
            interpretedQuery: iq || undefined,
          });
        } else {
          setGrouped(emptyGrouped);
          setInterpretedQuery(null);
        }
        setHighlightIndex(0);
      } else {
        setGrouped(emptyGrouped);
        setInterpretedQuery(null);
      }
    } catch {
      setGrouped(emptyGrouped);
      setInterpretedQuery(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
      setOpen(true);
    } else {
      setGrouped(emptyGrouped);
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

  const list = flatList(grouped);
  const total = list.length;
  const showPanel = open && Boolean(query.trim());
  const showInterpretedHint =
    Boolean(interpretedQuery) &&
    collapseForCompare(interpretedQuery || "") !== collapseForCompare(debouncedQuery);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && e.key === "Enter" && query.trim()) {
      e.preventDefault();
      router.push(`/search/categories?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      return;
    }
    if (!open || total === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        router.push(`/search/categories?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
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
    if (e.key === "Enter") {
      e.preventDefault();
      const cur = list[highlightIndex];
      if (cur) {
        router.push(cur.item.href);
        setOpen(false);
        setQuery("");
        return;
      }
      router.push(`/search/categories?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
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
          placeholder="ابحث — هواتف، أكسسوارات، قطع غيار…"
          dir="rtl"
          aria-label="بحث عن المنتجات"
          aria-autocomplete="list"
          aria-expanded={open && total > 0}
          className="w-full rounded-full border border-gray-200 bg-white/90 py-2.5 pr-10 pl-10 text-right text-[15px] text-gray-900 placeholder:text-gray-500 shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:py-3"
        />
        {loading && (
          <span
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
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
              <span className="text-sm font-semibold text-slate-700">اقتراحات</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/search/categories?q=${encodeURIComponent(query.trim())}`}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 sm:text-sm"
                  onClick={() => setOpen(false)}
                >
                  اختر القسم
                </Link>
              </div>
            </div>
          </div>

          {loading && total === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>جاري البحث...</span>
            </div>
          ) : total === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500">لا توجد نتائج</div>
          ) : (
            <ul className="py-1.5" role="listbox" id="search-suggestions-ul">
              {(() => {
                let row = 0;
                return (
                  <>
                    {grouped.phones.length > 0 && (
                      <li className="px-3 pt-2 pb-1">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Smartphone className="h-3.5 w-3.5" />
                          الهواتف والموديلات
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
                                src={getProductImageUrl(item.image)}
                                alt=""
                                className="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900 sm:line-clamp-1 sm:text-[15px]">
                                {highlightQueryInText(item.name, highlightSource)}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                                  {typeLabel(item.type)}
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
                      );
                    })}

                    {grouped.spareParts.length > 0 && (
                      <li className="px-3 pt-2 pb-1">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Wrench className="h-3.5 w-3.5" />
                          قطع الغيار
                        </div>
                      </li>
                    )}
                    {grouped.spareParts.map((item) => {
                      const idx = row;
                      row += 1;
                      return (
                        <li key={`s-${item._id}`} role="option" aria-selected={idx === highlightIndex}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                            className={`flex flex-row-reverse items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-amber-50/80 ${
                              idx === highlightIndex ? "bg-amber-50" : ""
                            }`}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 sm:h-14 sm:w-14">
                              <img
                                src={getProductImageUrl(item.image)}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                {highlightQueryInText(item.name, highlightSource)}
                              </p>
                              <div className="mt-1 text-xs text-slate-500">
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                                  قطعة غيار
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}

                    {grouped.accessories.length > 0 && (
                      <li className="px-3 pt-2 pb-1">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Headphones className="h-3.5 w-3.5" />
                          الإكسسوارات
                        </div>
                      </li>
                    )}
                    {grouped.accessories.map((item) => {
                      const idx = row;
                      row += 1;
                      return (
                        <li key={`a-${item._id}`} role="option" aria-selected={idx === highlightIndex}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                            className={`flex flex-row-reverse items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-violet-50/80 ${
                              idx === highlightIndex ? "bg-violet-50" : ""
                            }`}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 sm:h-14 sm:w-14">
                              <img
                                src={getProductImageUrl(item.image)}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                {highlightQueryInText(item.name, highlightSource)}
                              </p>
                              <div className="mt-1 text-xs text-slate-500">
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-800">
                                  أكسسوار
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
