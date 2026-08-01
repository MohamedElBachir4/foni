"use client";

import { RankBadge, type TieredProduct } from "@/components/ProductPeekCarousel";
import { ProductGridCard } from "@/components/ProductGridCard";
import { getEffectivePrice } from "@/lib/pricing";
import type { AccountInfo } from "@/context/AccountContext";

type BestSellingCarouselProps = {
  products: TieredProduct[];
  pricingAccount: AccountInfo | null;
};

/** TEMP: static mobile list — replaces ProductPeekCarousel (no rAF / setInterval / motion). */
export function BestSellingCarousel({ products, pricingAccount }: BestSellingCarouselProps) {
  if (!products.length) return null;

  return (
    <div className="-mx-4 grid grid-cols-2 gap-3 px-2 sm:hidden" aria-label="الأكثر مبيعاً">
      {products.map((product, index) => {
        const effectivePrice = getEffectivePrice(
          {
            price: product.price,
            priceRetail: product.priceRetail,
            priceWholesale: product.priceWholesale,
            priceReparateur: product.priceReparateur,
          },
          pricingAccount
        );
        return (
          <div key={product.id} className="relative">
            <div className="mb-2 flex justify-center">
              <RankBadge rank={index} />
            </div>
            <ProductGridCard
              product={product}
              effectivePrice={effectivePrice}
              index={index}
              compact
              imageSizes="50vw"
            />
          </div>
        );
      })}
    </div>
  );
}
