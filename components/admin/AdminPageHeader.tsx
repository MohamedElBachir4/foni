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
      className={`mb-4 flex flex-col gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/60 sm:mb-8 sm:gap-5 sm:bg-white/60 sm:p-6 sm:backdrop-blur-xl md:flex-row md:items-center md:justify-between ${className}`}
      style={{ animation: "fade-in-up 0.5s ease-out both" }}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/20 sm:h-12 sm:w-12 sm:shadow-lg [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 sm:mt-1 sm:line-clamp-none sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3 [&>*]:min-h-[40px] [&>*]:min-w-0 [&>button]:flex-1 [&>a]:flex-1 sm:[&>button]:flex-none sm:[&>a]:flex-none">
          {actions}
        </div>
      )}
    </header>
  );
}
