import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { APP_SUPPORT_EMAIL } from "@/lib/brand";

export function FaqsSection() {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-10">
			<div className="space-y-4 text-center">
				<h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
					Pricing questions
				</h2>
				<p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
					Common questions about CopyMorphic plans, billing, platform support, and
					account setup.
				</p>
			</div>
			<Accordion className="rounded-sm border">
				{questions.map((item) => (
					<AccordionItem className="px-5 md:px-6" key={item.id} value={item.id}>
						<AccordionTrigger className="py-5 text-base font-medium hover:no-underline md:text-lg">
							{item.title}
						</AccordionTrigger>
						<AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground md:text-lg">
							{item.content}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
			<p className="text-center text-base text-muted-foreground md:text-lg">
				Can&apos;t find what you&apos;re looking for?{" "}
				<a
					className="font-medium text-[var(--brand)] hover:underline"
					href={`mailto:${APP_SUPPORT_EMAIL}`}
				>
					Contact support
				</a>{" "}
				or visit our{" "}
				<Link className="font-medium text-[var(--brand)] hover:underline" href="/compare">
					Compare page
				</Link>
				.
			</p>
		</div>
	);
}

const questions = [
	{
		id: "item-1",
		title: "Can I switch plans later?",
		content:
			"Yes. Upgrade, downgrade, or change billing cycles anytime from your dashboard. Changes apply on your next billing date.",
	},
	{
		id: "item-2",
		title: "What happens after the free trial?",
		content:
			"Your workspace remains accessible. You can choose a paid plan to continue copying at full capacity, or adjust account limits to match your selected tier.",
	},
	{
		id: "item-3",
		title: "Do you offer refunds?",
		content:
			"Refund requests are handled according to our billing policy. Contact support with your account details and we will review eligible cases.",
	},
	{
		id: "item-4",
		title: "Which platforms are supported?",
		content:
			"CopyMorphic integrates with MetaTrader 4, MetaTrader 5, cTrader, Match Trader, TradeLocker, DXtrade, NinjaTrader, Tradovate, ProjectX, and Rithmic from one connected stack.",
	},
	{
		id: "item-5",
		title: "Is there a setup fee?",
		content: "No setup fees. You pay for your selected plan and any optional add-ons only.",
	},
	{
		id: "item-6",
		title: "Can I cancel anytime?",
		content:
			"Yes. Cancel from account settings and retain access through the end of your current billing period.",
	},
	{
		id: "item-7",
		title: "When does the Developer API launch?",
		content:
			"The Developer API is on our public roadmap and will be announced when the first stable endpoints are available.",
	},
];
