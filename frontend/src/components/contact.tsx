import { cn } from "@/lib/utils";
import type React from "react";
import { FullWidthDivider } from "@/components/full-width-divider";
import { APP_SUPPORT_EMAIL } from "@/lib/brand";
import { Mail } from "lucide-react";

export function Contact() {
	return (
		<div className="relative mx-auto min-h-0 max-w-6xl border-x">
			<div className="grid md:grid-cols-1">
				<Box
					className="border-b-0 md:border-r-0"
					description="We respond to all support emails within one business day. Enterprise and partnership inquiries welcome."
					icon={<Mail />}
					title="Email support"
				>
					<a
						className="font-medium font-mono text-base tracking-wide hover:underline"
						href={`mailto:${APP_SUPPORT_EMAIL}`}
					>
						{APP_SUPPORT_EMAIL}
					</a>
				</Box>
			</div>
			<FullWidthDivider />
		</div>
	);
}

type ContactBox = React.ComponentProps<"div"> & {
	icon: React.ReactNode;
	title: string;
	description: string;
};

function Box({
	title,
	description,
	className,
	children,
	...props
}: ContactBox) {
	return (
		<div
			className={cn(
				"flex flex-col justify-between border-b md:border-r md:border-b-0",
				className,
			)}
		>
			<div
				className={cn(
					"flex items-center gap-x-3 border-b bg-secondary/50 p-5 dark:bg-secondary/20",
					"[&_svg]:size-5 [&_svg]:text-[var(--brand)]",
				)}
			>
				{props.icon}
				<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
			</div>
			<div className="flex items-center gap-x-2 p-6 py-14 md:py-16">{children}</div>
			<div className="border-t p-5">
				<p className="text-base leading-relaxed text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}
