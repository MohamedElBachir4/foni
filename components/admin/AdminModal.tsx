"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** إذا false لا يُغلق بالنقر خارج اللوحة (مثلاً أثناء حفظ) */
  closeOnBackdrop?: boolean;
  /** لا يتم إغلاق النافذة (زر X، خلفية، Escape) أثناء العمليات الحساسة */
  disableClose?: boolean;
  /** تنسيق الحاوية الداخلية (تمرير، هوامش) */
  contentClassName?: string;
  /** لوحة خارجية إضافية (مثلاً ارتفاع يملأ الشاشة) */
  panelClassName?: string;
  /** عند false المنطقة الرئيسية بدون overflow-y-auto (نمط نموذج بلا تمرير) */
  bodyScroll?: boolean;
  /** رأس مدمج وأصغر */
  headerDense?: boolean;
  /** هامش المحيط لمربع المنبثق (fullscreen أضيق حول اللوحة) */
  frameClassName?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
  "2xl": "max-w-[min(72rem,calc(100vw-2rem))]",
};

export function AdminModal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  size = "md",
  closeOnBackdrop = true,
  disableClose = false,
  contentClassName = "",
  panelClassName = "",
  bodyScroll = true,
  headerDense = false,
  frameClassName = "",
}: AdminModalProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(typeof document !== "undefined" ? document.body : null);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnBackdrop && !disableClose) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, closeOnBackdrop, disableClose]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4 ${frameClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm transition-opacity"
        aria-hidden
        onClick={() => closeOnBackdrop && !disableClose && onClose()}
      />
      {/* Content */}
      <div
        className={`relative flex max-h-[min(92dvh,920px)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-xl ${sizeStyles[size] ?? sizeStyles.md} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`shrink-0 border-b border-slate-100 ${headerDense ? "px-3 py-2 sm:px-4 sm:py-2.5" : "px-5 py-3 sm:px-6 sm:py-4"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div
                  className={`flex shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 ${headerDense ? "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4" : "h-10 w-10"}`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2
                  id="modal-title"
                  className={`font-semibold tracking-tight text-slate-800 ${headerDense ? "text-[15px] leading-snug sm:text-base" : "text-lg"}`}
                >
                  {title}
                </h2>
                {description && (
                  <p className={`text-slate-500 ${headerDense ? "mt-0.5 text-[11px] leading-snug" : "mt-0.5 text-sm"}`}>
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => !disableClose && onClose()}
              disabled={disableClose}
              className={`rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-40 ${headerDense ? "p-1.5" : "p-2"}`}
              aria-label="إغلاق"
            >
              <X className={headerDense ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          </div>
        </div>
        <div
          className={`min-h-0 flex-1 px-5 py-4 sm:px-6 sm:py-5 ${bodyScroll ? "overflow-y-auto" : "flex flex-col overflow-hidden"} ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>,
    portalTarget
  );
}
