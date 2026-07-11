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

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalSubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pe-5 ps-1 marker:text-blue-500">
      {items.map((item) => (
        <li key={item} className="ps-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
      {children}
    </p>
  );
}
