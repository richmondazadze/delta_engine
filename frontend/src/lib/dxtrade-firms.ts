import { API_URL } from "./api";

export type DXtradeFirm = {
  slug: string;
  name: string;
  api_base_url: string;
  default_domain: string;
  login_path: string;
  verified: boolean;
  notes: string | null;
  trader_url: string | null;
};

let cached: DXtradeFirm[] | null = null;

export async function fetchDXtradeFirms(): Promise<DXtradeFirm[]> {
  if (cached) return cached;
  const res = await fetch(`${API_URL}/api/integrations/dxtrade-firms`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load DXtrade firms");
  const data = (await res.json()) as { firms: DXtradeFirm[] };
  cached = data.firms;
  return cached;
}

export function getDXtradeFirm(
  firms: DXtradeFirm[],
  slug: string,
): DXtradeFirm | undefined {
  return firms.find((f) => f.slug === slug);
}
