import Image from "next/image";
import Link from "next/link";

export function Logo({ wordmark = true }: { wordmark?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
      {/* Logo — warna dari PNG itu sendiri, tanpa filter/CSS. */}
      <Image
        src="/logo-accent.png"
        alt="Fathom"
        width={40}
        height={40}
        className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
      />
      {wordmark && (
        <span className="truncate font-display text-base font-semibold tracking-tight sm:text-lg font-mono">
          Fathom
        </span>
      )}
    </Link>
  );
}
