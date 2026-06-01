import { LogoCloud } from "@/components/logo-cloud";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";

export function LogosSection() {
	return (
		<section>
			<FullWidthDivider className="-top-px" />
			<div className="relative *:border-0">
				<DecorIcon className="size-4" position="top-left" />
				<DecorIcon className="size-4" position="top-right" />
				<DecorIcon className="size-4" position="bottom-left" />
				<DecorIcon className="size-4" position="bottom-right" />
				<LogoCloud />
			</div>
			<FullWidthDivider className="-bottom-px" />
		</section>
	);
}
