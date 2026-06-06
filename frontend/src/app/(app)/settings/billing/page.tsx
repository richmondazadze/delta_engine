"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useApp, useAccessToken } from "@/components/shell/AppProvider";
import * as api from "@/lib/data";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { subscriptionPlan, accountLimit, followerLimit, accounts, toast } = useApp();
  const getToken = useAccessToken();
  const [quantity, setQuantity] = useState(Math.max(1, accounts.length || 1));
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<Awaited<ReturnType<typeof api.fetchBillingPlans>> | null>(
    null,
  );

  useEffect(() => {
    api.fetchBillingPlans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast("Subscription updated — limits refresh in a moment.", "ok");
    }
    if (searchParams.get("canceled") === "1") {
      toast("Checkout canceled.", "ok");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    setQuantity(Math.max(1, accounts.length || 1));
  }, [accounts.length]);

  const planLabel =
    subscriptionPlan === "free"
      ? "Free"
      : subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1);

  const checkout = async (plan: string, includeAnalyzer = false) => {
    setLoading(plan);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const res = await api.createBillingCheckout(token, {
        plan,
        quantity: plan === "analyzer" ? 1 : quantity,
        include_analyzer: includeAnalyzer,
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast(res.message || "Billing is not configured yet.", "ok");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Checkout failed", "err");
    } finally {
      setLoading(null);
    }
  };

  const portal = async () => {
    setLoading("portal");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const res = await api.openBillingPortal(token);
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast(res.message || "Portal unavailable", "ok");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not open portal", "err");
    } finally {
      setLoading(null);
    }
  };

  const standard = plans?.plans.find((p) => p.id === "standard");
  const premium = plans?.plans.find((p) => p.id === "premium");
  const analyzer = plans?.plans.find((p) => p.id === "analyzer");

  return (
    <div className="page-inner" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div className="pt">
          <h1>Billing</h1>
          <p className="desc">
            Per-account pricing — slightly below TradersConnect. You are on{" "}
            <strong>{planLabel}</strong> ({accountLimit} accounts, {followerLimit} copy links).
          </p>
        </div>
        <Link href="/settings" className="btn btn-ghost btn-sm">
          <Icon name="chevronLeft" size={14} />
          Settings
        </Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row spread" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Linked accounts</div>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
              Standard & Premium bill per account — set quantity to match how many you link.
            </p>
          </div>
          <div className="row gap8">
            <label className="faint" style={{ fontSize: 12 }} htmlFor="bill-qty">
              Accounts to bill
            </label>
            <input
              id="bill-qty"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="input"
              style={{ width: 72 }}
            />
          </div>
        </div>
        <p className="faint" style={{ margin: "12px 0 0", fontSize: 12 }}>
          Example: {quantity} account{quantity === 1 ? "" : "s"} on Standard ≈ $
          {(standard?.price_usd ?? 9) * quantity}/mo
        </p>
      </div>

      <div className="metric-grid" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <div className="faint" style={{ fontSize: 11, textTransform: "uppercase" }}>
            Standard
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>
            $9<span className="faint" style={{ fontSize: 13, fontWeight: 500 }}>/account/mo</span>
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
            Cloud copy, risk rules, logs. (TradersConnect: $10)
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={loading === "standard"}
            onClick={() => checkout("standard")}
          >
            {loading === "standard" ? "Redirecting…" : "Subscribe Standard"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="faint" style={{ fontSize: 11, textTransform: "uppercase" }}>
            Premium
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>
            $14<span className="faint" style={{ fontSize: 13, fontWeight: 500 }}>/account/mo</span>
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
            Priority routing & support. (TradersConnect: $15)
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={loading === "premium"}
            onClick={() => checkout("premium")}
          >
            {loading === "premium" ? "Redirecting…" : "Subscribe Premium"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="faint" style={{ fontSize: 11, textTransform: "uppercase" }}>
            Analyzer
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>
            $27.99<span className="faint" style={{ fontSize: 13, fontWeight: 500 }}>/mo</span>
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
            Portfolio analytics add-on. (TradersConnect: $29.99)
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading === "analyzer"}
            onClick={() => checkout("analyzer")}
          >
            {loading === "analyzer" ? "Redirecting…" : "Add Analyzer"}
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <p className="faint" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.6 }}>
          Stripe handles payments. After checkout, your account limits update automatically. To
          change quantity or payment method, use the customer portal.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={loading === "portal"}
          onClick={portal}
        >
          {loading === "portal" ? "Opening…" : "Manage billing in Stripe"}
        </button>
        {!standard?.configured && (
          <p className="faint" style={{ margin: "12px 0 0", fontSize: 12 }}>
            API: Stripe price IDs not set — see <code>docs/BILLING.md</code> in the repo.
          </p>
        )}
      </div>
    </div>
  );
}
