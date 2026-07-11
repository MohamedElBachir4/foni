"use client";

import Link from "next/link";

type TermsConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
};

export function TermsConsentCheckbox({
  checked,
  onChange,
  disabled = false,
  id = "terms-consent",
}: TermsConsentCheckboxProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-7 text-slate-800">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
        />
        <span>
          هل توافق على{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            الشروط والأحكام
          </Link>{" "}
          و{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            سياسة الخصوصية
          </Link>
          ؟
        </span>
      </label>
    </div>
  );
}
