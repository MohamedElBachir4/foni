"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { publicFetch } from "@/lib/publicFetch";

export type SearchResultItem = {
  type: string;
  _id: string;
  name: string;
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  image: string;
  href: string;
  matchedTokens?: string[];
};

export type GroupedSearchResults = {
  phones: SearchResultItem[];
  spareParts: SearchResultItem[];
  accessories: SearchResultItem[];
  similar?: SearchResultItem[];
  interpretedQuery?: string;
  matchedTokens?: string[];
};

const EMPTY: GroupedSearchResults = {
  phones: [],
  spareParts: [],
  accessories: [],
  similar: [],
  matchedTokens: [],
};

type UseSearchOptions = {
  debounceMs?: number;
  limit?: number;
  section?: "phones" | "spareParts" | "accessories" | "";
  timeoutMs?: number;
  maxRetries?: number;
};

export function useSearchSuggestions(query: string, options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    limit = 24,
    section = "",
    timeoutMs = 22_000,
    maxRetries = 2,
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  const [grouped, setGrouped] = useState<GroupedSearchResults>(EMPTY);
  const [interpretedQuery, setInterpretedQuery] = useState<string | null>(null);
  const [matchedTokens, setMatchedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const fetchResults = useCallback(
    async (q: string, signal?: AbortSignal) => {
      const gen = ++fetchGenRef.current;
      const isStale = () => gen !== fetchGenRef.current || signal?.aborted;

      if (!q) {
        setGrouped(EMPTY);
        setInterpretedQuery(null);
        setMatchedTokens([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const u = new URLSearchParams();
        u.set("q", q);
        u.set("limit", String(limit));
        if (section) u.set("section", section);
        const res = await publicFetch(`/api/search?${u.toString()}`, {
          cache: "no-store",
          signal,
          timeoutMs,
          maxRetries,
        });
        if (isStale()) return;
        if (!res.ok) {
          setGrouped(EMPTY);
          setInterpretedQuery(null);
          setMatchedTokens([]);
          setError(res.status === 504 ? "انتهت مهلة البحث. حاول مجدداً." : "تعذّر إكمال البحث.");
          return;
        }
        const data = (await res.json()) as GroupedSearchResults;
        if (isStale()) return;
        if (data && Array.isArray(data.phones)) {
          const iq = typeof data.interpretedQuery === "string" ? data.interpretedQuery.trim() : "";
          const mt = Array.isArray(data.matchedTokens) ? data.matchedTokens : [];
          setInterpretedQuery(iq || null);
          setMatchedTokens(mt);
          setGrouped({
            phones: data.phones || [],
            spareParts: data.spareParts || [],
            accessories: data.accessories || [],
            similar: data.similar || [],
            interpretedQuery: iq || undefined,
            matchedTokens: mt,
          });
        } else {
          setGrouped(EMPTY);
          setInterpretedQuery(null);
          setMatchedTokens([]);
        }
      } catch (err) {
        if (isStale()) return;
        setGrouped(EMPTY);
        setInterpretedQuery(null);
        setMatchedTokens([]);
        setError(err instanceof Error ? err.message : "تعذّر إكمال البحث.");
      } finally {
        if (!isStale()) setLoading(false);
      }
    },
    [limit, section, timeoutMs, maxRetries]
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (debouncedQuery) {
      fetchResults(debouncedQuery, ac.signal);
    } else {
      setGrouped(EMPTY);
      setInterpretedQuery(null);
      setMatchedTokens([]);
      setLoading(false);
      setError(null);
    }
    return () => ac.abort();
  }, [debouncedQuery, fetchResults]);

  const totalResults =
    grouped.phones.length + grouped.spareParts.length + grouped.accessories.length;

  return {
    grouped,
    interpretedQuery,
    matchedTokens,
    debouncedQuery,
    loading,
    error,
    totalResults,
    refetch: () => fetchResults(debouncedQuery),
  };
}
