import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";

type Plan = {
	icon: ReactNode;
	description: string;
	name: string;
	price: string;
	period?: string;
	variant: "outline" | "default";
	features: string[];
	badge?: string;
	original?: string;
};

export function PricingSection() {
	return (
		<section className="w-full">
			<div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-3 md:gap-6">
				{plans.map((plan, index) => (
					<PricingCard.Card
						className={cn("w-full max-w-full", index === 1 && "md:scale-[1.02]")}
						key={plan.name}
					>
						<PricingCard.Header isPopular={index === 1}>
							<PricingCard.Plan>
								<PricingCard.PlanName>
									{plan.icon}
									<span>{plan.name}</span>
								</PricingCard.PlanName>
								{plan.badge && (
									<PricingCard.Badge>{plan.badge}</PricingCard.Badge>
								)}
							</PricingCard.Plan>
							<PricingCard.Price>
								<PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
								<PricingCard.Period>{plan.period}</PricingCard.Period>
								{plan.original && (
									<PricingCard.OriginalPrice className="ml-auto">
										{plan.original}
									</PricingCard.OriginalPrice>
								)}
							</PricingCard.Price>
							<Button
								className="h-11 w-full text-base font-semibold transition-transform duration-200 ease-out active:scale-[0.98]"
								variant={plan.variant}
							>
								Choose plan
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
		</section>
	);
}

const plans: Plan[] = [
	{
		icon: <Users />,
		description: "Ideal for retail traders getting started with cloud copying.",
		name: "Standard",
		price: "$10",
		period: "/month",
		variant: "outline",
		features: [
			"Multi-platform account linking",
			"Equity protection rules",
			"No setup fees",
			"Pay per account",
			"Forensic execution logs",
			"Email support",
		],
	},
	{
		icon: <Briefcase />,
		description: "For advanced traders who need low-latency copy execution.",
		name: "Premium",
		badge: "Popular",
		price: "$30",
		period: "/month",
		variant: "default",
		features: [
			"Everything in Standard",
			"Low-latency execution path",
			"HFT-friendly routing",
			"Priority support",
			"Analyzer add-on ready",
			"Dedicated environment option",
		],
	},
	{
		icon: <Building />,
		name: "Scale",
		description: "For multi-account desks, prop teams, and signal providers.",
		price: "$99",
		period: "/month",
		variant: "outline",
		features: [
			"Everything in Premium",
			"Higher account limits",
			"Multi-master architecture",
			"Advanced audit trail",
			"Team seats",
			"Enterprise onboarding",
		],
	},
];
