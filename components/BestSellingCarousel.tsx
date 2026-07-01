"use client";

import { ProductGridCard } from "@/components/ProductGridCard";
import {
  ProductPeekCarousel,
  RankBadge,
  type TieredProduct,
} from "@/components/ProductPeekCarousel";
import { getEffectivePrice } from "@/lib/pricing";
import type { AccountInfo } from "@/context/AccountContext";

type BestSellingCarouselProps = {
  products: TieredProduct[];
  pricingAccount: AccountInfo | null;
};

export function BestSellingCarousel({ products, pricingAccount }: BestSellingCarouselProps) {
  const getEffective = (product: TieredProduct) =>
    getEffectivePrice(
      {
        price: product.price,
        priceRetail: product.priceRetail,
        priceWholesale: product.priceWholesale,
        priceReparateur: product.priceReparateur,
      },
      pricingAccount
    );

  return (
    <>
      <ProductPeekCarousel
        className="sm:hidden"
        products={products}
        pricingAccount={pricingAccount}
        variant="bestSelling"
        sectionLabel="الأكثر مبيعاً"
        ariaLabel="الأكثر مبيعاً"
        showRankBadges
      />

      <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-4">
        {products.map((product, index) => (
          <div key={product.id} className="group relative">
            <div className="mb-3 flex justify-center">
              <RankBadge rank={index} />
            </div>
            <ProductGridCard
              product={product}
              effectivePrice={getEffective(product)}
              index={index}
              imageSizes="(max-width: 1024px) 50vw, 25vw"
              className={
                index === 0
                  ? "border-amber-200/80 shadow-[0_16px_40px_rgba(245,158,11,0.18)] hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-[0_22px_48px_rgba(245,158,11,0.28)]"
                  : "hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(37,99,235,0.16)]"
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
