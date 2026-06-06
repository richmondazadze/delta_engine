"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";

export const navLinks = [
	{ label: "Copier", href: "/copier" },
	{ label: "Analyzer", href: "/analyzer" },
	{ label: "Compare", href: "/compare" },
	{ label: "Pricing", href: "/pricing" },
];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full max-w-6xl border-transparent border-b px-3 pt-3 sm:px-4 sm:pt-4 md:px-6",
				"transition-[border-color,background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
				scrolled &&
					"border-border bg-background/95 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/80 md:top-3 md:rounded-sm",
			)}
		>
			<nav className="flex h-14 w-full min-w-0 items-center justify-between sm:h-16 md:h-[4.25rem]">
				<Link
					className="shrink-0 rounded-sm p-1.5 transition-[background-color,transform] duration-200 ease-out hover:bg-muted active:scale-[0.98] dark:hover:bg-muted/50 sm:p-2"
					href="/"
				>
					<Logo />
				</Link>
				<div className="hidden items-center gap-1 lg:flex">
					{navLinks.map((link) => (
						<Button
							key={link.label}
							size="default"
							variant="ghost"
							className="mk-nav-link h-11 px-4 text-base"
							render={<Link href={link.href} />}
							nativeButton={false}
						>
							{link.label}
						</Button>
					))}
					<div className="ml-3 flex items-center gap-2 border-l pl-4">
						<Button
							size="default"
							variant="outline"
							className="h-10 px-5"
							render={<Link href="/login" />}
							nativeButton={false}
						>
							Sign in
						</Button>
						<Button
							size="default"
							className="h-10 px-5"
							render={<Link href="/register" />}
							nativeButton={false}
						>
							Get started
						</Button>
					</div>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
