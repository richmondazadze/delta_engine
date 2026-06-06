"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import * as api from "@/lib/data";
import { AdminShell } from "./AdminShell";

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/login?next=/admin/overview");
        return;
      }
      try {
        const profile = await api.fetchUserProfile(session.access_token);
        if (profile.subscription_plan !== "admin") {
          router.replace("/dashboard");
          return;
        }
        if (mounted) {
          setEmail(profile.email || session.user.email || "");
          setReady(true);
        }
      } catch {
        router.replace("/dashboard");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, supabase.auth]);

  if (!ready) {
    return (
      <div className="admin-loading">Loading operations console…</div>
    );
  }

  return <AdminShell email={email}>{children}</AdminShell>;
}
