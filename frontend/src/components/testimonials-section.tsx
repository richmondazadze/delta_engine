import { cn } from "@/lib/utils";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { DecorIcon } from "@/components/decor-icon";
import { QuoteIcon } from "lucide-react";

type Testimonial = {
	quote: string;
	name: string;
	role: string;
	company: string;
	image: string;
};

const testimonials: Testimonial[] = [
	{
		quote:
			"Copy paths execute before I can blink. The control over latency and logs is exactly what we needed.",
		image: "https://unavatar.io/x/tim_cook",
		name: "A. Rahman",
		role: "Prop Trader",
		company: "Independent Desk",
	},
	{
		quote:
			"We replaced scattered VPS scripts with one dashboard. Monitoring and accountability improved instantly.",
		image: "https://unavatar.io/x/JeffBezos",
		name: "M. Costa",
		role: "Operations Lead",
		company: "Multi-Account Team",
	},
	{
		quote:
			"Analyzer insights made it obvious which strategies were stable and which ones were leaking risk.",
		image: "https://unavatar.io/x/sama",
		name: "J. Bennett",
		role: "Portfolio Manager",
		company: "Signal Group",
	},
];

export function TestimonialsSection() {
	return (
		<div className="mx-auto grid w-full max-w-5xl gap-8 pt-4 md:grid-cols-3 md:gap-8 md:pt-8">
			{testimonials.map((testimonial, index) => (
				<TestimonialCard
					index={index}
					key={testimonial.name}
					testimonial={testimonial}
				/>
			))}
		</div>
	);
}

function TestimonialCard({
	testimonial,
	index,
	className,
	...props
}: React.ComponentProps<"figure"> & {
	testimonial: Testimonial;
	index: number;
}) {
	const { quote, name, role, company, image } = testimonial;

	return (
		<figure
			className={cn(
				"relative flex flex-col justify-between gap-6 px-8 pt-10 pb-8 shadow-xs md:translate-y-[calc(2.5rem*var(--t-card-index))]",
				"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]",
				className
			)}
			style={
				{
					"--t-card-index": index,
				} as React.CSSProperties
			}
			{...props}
		>
			<div className="absolute -inset-y-4 -left-px w-px bg-border" />
			<div className="absolute -inset-y-4 -right-px w-px bg-border" />
			<div className="absolute -inset-x-4 -top-px h-px bg-border" />
			<div className="absolute -right-4 -bottom-px -left-4 h-px bg-border" />
			<DecorIcon className="size-3.5" position="top-left" />

			<blockquote className="flex gap-4">
				<QuoteIcon aria-hidden="true" className="size-6 shrink-0 stroke-1" />

				<p className="flex-1 text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
					{quote}
				</p>
			</blockquote>

			<figcaption className="flex items-center gap-3">
				<Avatar className="size-10 rounded-full ring-2 ring-border ring-offset-2 ring-offset-background transition-shadow group-hover:ring-foreground/20">
					<AvatarImage alt={`${name}'s profile picture`} src={image} />
					<AvatarFallback>{name.charAt(0)}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col">
					<cite className="font-medium text-foreground text-base not-italic">
						{name}
					</cite>
					<p className="text-muted-foreground text-sm md:text-base">
						{role}, <span className="text-foreground/80">{company}</span>
					</p>
				</div>
			</figcaption>
		</figure>
	);
}
