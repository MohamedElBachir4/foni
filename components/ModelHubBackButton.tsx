import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ModelHubBackButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] sm:mb-6 sm:min-h-12 sm:px-5 sm:text-base"
    >
      <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
