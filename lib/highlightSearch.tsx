import { Fragment, type ReactNode } from "react";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
 * تظليل كل رمز مطابق في النص — يدعم عدة كلمات وغير حساس لحالة الأحرف.
 * @param tokens قائمة رموز من الخادم (matchedTokens) أو من الاستعلام
 */
export function highlightTokensInText(text: string, tokens: string[]): ReactNode {
  const t = String(text || "");
  const usable = tokenizeHighlightQuery(tokens.join(" "));
  if (!usable.length) return t;

  const pattern = usable
    .sort((a, b) => b.length - a.length)
    .map((tok) => escapeRe(tok))
    .join("|");
  if (!pattern) return t;

  const re = new RegExp(`(${pattern})`, "gi");
  const parts = t.split(re);
  return (
    <>
      {parts.map((p, i) => {
        const isHit = usable.some((tok) => collapseForCompare(p) === collapseForCompare(tok));
        if (isHit) {
          return (
            <mark
              key={i}
              className="rounded-sm bg-amber-200/90 px-0.5 font-inherit text-inherit"
            >
              {p}
            </mark>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
