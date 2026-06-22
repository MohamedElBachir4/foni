import { type ReactNode } from "react";

function collapseForCompare(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** يقسّم الاستعلام إلى رموز للتظليل */
export function tokenizeHighlightQuery(query: string): string[] {
  const q = collapseForCompare(query);
  if (!q) return [];
  return [...new Set(q.split(/\s+/).filter((t) => t.length >= 1))];
}

/** تظليل أول تطابق لنص الاستعلام (غير حساس لحالة الأحرف) */
export function highlightQueryInText(text: string, query: string): ReactNode {
  const tokens = tokenizeHighlightQuery(query);
  if (!tokens.length) return text;
  return highlightTokensInText(text, tokens);
}

/**
 * يعرض النص كما هو — بدون إطار/تظليل أصفر على كلمات البحث.
 */
export function highlightTokensInText(text: string, tokens: string[]): ReactNode {
  return String(text || "");
}
