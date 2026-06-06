"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";
import { PRICING_PLANS } from "@/lib/marketing-content";
import { useAccessToken } from "@/components/shell/AppProvider";
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
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-3 md:gap-6">
        {PRICING_PLANS.map((plan, index) => (
          <PricingCard.Card
            className={cn("w-full max-w-full", index === 1 && "md:scale-[1.02]")}
            key={plan.name}
          >
            <PricingCard.Header isPopular={index === 1}>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  {ICONS[plan.icon]}
                  <span>{plan.name}</span>
                </PricingCard.PlanName>
                {"badge" in plan && plan.badge && (
                  <PricingCard.Badge>{plan.badge}</PricingCard.Badge>
                )}
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
                <PricingCard.Period>{plan.period}</PricingCard.Period>
              </PricingCard.Price>
              <Button
                className="h-11 w-full rounded-sm text-base font-semibold transition-transform duration-200 ease-out active:scale-[0.98]"
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
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
        Slightly below{" "}
        <a
          href="https://tradersconnect.com/pricing"
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          TradersConnect
        </a>{" "}
        per-account rates.{" "}
        <Link href="/settings/billing" className="underline underline-offset-2">
          Adjust account quantity
        </Link>{" "}
        before checkout.
      </p>
    </section>
  );
}
