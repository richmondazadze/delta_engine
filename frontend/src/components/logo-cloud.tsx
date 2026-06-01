import { PLATFORMS } from "@/lib/marketing-content";

export function LogoCloud() {
	return (
		<div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border bg-border md:grid-cols-5">
			{PLATFORMS.map((platform) => (
				<div key={platform} className="mk-platform-badge bg-background">
					{platform}
				</div>
			))}
		</div>
	);
}
