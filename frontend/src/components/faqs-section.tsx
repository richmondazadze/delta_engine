import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { APP_SUPPORT_EMAIL } from "@/lib/brand";
import { FAQ_ITEMS, FAQ_SECTION } from "@/lib/marketing-content";

export function FaqsSection() {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-10">
			<div className="space-y-4 text-center">
				<h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
					{FAQ_SECTION.title}
				</h2>
				<p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
					{FAQ_SECTION.description}
				</p>
			</div>
			<Accordion className="rounded-sm border">
				{FAQ_ITEMS.map((item) => (
					<AccordionItem className="px-4 sm:px-5 md:px-6" key={item.id} value={item.id}>
						<AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline sm:py-5 md:text-lg">
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

