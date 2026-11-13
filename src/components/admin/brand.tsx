import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className, href = "/admin" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-heading text-lg font-extrabold tracking-tight", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/deped.png" alt="" width={32} height={32} className="size-8 object-contain" />
      <span>
        DepEd <span className="text-brand">Bayugan</span>
      </span>
    </Link>
  );
}
