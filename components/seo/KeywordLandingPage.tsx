"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { SeoKeywordPageConfig } from "@/lib/seoKeywordPages";

type Props = {
  config: SeoKeywordPageConfig;
};

export function KeywordLandingPage({ config }: Props) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "/" },
      { "@type": "ListItem", position: 2, name: config.h1, item: `/${config.slug}` },
    ],
  };

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{config.h1}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{config.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/search?q=${encodeURIComponent(config.slug)}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              ابحث الآن عن {config.slug}
            </Link>
            <Link
              href="/spare-parts"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              تصفح جميع قطع الغيار
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">أسئلة شائعة</h2>
          <div className="mt-4 space-y-4">
            {config.faq.map((item) => (
              <article key={item.question} className="rounded-xl border border-slate-100 p-4">
                <h3 className="text-base font-semibold text-slate-800">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </div>
  );
}

