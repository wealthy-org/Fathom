import Image from "next/image";
import Link from "next/link";
import { SearchWalletForm } from "@/components/search-wallet-form";
import { ConnectButton } from "@/components/connect-button";

export function WalletShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="bg-stars" />
      <div className="bg-grid" />

      <header className="border-b border-ink/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo-no-bg.png"
              alt="Fathom"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-display text-lg font-semibold tracking-tight">
              Fathom
            </span>
          </Link>
          <ConnectButton className="shrink-0 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        <SearchWalletForm hint={false} size="md" />
        <div className="mt-14">{children}</div>
      </main>
    </div>
  );
}
