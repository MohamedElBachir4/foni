"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";

function RedirectBody() {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") || "";

  useEffect(() => {
    const target = q.trim()
      ? `/search?q=${encodeURIComponent(q.trim())}`
      : "/search";
    router.replace(target);
  }, [q, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center text-slate-500">جاري التوجيه…</div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center text-slate-500">…</div>
    </div>
  );
}

export default function SearchCategoriesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <RedirectBody />
    </Suspense>
  );
}
