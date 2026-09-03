"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import { Home, Grid2x2, ShoppingCart, CircleUserRound } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/products", label: "المنتجات", icon: Grid2x2 },
  { href: "/cart", label: "السلة", icon: ShoppingCart },
  { href: "/accounts", label: "حسابي", icon: CircleUserRound },
];

const PRODUCT_PATHS = ["/products", "/phones", "/accessories", "/spare-parts", "/brand"];

const spring = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/products") {
    return PRODUCT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[1050] border-t border-slate-100/80 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden"
      aria-label="التنقل السفلي"
    >
      <LayoutGroup id="bottom-nav">
        <div className="mx-auto flex h-14 max-w-md items-stretch justify-around px-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isCart = href === "/cart";
            const isActive = isNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-center outline-none"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-x-1 inset-y-1 rounded-2xl bg-blue-50 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
                    transition={spring}
                  />
                )}

                <motion.span
                  className="relative z-10 flex flex-col items-center gap-0.5"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <motion.span
                    className="relative flex items-center justify-center"
                    animate={{
                      scale: isActive ? 1.12 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={spring}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {isCart && (
                      <AnimatePresence mode="popLayout">
                        {totalItems > 0 && (
                          <motion.span
                            key={totalItems > 99 ? "99+" : totalItems}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 22 }}
                            className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-0.5 text-[8px] font-bold text-white shadow-sm"
                          >
                            {totalItems > 99 ? "99+" : totalItems}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.span>

                  <motion.span
                    className="text-[10px] leading-none"
                    animate={{
                      color: isActive ? "#2563eb" : "#94a3b8",
                      fontWeight: isActive ? 700 : 500,
                      opacity: isActive ? 1 : 0.85,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {label}
                  </motion.span>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
