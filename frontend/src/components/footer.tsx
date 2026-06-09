"use client";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_NAME, APP_TAGLINE, APP_SUPPORT_EMAIL } from "@/lib/brand";

type FooterLink = {
	title: string;
	href: string;
	icon?: ReactNode;
};

type FooterSection = {
	label: string;
	links: FooterLink[];
};

const footerLinks: FooterSection[] = [
	{
		label: "Platform",
		links: [
			{ title: "Copier", href: "/copier" },
			{ title: "Analyzer", href: "/analyzer" },
			{ title: "Platforms", href: "/compare" },
			{ title: "Pricing", href: "/pricing" },
		],
	},
	{
		label: "About",
		links: [
			{ title: "FAQ", href: "/#faq" },
			{ title: "Supported platforms", href: "/#supported-platforms" },
			{ title: "Contact", href: "/compare#contact" },
		],
	},
	{
		label: "Legal",
		links: [
			{ title: "Terms of Use", href: "/terms" },
			{ title: "Privacy Policy", href: "/privacy" },
			{ title: "Pricing", href: "/pricing" },
		],
	},
];

export function Footer() {
	return (
		<footer
			className={cn(
				"relative mx-auto mt-8 flex w-full max-w-6xl flex-col items-center justify-center overflow-x-clip border-t px-4 md:mt-16 md:px-8",
				"dark:bg-[radial-gradient(35%_128px_at_50%_0%,--theme(--color-foreground/.1),transparent)]",
			)}
		>
			<div className="absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/20 blur" />

			<div className="grid w-full gap-12 py-12 md:grid-cols-3 md:py-16 lg:gap-16">
				<AnimatedContainer className="space-y-5">
					<Link href="/" className="inline-block">
						<Logo />
					</Link>
					<p className="max-w-sm text-base leading-relaxed text-muted-foreground">
						{APP_TAGLINE}
					</p>
					<p className="text-base text-muted-foreground">
						<a
							className="font-medium text-foreground transition-colors hover:text-[var(--brand)]"
							href={`mailto:${APP_SUPPORT_EMAIL}`}
						>
							{APP_SUPPORT_EMAIL}
						</a>
					</p>
				</AnimatedContainer>

				<div className="grid grid-cols-2 gap-10 md:col-span-2 md:grid-cols-3 md:gap-8">
					{footerLinks.map((section, index) => (
						<AnimatedContainer delay={0.1 + index * 0.08} key={section.label}>
							<div>
								<h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
									{section.label}
								</h3>
								<ul className="mt-5 space-y-3 text-base text-muted-foreground">
									{section.links.map((link) => (
										<li key={link.title}>
											<Link
												className="inline-flex items-center transition-colors duration-200 hover:text-foreground [&_svg]:me-1.5 [&_svg]:size-3.5"
												href={link.href}
											>
												{link.icon}
												{link.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
			<div className="h-px w-full bg-linear-to-r via-border" />
			<div className="flex w-full flex-col items-center justify-center gap-2 py-8 text-center">
				<p className="text-base text-muted-foreground">
					&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
				</p>
				<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
					Futures and forex trading contains substantial risk and is not for every
					investor. Only risk capital should be used for trading.
				</p>
			</div>
		</footer>
	);
}

function AnimatedContainer({
	className,
	delay = 0.1,
	children,
}: {
	delay?: number;
	className?: string;
	children: ReactNode;
}) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			initial={{ filter: "blur(4px)", translateY: 12, opacity: 0 }}
			transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
			viewport={{ once: true }}
			whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
		>
			{children}
		</motion.div>
	);
}
