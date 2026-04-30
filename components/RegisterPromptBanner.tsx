"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Wrench, Building2 } from "lucide-react";
import { useAccount } from "@/context/AccountContext";

const OPEN_DELAY_MS = 5000;

export function RegisterPromptBanner() {
  const { account, hydrated } = useAccount();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [delayReady, setDelayReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevAccountRef = useRef(account);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prevAccountRef.current && !account) setDismissed(false);
    prevAccountRef.current = account;
  }, [account]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const baseEligible =
    mounted &&
    hydrated &&
    !account &&
    !dismissed &&
    !!pathname &&
    !pathname.startsWith("/accounts") &&
    !pathname.startsWith("/admin");

  useEffect(() => {
    if (!baseEligible) {
      setDelayReady(false);
      return;
    }
    setDelayReady(false);
    const id = window.setTimeout(() => setDelayReady(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [baseEligible]);

  const showModal = baseEligible && delayReady;

  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, dismiss]);

  if (!mounted || !showModal) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-prompt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity"
        onClick={dismiss}
        aria-label="إغلاق الخلفية"
      />
      <div
        className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-t-3xl border border-slate-200/80 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        dir="rtl"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute start-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pt-1 pe-10">
          <p
            id="register-prompt-title"
            className="text-base font-bold leading-snug text-slate-900 sm:text-lg"
          >
            سجّل كحساب مهني
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            استفد من التخفيضات وسهولة الطلبات. اختر{" "}
            <span className="font-semibold text-slate-800">مصلّحاً</span> أو{" "}
            <span className="font-semibold text-slate-800">تاجر جملة</span> — خطوات
            بسيطة مثل المتاجر الاحترافية.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Link
            href="/accounts?register=reparateur"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-500"
          >
            <Wrench className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            تسجيل كمصلّح
          </Link>
          <Link
            href="/accounts?register=grossiste"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-500"
          >
            <Building2 className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            تسجيل كجملة
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          لاحقاً
        </button>
      </div>
    </div>,
    document.body
  );
}
