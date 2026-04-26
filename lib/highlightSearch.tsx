import { Fragment, type ReactNode } from "react";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** تظليل أول تطابق لنص الاستعلام (غير حساس لحالة الأحرف) */
export function highlightQueryInText(text: string, query: string): ReactNode {
  const t = String(text || "");
  const q = String(query || "").trim();
  if (!q) return t;
  const re = new RegExp(`(${escapeRe(q)})`, "gi");
  const parts = t.split(re);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 1) {
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
