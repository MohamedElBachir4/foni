import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

function normalizeHref(raw: string): string {
  const trimmed = raw.replace(/[),.;!?،؛]+$/u, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function splitTrailingPunctuation(raw: string): { url: string; trailing: string } {
  const match = raw.match(/^(.*?)([),.;!?،؛]+)$/u);
  if (!match) return { url: raw, trailing: "" };
  return { url: match[1], trailing: match[2] };
}

/** يحوّل روابط النص العادي إلى عناصر <a> قابلة للضغط */
export function linkifyPlainText(text: string): ReactNode[] {
  if (!text) return [];
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_PATTERN.source, "gi");
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const { url, trailing } = splitTrailingPunctuation(match[0]);
    const href = normalizeHref(url);
    parts.push(
      <a
        key={`link-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline break-all font-bold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-500"
        style={{ color: "#2563eb", textDecoration: "underline" }}
      >
        {url}
      </a>
    );
    if (trailing) parts.push(trailing);
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function ensureSafeAnchorAttrs(attrs: string): string {
  let next = attrs;
  if (!/\btarget\s*=/i.test(next)) {
    next += ' target="_blank"';
  } else {
    next = next.replace(/\btarget\s*=\s*(["']?)[^"'\s>]+\1/i, 'target="_blank"');
  }
  if (!/\brel\s*=/i.test(next)) {
    next += ' rel="noopener noreferrer"';
  } else {
    next = next.replace(/\brel\s*=\s*(["'])([^"']*)\1/i, (_m, q: string, rel: string) => {
      const parts = new Set(rel.split(/\s+/).filter(Boolean));
      parts.add("noopener");
      parts.add("noreferrer");
      return `rel=${q}${[...parts].join(" ")}${q}`;
    });
  }
  const linkClass =
    "inline break-all font-bold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-500";
  if (!/\bclass\s*=/i.test(next)) {
    next += ` class="${linkClass}"`;
  } else {
    next = next.replace(/\bclass\s*=\s*(["'])([^"']*)\1/i, (_m, q: string, cls: string) => {
      return `class=${q}${cls} ${linkClass}${q}`;
    });
  }
  if (!/\bstyle\s*=/i.test(next)) {
    next += ' style="color:#2563eb;text-decoration:underline"';
  }
  return next;
}

/** يُحسّن HTML: روابط آمنة + تحويل الروابط النصية خارج الوسوم */
export function linkifyHtml(html: string): string {
  if (!html) return "";

  const withSafeAnchors = html.replace(/<a\s([^>]*?)>/gi, (_m, attrs: string) => {
    return `<a ${ensureSafeAnchorAttrs(attrs)}>`;
  });

  const chunks = withSafeAnchors.split(/(<[^>]+>)/g);
  return chunks
    .map((chunk) => {
      if (!chunk || chunk.startsWith("<")) return chunk;
      return chunk.replace(URL_PATTERN, (raw) => {
        const { url, trailing } = splitTrailingPunctuation(raw);
        const href = normalizeHref(url);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline break-all font-bold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-500" style="color:#2563eb;text-decoration:underline">${url}</a>${trailing}`;
      });
    })
    .join("");
}
