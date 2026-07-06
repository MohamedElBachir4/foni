"use client";

import {
  ProductPeekCarousel,
  type TieredProduct,
} from "@/components/ProductPeekCarousel";
import type { AccountInfo } from "@/context/AccountContext";

type BestSellingCarouselProps = {
  products: TieredProduct[];
  pricingAccount: AccountInfo | null;
};

export function BestSellingCarousel({ products, pricingAccount }: BestSellingCarouselProps) {
  return (
    <ProductPeekCarousel
      className="sm:hidden"
      products={products}
      pricingAccount={pricingAccount}
      variant="bestSelling"
      sectionLabel="الأكثر مبيعاً"
      ariaLabel="الأكثر مبيعاً"
      showRankBadges
    />
  );
}
