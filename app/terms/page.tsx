import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LegalContent } from "@/components/legal/LegalContent";
import { loadLegalDocument } from "@/lib/legalDocument";

export const metadata = { title: "الشروط والأحكام | FONI" };
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const doc = await loadLegalDocument("terms");
  return (
    <LegalDocumentPage title={doc.title} subtitle={doc.subtitle || undefined}>
      <LegalContent content={doc.content} />
    </LegalDocumentPage>
  );
}
