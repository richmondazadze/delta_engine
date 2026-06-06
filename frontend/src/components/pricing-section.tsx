"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";
import { PRICING_PLANS } from "@/lib/marketing-content";
import { useAccessToken } from "@/components/shell/AppProvider";
import { MarketingStagger, MarketingStaggerItem } from "@/components/marketing/MarketingReveal";
import * as api from "@/lib/data";

const ICONS: Record<(typeof PRICING_PLANS)[number]["icon"], ReactNode> = {
  users: <Users />,
  briefcase: <Briefcase />,
  building: <Building />,
};

export function PricingSection() {
  const router = useRouter();
  const getToken = useAccessToken();
  const [loading, setLoading] = useState<string | null>(null);

  const choosePlan = async (planId: string) => {
    setLoading(planId);
    try {
      const token = await getToken();
      if (!token) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      const res = await api.createBillingCheckout(token, {
        plan: planId,
        quantity: 2,
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      router.push("/settings/billing");
    } catch {
      router.push("/settings/billing");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="w-full">
      <MarketingStagger className="mx-auto grid w-full max-w-5xl items-stretch gap-8 md:grid-cols-3 md:gap-6">
        {PRICING_PLANS.map((plan, index) => (
          <MarketingStaggerItem key={plan.name} className="h-full">
            <PricingCard.Card
              className={
                index === 1
                  ? "shadow-[0_12px_40px_rgb(0_137_123_/_0.12)] ring-2 ring-[color-mix(in_oklab,var(--brand)_40%,var(--border))]"
                  : undefined
              }
            >
            <PricingCard.Header isPopular={index === 1}>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  {ICONS[plan.icon]}
                  <span>{plan.name}</span>
                </PricingCard.PlanName>
                {"badge" in plan && plan.badge ? (
                  <PricingCard.Badge>{plan.badge}</PricingCard.Badge>
                ) : (
                  <span className="invisible rounded-full border px-3 py-1 text-xs" aria-hidden>
                    Popular
                  </span>
                )}
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
                <PricingCard.Period>{plan.period}</PricingCard.Period>
              </PricingCard.Price>
              <Button
                className="h-11 w-full text-base font-semibold"
                variant={plan.variant}
                disabled={loading === plan.planId}
                onClick={() => choosePlan(plan.planId)}
              >
                {loading === plan.planId ? "Redirecting…" : "Choose plan"}
              </Button>
            </PricingCard.Header>

            <PricingCard.Body>
              <PricingCard.Description>{plan.description}</PricingCard.Description>
              <PricingCard.List>
                {plan.features.map((item) => (
                  <PricingCard.ListItem className="text-sm md:text-base" key={item}>
                    <CheckCircle2 aria-hidden="true" className="size-4 text-[var(--brand)]" />
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
          </MarketingStaggerItem>
        ))}
      </MarketingStagger>
    </section>
  );
}
