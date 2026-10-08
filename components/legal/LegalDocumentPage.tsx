import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";

type LegalDocumentPageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function LegalDocumentPage({ title, subtitle, children }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للرئيسية
        </Link>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <header className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
            ) : null}
          </header>
          <div className="legal-doc space-y-6 text-sm leading-8 text-slate-700 sm:text-base sm:leading-8">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
