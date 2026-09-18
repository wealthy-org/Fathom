"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function Arrow() {
  return (
    <svg
      className="transition-transform duration-300 group-hover:translate-x-1"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function SearchWalletForm({
  hint = true,
  size = "md",
}: {
  hint?: boolean;
  size?: "md" | "sm";
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a wallet address.");
      return;
    }
    if (!ADDRESS_RE.test(trimmed)) {
      setError("That doesn't look like a valid 0x address.");
      return;
    }
    setError(null);
    router.push(`/wallets/${trimmed.toLowerCase()}`);
  }

  const compact = size === "sm";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="0x7A3…91F2"
          spellCheck={false}
          autoComplete="off"
          className={`min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.03] font-mono text-white placeholder:text-white/30 focus:border-accent/60 focus:outline-none ${
            compact ? "h-10 px-4 text-xs" : "h-12 px-5 text-sm"
          }`}
        />
        <button
          type="submit"
          className="group relative inline-flex shrink-0 overflow-hidden rounded-full bg-white p-[1px] transition duration-300 hover:scale-105"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-accent via-purple to-accent opacity-0 transition duration-300 group-hover:opacity-100" />
          <span
            className={`relative flex items-center justify-center gap-2 rounded-full bg-white font-semibold text-black ${
              compact ? "h-10 px-4 text-xs" : "h-12 px-6 text-sm"
            }`}
          >
            {compact ? "Search" : "Search a Wallet"}
            <Arrow />
          </span>
        </button>
      </div>
      {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
      {hint && (
        <p className="mt-3 text-xs text-slate400">
          No account required. Enter any wallet address to inspect it.
        </p>
      )}
    </form>
  );
}
