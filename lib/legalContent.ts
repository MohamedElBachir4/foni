export type LegalSlug = "privacy" | "terms";

export const LEGAL_SLUGS: LegalSlug[] = ["privacy", "terms"];

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "strong"; text: string }
  | { type: "note"; text: string }
  | { type: "list"; items: string[] };

export type LegalSubSectionData = { title: string; blocks: LegalBlock[] };

export type LegalSectionData = {
  title: string;
  blocks: LegalBlock[];
  subsections: LegalSubSectionData[];
};

export type ParsedLegalContent = {
  intro: LegalBlock[];
  sections: LegalSectionData[];
};

function pushBlock(blocks: LegalBlock[], block: LegalBlock) {
  const last = blocks[blocks.length - 1];
  if (block.type === "list" && last?.type === "list") {
    last.items.push(...block.items);
    return;
  }
  blocks.push(block);
}

/**
 * صيغة سطرية بسيطة يكتبها الأدمن:
 * `## ` قسم، `### ` قسم فرعي، `- ` عنصر قائمة، `! ` ملاحظة بارزة، `**نص**` فقرة عريضة، وغير ذلك فقرة.
 */
export function parseLegalContent(content: string): ParsedLegalContent {
  const parsed: ParsedLegalContent = { intro: [], sections: [] };
  let section: LegalSectionData | null = null;
  let sub: LegalSubSectionData | null = null;

  for (const rawLine of String(content || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("### ")) {
      sub = { title: line.slice(4).trim(), blocks: [] };
      if (!section) {
        section = { title: "", blocks: [], subsections: [] };
        parsed.sections.push(section);
      }
      section.subsections.push(sub);
      continue;
    }
    if (line.startsWith("## ")) {
      section = { title: line.slice(3).trim(), blocks: [], subsections: [] };
      sub = null;
      parsed.sections.push(section);
      continue;
    }

    let block: LegalBlock;
    if (line.startsWith("- ")) {
      block = { type: "list", items: [line.slice(2).trim()] };
    } else if (line.startsWith("! ")) {
      block = { type: "note", text: line.slice(2).trim() };
    } else if (line.length > 4 && line.startsWith("**") && line.endsWith("**")) {
      block = { type: "strong", text: line.slice(2, -2).trim() };
    } else {
      block = { type: "paragraph", text: line };
    }

    pushBlock(sub ? sub.blocks : section ? section.blocks : parsed.intro, block);
  }

  return parsed;
}
