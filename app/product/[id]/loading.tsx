export default function ProductLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-50 pt-24 sm:pt-28">
      <main className="mx-auto max-w-6xl px-3 pb-20 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded-full bg-slate-200" />
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[360px] rounded-2xl bg-slate-200 sm:h-[460px]" />
              <div className="space-y-4">
                <div className="h-5 w-28 rounded bg-slate-200" />
                <div className="h-8 w-3/4 rounded bg-slate-200" />
                <div className="h-6 w-32 rounded bg-slate-200" />
                <div className="h-24 w-full rounded-2xl bg-slate-200" />
                <div className="h-12 w-full rounded-xl bg-slate-200" />
                <div className="h-12 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="h-56 rounded-3xl border border-slate-200 bg-white" />
        </div>
      </main>
    </div>
  );
}
