"use client";

interface AdminCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** يُطبَّق على حاوية المحتوى (تحت الهيدر) — مثل flex-1 و min-h-0 للتخطيط المرن داخل الشاشة */
  contentClassName?: string;
  /** تخصييس شريط العنوان (مثلاً تقليل الهوامش) */
  headerClassName?: string;
}

export function AdminCard({
  title,
  description,
  icon,
  actions,
  children,
  className = "",
  contentClassName = "",
  headerClassName = "",
}: AdminCardProps) {
  return (
    <section
      className={`group relative overflow-hidden rounded-3xl border border-white bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}
    >
      {(title || icon || actions) && (
        <div
          className={`shrink-0 border-b border-white/50 bg-white/40 px-4 py-3 sm:px-6 sm:py-4 ${headerClassName}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={`relative z-10 p-4 sm:p-6 ${contentClassName}`}>{children}</div>
    </section>
  );
}
