"use client";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon,
  actions,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <header
      className={`mb-5 flex flex-col gap-4 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-xl sm:mb-8 sm:gap-5 sm:p-6 md:flex-row md:items-center md:justify-between ${className}`}
      style={{ animation: "fade-in-up 0.5s ease-out both" }}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20 sm:h-12 sm:w-12">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
