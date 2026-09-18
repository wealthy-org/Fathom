"use client";

import { useEffect, useState } from "react";

export interface SessionState {
  authenticated: boolean;
  walletAddress: string | null;
}

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession({
        authenticated: !!data.authenticated,
        walletAddress: data.walletAddress ?? null,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setSession({
          authenticated: !!data.authenticated,
          walletAddress: data.walletAddress ?? null,
        });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { session, isLoading, refresh };
}
