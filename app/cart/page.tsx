"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";
import { formatDzd } from "@/lib/pricing";
import { getProductColorLabelAr } from "@/lib/productColors";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, updateLineColor, totalItems, totalPrice } =
    useCart();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            <span className="flex h-10 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            سلة الشراء
            {totalItems > 0 && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-base font-medium text-blue-700">
                {totalItems} منتج
              </span>
            )}
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            متابعة التسوق
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-0 bg-white p-12 text-center shadow-lg shadow-slate-200/50 sm:p-16">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">سلة الشراء فارغة</h2>
            <p className="mt-2 max-w-sm text-slate-500">
              لم تضف أي منتجات بعد. تصفح المتجر وأضف ما يعجبك إلى السلة.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/40"
            >
              ابدأ التسوق
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.color ? `${item.id}||${item.color}` : item.id}
                  className="group flex flex-col gap-4 rounded-2xl border-0 bg-white p-4 shadow-md shadow-slate-200/50 transition hover:shadow-lg sm:flex-row sm:items-center sm:gap-6 sm:p-5"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 sm:h-32 sm:w-32">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="object-contain p-1"
                      sizes="128px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.availableColors && item.availableColors.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-600">اللون</p>
                        <ProductColorSwatches
                          colorIds={item.availableColors}
                          value={item.color || ""}
                          onChange={(c) =>
                            updateLineColor(item.color ? `${item.id}||${item.color}` : item.id, c)
                          }
                          size="sm"
                          className="mt-1 justify-start"
                        />
                      </div>
                    ) : item.color ? (
                      <p className="mt-0.5 text-sm text-slate-500">
                        اللون: {getProductColorLabelAr(item.color)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-lg font-bold text-slate-700">
                      {formatDzd(item.price)}{" "}
                      <span className="text-sm font-medium text-slate-500">
                        DA
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.color ? `${item.id}||${item.color}` : item.id,
                            Math.max(0, item.quantity - 1)
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-blue-600 hover:shadow-sm"
                        aria-label="تقليل"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2.25rem] text-center font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.color ? `${item.id}||${item.color}` : item.id, item.quantity + 1)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-blue-600 hover:shadow-sm"
                        aria-label="زيادة"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="min-w-[5rem] text-left text-lg font-bold text-blue-600">
                      {formatDzd(item.price * item.quantity)} DA
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.color ? `${item.id}||${item.color}` : item.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="حذف من السلة"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border-0 bg-gradient-to-l from-blue-600 to-blue-500 p-6 shadow-xl shadow-blue-500/25 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">
                    المجموع الكلي
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {formatDzd(totalPrice)}{" "}
                    <span className="text-xl font-bold text-blue-100">DA</span>
                  </p>
                </div>
                <Link
                  href="/checkout"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-blue-600 shadow-lg transition hover:bg-blue-50 hover:shadow-xl sm:w-auto"
                >
                  إتمام الطلب
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
