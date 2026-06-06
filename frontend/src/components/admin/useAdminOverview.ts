"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccessToken } from "@/components/shell/AppProvider";
import * as api from "@/lib/data";
import type { AdminOverview } from "@/lib/types";

export function useAdminOverview() {
  const getToken = useAccessToken();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const data = await api.fetchAdminOverview(token);
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { overview, loading, error, reload };
}
