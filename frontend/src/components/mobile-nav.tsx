import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { navLinks } from "@/components/header";
import Link from "next/link";
import { XIcon, MenuIcon } from "lucide-react";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const [closing, setClosing] = React.useState(false);

	const closeMenu = React.useCallback(() => {
		setClosing(true);
		window.setTimeout(() => {
			setOpen(false);
			setClosing(false);
		}, 150);
	}, []);

	React.useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	return (
		<div className="lg:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label={open ? "Close menu" : "Open menu"}
				className="h-10 w-10 transition-transform duration-200 ease-out active:scale-[0.97]"
				onClick={() => (open ? closeMenu() : setOpen(true))}
				size="icon"
				variant="outline"
			>
				{open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
			</Button>
			{open && (
				<Portal className="top-[5.25rem]" id="mobile-menu">
					<PortalBackdrop onClick={closeMenu} />
					<div
						className={cn(
							"t-dropdown size-full p-5",
							closing ? "is-closing" : "is-open",
						)}
						data-origin="top-right"
					>
						<div className="grid gap-y-1">
							{navLinks.map((link) => (
								<Button
									key={link.label}
									className="mk-nav-link h-12 justify-start px-4 text-base"
									variant="ghost"
									render={<Link href={link.href} onClick={closeMenu} />}
									nativeButton={false}
								>
									{link.label}
								</Button>
							))}
						</div>
						<div className="mt-8 flex flex-col gap-3 border-t pt-6">
							<Button
								className="h-11 w-full text-base"
								variant="outline"
								render={<Link href="/login" onClick={closeMenu} />}
								nativeButton={false}
							>
								Sign in
							</Button>
							<Button
								className="h-11 w-full text-base"
								render={<Link href="/register" onClick={closeMenu} />}
								nativeButton={false}
							>
								Get started
							</Button>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
