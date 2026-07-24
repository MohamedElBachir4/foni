/**
 * سجلّ أخطاء موحّد على الخادم — يطبع سطراً واحداً JSON قابلاً للبحث (grep '"tag":"foni_error"')
 * في سجلات PM2. الهدف: عدم فقدان السبب الأصلي للاستثناء الذي يُخفيه Next.js عن العميل في
 * الإنتاج ("An error occurred in the Server Components render... omitted in production").
 */
export type ServerErrorContext = {
  /** مسار الملف/المسار المنطقي الذي حدث فيه الخطأ، مثال: "app/product/[id]/page.tsx" */
  route: string;
  pathname?: string;
  params?: Record<string, unknown>;
  searchParams?: Record<string, unknown>;
  digest?: string;
  requestId?: string;
  extra?: Record<string, unknown>;
};

function serializeError(err: unknown): { message: string; stack?: string; name?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack, name: err.name };
  }
  return { message: String(err) };
}

export function logServerError(err: unknown, ctx: ServerErrorContext): void {
  const serialized = serializeError(err);
  const line = {
    tag: "foni_error",
    ts: new Date().toISOString(),
    route: ctx.route,
    pathname: ctx.pathname,
    params: ctx.params,
    searchParams: ctx.searchParams,
    digest: ctx.digest,
    requestId: ctx.requestId,
    error: serialized,
    extra: ctx.extra,
  };
  // console.error يصل إلى foni-frontend-error.log تحت PM2 — سطر JSON واحد لسهولة grep/parse.
  console.error(JSON.stringify(line));
}
