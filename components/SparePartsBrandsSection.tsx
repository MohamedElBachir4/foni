"use client";

import { useState } from "react";
import { BrandGrid } from "@/components/BrandGrid";

/** نفس شبكة الماركات في الصفحة الرئيسية، مع التوجيه إلى قطع الغيار حسب الماركة. */
export function SparePartsBrandsSection() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  return (
    <BrandGrid
      selectedBrandId={selectedBrandId}
      onSelectBrand={setSelectedBrandId}
      category="spare-parts"
      sectionTitle="الماركات المتوفرة"
      sectionSubtitle="اختر الماركة لعرض موديلات الهاتف وقطع الغيار المرتبطة بها."
    />
  );
}
