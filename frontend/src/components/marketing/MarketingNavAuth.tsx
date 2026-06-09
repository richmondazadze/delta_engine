"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  layout?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function MarketingNavAuth({ layout = "desktop", onNavigate }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const close = () => onNavigate?.();

  if (layout === "mobile") {
    if (loggedIn && ready) {
      return (
        <Button
          className="h-11 w-full text-base"
          render={<Link href="/dashboard" onClick={close} />}
          nativeButton={false}
        >
          Go to dashboard
        </Button>
      );
    }
    return (
      <>
        <Button
          className="h-11 w-full text-base"
          variant="outline"
          render={<Link href="/login" onClick={close} />}
          nativeButton={false}
        >
          Sign in
        </Button>
        <Button
          className="h-11 w-full text-base"
          render={<Link href="/register" onClick={close} />}
          nativeButton={false}
        >
          Get started
        </Button>
      </>
    );
  }

  if (loggedIn && ready) {
    return (
      <div className="ml-3 flex items-center gap-2 border-l pl-4">
        <Button
          size="default"
          className="h-10 px-5"
          render={<Link href="/dashboard" />}
          nativeButton={false}
        >
          Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="ml-3 flex items-center gap-2 border-l pl-4">
      <Button
        size="default"
        variant="outline"
        className="h-10 px-5"
        render={<Link href="/login" />}
        nativeButton={false}
      >
        Sign in
      </Button>
      <Button
        size="default"
        className="h-10 px-5"
        render={<Link href="/register" />}
        nativeButton={false}
      >
        Get started
      </Button>
    </div>
  );
}
