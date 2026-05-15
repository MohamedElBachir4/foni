import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { seoKeywordPages } from "@/lib/seoKeywordPages";
import { KeywordLandingPage } from "@/components/seo/KeywordLandingPage";

const config = seoKeywordPages.samsung;

export const metadata: Metadata = buildMetadata({
  title: config.title,
  description: config.description,
  keywords: config.keywords,
  path: "/samsung",
  image: "/LOGO.jpeg",
});

export default function SamsungSeoPage() {
  return <KeywordLandingPage config={config} />;
}

