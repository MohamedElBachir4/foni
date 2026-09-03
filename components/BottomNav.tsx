"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2x2, ShoppingCart, CircleUserRound } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/phones", label: "المنتجات", icon: Grid2x2 },
  { href: "/cart", label: "السلة", icon: ShoppingCart },
  { href: "/accounts", label: "حسابي", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[1050] border-t border-slate-100 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden"
      aria-label="التنقل السفلي"
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isCart = href === "/cart";
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-center transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-blue-500"
              }`}
            >
              {/* أيقونة السلة مع badge */}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isCart && totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-0.5 text-[8px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold leading-none ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
              {/* مؤشر نشاط */}
              {isActive && (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
      {/* مساحة آمنة لأجهزة iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
