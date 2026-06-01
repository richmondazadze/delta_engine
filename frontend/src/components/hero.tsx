import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { ArrowRightIcon } from "lucide-react";
import { HERO } from "@/lib/marketing-content";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";

export function HeroSection() {
	return (
		<section>
			<div className="relative flex flex-col items-center justify-center gap-8 px-4 py-20 md:gap-10 md:px-6 md:py-32 lg:py-36">
				<div aria-hidden="true" className="absolute inset-0 -z-1 size-full overflow-hidden">
					<div
						className={cn(
							"absolute -inset-x-20 inset-y-0 z-0 rounded-full",
							"bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--brand)_12%,transparent),transparent,transparent)]",
							"blur-[50px]",
						)}
					/>
					<div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
					<div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
				</div>

				<Link
					className={cn(
						"group mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1.5 shadow",
						"transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
					)}
					href="/register"
				>
					<div className="rounded-xs border bg-card px-2 py-0.5 shadow-sm">
						<p className="font-mono text-xs font-semibold text-[var(--brand)]">LIVE</p>
					</div>
					<span className="text-sm font-medium">{HERO.kicker}</span>
					<span className="block h-5 border-l" />
					<ArrowRightIcon className="size-3.5 -translate-x-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
				</Link>

				<h1 className="max-w-4xl text-balance text-center text-4xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
					{HERO.title}
				</h1>

				<p className="max-w-3xl text-balance text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
					{HERO.description}
				</p>

				<div className="flex w-fit flex-wrap items-center justify-center gap-4 pt-2">
					<Button
						size="lg"
						className="h-12 px-7 text-base"
						render={<Link href="/register" />}
						nativeButton={false}
					>
						{HERO.primaryCta}
						<ArrowRightIcon data-icon="inline-end" />
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="h-12 px-7 text-base"
						render={<Link href="/pricing" />}
						nativeButton={false}
					>
						{HERO.secondaryCta}
					</Button>
				</div>

				<p className="text-center text-base text-muted-foreground">
					Start free today · Cancel anytime · No setup fees
				</p>
			</div>

			<div className="relative mx-auto max-w-6xl px-4 md:px-6">
				<DecorIcon className="size-4" position="top-left" />
				<DecorIcon className="size-4" position="top-right" />
				<DecorIcon className="size-4" position="bottom-left" />
				<DecorIcon className="size-4" position="bottom-right" />
				<FullWidthDivider className="-top-px" />
				<div
					className="overflow-hidden rounded-sm shadow-[0_24px_80px_rgb(0_137_123_/_0.12)]"
					role="img"
					aria-label="CopyMorphic dashboard — command control overview"
				>
					<DashboardPreview />
				</div>
				<FullWidthDivider className="-bottom-px" />
			</div>
		</section>
	);
}
