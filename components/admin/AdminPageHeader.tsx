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
      className={`mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white/60 p-6 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-xl ${className}`}
      style={{ animation: 'fade-in-up 0.5s ease-out both' }}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
