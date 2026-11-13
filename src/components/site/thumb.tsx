import Image from "next/image";
import { SUPABASE_URL } from "@/lib/supabase/config";

const optimizable = (url: string) => url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);

/** Cover image inside a sized `.thumb` box. Falls back to a branded placeholder. */
export function Thumb({
  src,
  alt,
  sizes,
  priority = false,
  className = "thumb",
}: {
  src: string | null;
  alt?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!optimizable(src)}
        />
      ) : (
        <div className="ph" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/deped.png" alt="" />
        </div>
      )}
    </div>
  );
}
