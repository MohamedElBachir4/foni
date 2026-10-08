import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LegalContent } from "@/components/legal/LegalContent";
import { loadLegalDocument } from "@/lib/legalDocument";

export const metadata = { title: "سياسة الخصوصية | FONI" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const doc = await loadLegalDocument("privacy");
  return (
    <LegalDocumentPage title={doc.title} subtitle={doc.subtitle || undefined}>
      <LegalContent content={doc.content} />
    </LegalDocumentPage>
  );
}
