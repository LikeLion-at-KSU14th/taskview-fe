"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/client-api";
import type { User } from "@/lib/types";

interface SessionValue {
  user: User;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void requestJson<User | null>("/api/auth/me")
      .then((nextUser) => {
        if (!active) return;
        if (!nextUser) {
          router.replace("/login");
          return;
        }
        if (nextUser.onboarding_status === "workspace_setup") {
          router.replace("/onboarding/workspace");
          return;
        }
        if (nextUser.onboarding_status === "team_invite") {
          router.replace("/onboarding/invite");
          return;
        }
        setUser(nextUser);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "세션을 확인하지 못했습니다.");
      });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-tv-canvas p-6">
        <div className="tv-card flex max-w-lg items-center gap-3 p-5" role="alert">
          <CircleAlert className="size-5 shrink-0 text-tv-red-600" />
          <p className="flex-1 text-sm text-tv-slate-dark">{error}</p>
          <Button onClick={() => location.reload()} size="sm" variant="outline">다시 시도</Button>
        </div>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-tv-canvas p-6">
        <div className="flex flex-col items-center gap-3 text-tv-gray" role="status">
          <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-tv-blue-500" />
          <p className="text-[12px]">안전한 세션을 확인하고 있습니다.</p>
        </div>
      </main>
    );
  }

  return <SessionContext.Provider value={{ user, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession은 SessionProvider 안에서 사용해야 합니다.");
  return value;
}
