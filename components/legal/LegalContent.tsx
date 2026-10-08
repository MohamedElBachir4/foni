import type { ReactNode } from "react";
import { parseLegalContent, type LegalBlock } from "@/lib/legalContent";

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function LegalSubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-1.5 pe-5 ps-1 marker:text-blue-500">
              {block.items.map((item, j) => (
                <li key={j} className="ps-1">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "note") {
          return (
            <p
              key={i}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "strong") {
          return (
            <p key={i} className="font-semibold text-slate-800">
              {block.text}
            </p>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </>
  );
}

/** يعرض نص الصفحة القانونية المكتوب بالصيغة السطرية (انظر parseLegalContent) */
export function LegalContent({ content }: { content: string }) {
  const { intro, sections } = parseLegalContent(content);
  return (
    <>
      <Blocks blocks={intro} />
      {sections.map((section, i) => {
        const body = (
          <>
            <Blocks blocks={section.blocks} />
            {section.subsections.map((sub, j) => (
              <LegalSubSection key={j} title={sub.title}>
                <Blocks blocks={sub.blocks} />
              </LegalSubSection>
            ))}
          </>
        );
        return section.title ? (
          <LegalSection key={i} title={section.title}>
            {body}
          </LegalSection>
        ) : (
          <div key={i} className="space-y-3">
            {body}
          </div>
        );
      })}
    </>
  );
}
