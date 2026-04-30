import type { Metadata } from "next";
import { HomePageClient } from "@/components/HomePageClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "عالم الهواتف النقالة - Foni",
  description:
    "عالم الهواتف النقالة في الجزائر: بيع، صيانة وتجهيز. هواتف ذكية، اكسسوارات، وقطع غيار أصلية في مكان واحد.",
  keywords: [
    "عالم الهواتف النقالة",
    "هواتف ذكية الجزائر",
    "اكسسوارات أصلية",
    "قطع غيار هواتف",
    "بيع هواتف",
  ],
  path: "/",
  image: "/LOGO.jpeg",
});

export default function Home() {
  return <HomePageClient />;
}
