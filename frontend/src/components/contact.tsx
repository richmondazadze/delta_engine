import { cn } from "@/lib/utils";
import type React from "react";
import { GithubIcon } from "@/components/github-icon";
import { XIcon } from "@/components/x-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { APP_SUPPORT_EMAIL } from "@/lib/brand";
import { Mail, MapPin, Phone } from "lucide-react";

const APP_PHONE = "+1 212 555 0142";

export function Contact() {
	const socialLinks = [
		{
			icon: <GithubIcon className="size-4 text-muted-foreground" />,
			href: "#",
			label: "GitHub",
		},
		{
			icon: <XIcon className="size-4 text-muted-foreground" />,
			href: "#",
			label: "X",
		},
	];

	return (
		<div className="relative mx-auto min-h-0 max-w-6xl border-x">
			<div className="grid md:grid-cols-3">
				<Box
					description="We respond to all support emails within one business day."
					icon={<Mail />}
					title="Email"
				>
					<a
						className="font-medium font-mono text-base tracking-wide hover:underline"
						href={`mailto:${APP_SUPPORT_EMAIL}`}
					>
						{APP_SUPPORT_EMAIL}
					</a>
				</Box>
				<Box
					description="Enterprise and partnership inquiries welcome."
					icon={<MapPin />}
					title="Office"
				>
					<span className="font-medium text-base leading-relaxed tracking-wide">
						Suite 410, 88 Broad St, New York, NY 10004
					</span>
				</Box>
				<Box
					className="border-b-0 md:border-r-0"
					description="Available Mon–Fri, 9am–6pm ET for priority accounts."
					icon={<Phone />}
					title="Phone"
				>
					<a
						className="block font-medium font-mono text-base tracking-wide hover:underline"
						href={`tel:${APP_PHONE}`}
					>
						{APP_PHONE}
					</a>
				</Box>
			</div>
			<FullWidthDivider />
			<div className="z-1 flex h-full flex-col items-center justify-center gap-5 py-16 md:py-20">
				<h2 className="text-center text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl">
					Find us <span className="text-foreground">online</span>
				</h2>
				<div className="flex flex-wrap items-center justify-center gap-3">
					{socialLinks.map((link) => (
						<a
							className="flex items-center gap-x-2 rounded-full border bg-card px-4 py-2 shadow transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent active:scale-[0.98]"
							href={link.href}
							key={link.label}
							rel="noopener noreferrer"
							target="_blank"
						>
							{link.icon}
							<span className="font-medium font-mono text-sm tracking-wide">
								{link.label}
							</span>
						</a>
					))}
				</div>
			</div>
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
