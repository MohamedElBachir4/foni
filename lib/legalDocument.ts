import { publicFetch } from "@/lib/publicFetch";
import { LEGAL_DEFAULTS, type LegalDocument } from "@/lib/legalDefaults";
import type { LegalSlug } from "@/lib/legalContent";

/** نص الصفحة المحفوظ من لوحة التحكم، أو النص الافتراضي إن لم يُحفظ شيء بعد */
export async function loadLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  const fallback = LEGAL_DEFAULTS[slug];
  try {
    const res = await publicFetch(`/api/legal-pages/${slug}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = await res.json();
    const content = String(data?.content || "");
    if (!content.trim()) return fallback;
    return {
      title: String(data?.title || "").trim() || fallback.title,
      subtitle: String(data?.subtitle || "").trim(),
      content,
    };
  } catch {
    return fallback;
  }
}
