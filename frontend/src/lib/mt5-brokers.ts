import { API_URL } from "./api";

export type MT5Broker = {
  slug: string;
  name: string;
  default_server: string;
  server_examples: string[];
  terminal_path: string | null;
  terminal_installed: boolean;
  verified: boolean;
  notes: string | null;
  recommended_vps_regions?: string[];
  latency_notes?: string | null;
};

let cached: MT5Broker[] | null = null;

export async function fetchMT5Brokers(): Promise<MT5Broker[]> {
  if (cached) return cached;
  const res = await fetch(`${API_URL}/api/integrations/mt5-brokers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load MT5 brokers");
  const data = (await res.json()) as { brokers: MT5Broker[] };
  cached = data.brokers;
  return cached;
}

export function getMT5Broker(
  brokers: MT5Broker[],
  slug: string,
): MT5Broker | undefined {
  return brokers.find((b) => b.slug === slug);
}
