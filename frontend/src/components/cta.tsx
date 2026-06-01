import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { ArrowRightIcon } from "lucide-react";

export function CallToAction() {
	return (
		<div className="relative mx-auto flex w-full max-w-4xl flex-col justify-between gap-y-8 border-y px-6 py-14 dark:bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)] md:px-10 md:py-20">
			<DecorIcon className="size-4" position="top-left" />
			<DecorIcon className="size-4" position="top-right" />
			<DecorIcon className="size-4" position="bottom-left" />
			<DecorIcon className="size-4" position="bottom-right" />

			<div className="pointer-events-none absolute -inset-y-6 -left-px w-px border-l" />
			<div className="pointer-events-none absolute -inset-y-6 -right-px w-px border-r" />
			<div className="absolute top-0 left-1/2 -z-10 h-full border-l border-dashed" />

			<h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
				Ready to copy with full visibility?
			</h2>
			<p className="mx-auto max-w-2xl text-balance text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
				Create your CopyMorphic workspace, connect your accounts, and launch your first
				copy pipeline in minutes — with risk controls and forensic logs from day one.
			</p>

			<div className="flex flex-wrap items-center justify-center gap-4">
				<Button
					size="lg"
					variant="outline"
					className="h-12 px-7 text-base transition-transform duration-200 ease-out active:scale-[0.97]"
					render={<Link href="/compare" />}
					nativeButton={false}
				>
					Contact sales
				</Button>
				<Button
					size="lg"
					className="h-12 px-7 text-base transition-transform duration-200 ease-out active:scale-[0.97]"
					render={<Link href="/register" />}
					nativeButton={false}
				>
					Get started
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
		</div>
	);
}
