"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:ring-indigo-500/30 disabled:from-indigo-300 disabled:to-sky-300",
  secondary:
    "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-md shadow-slate-500/25 hover:shadow-lg hover:shadow-slate-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:ring-slate-500/30 disabled:from-slate-400 disabled:to-slate-300",
  success:
    "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:ring-emerald-500/30 disabled:from-emerald-300 disabled:to-teal-300",
  danger:
    "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:ring-rose-500/30 disabled:from-rose-300 disabled:to-pink-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-400/20 active:bg-slate-200/60",
  outline:
    "border-2 border-slate-200 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-400/20",
};

const sizeStyles = {
  sm: "h-9 gap-1.5 rounded-xl px-4 text-xs font-bold",
  md: "h-11 gap-2 rounded-xl px-5 text-sm font-bold",
  lg: "h-12 gap-2.5 rounded-2xl px-6 text-sm font-black",
};

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:transform-none disabled:hover:shadow-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        icon && <span className="shrink-0 [&>svg]:h-[1.125em] [&>svg]:w-[1.125em] drop-shadow-sm">{icon}</span>
      )}
      {children}
    </button>
  )
);
AdminButton.displayName = "AdminButton";
