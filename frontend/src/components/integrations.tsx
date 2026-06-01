import { cn } from "@/lib/utils";

type TileData = {
	row: number;
	col: number;
	label?: string;
};

export function Integrations() {
	return (
		<div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 p-2 md:grid-cols-2 md:items-center md:gap-20">
			<div className="max-w-xl space-y-6">
				<h3 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
					Integrated across your full trading stack
				</h3>
				<p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
					CopyMorphic connects to major CFD and futures ecosystems so you can link
					accounts once, configure copy rules once, and monitor every pipeline from
					one operations dashboard.
				</p>
				<ul className="space-y-3 text-base leading-relaxed text-muted-foreground md:text-lg">
					<li>Cross-platform account linking with encrypted credentials</li>
					<li>Symbol mapping when broker naming differs between accounts</li>
					<li>Unified execution logs and risk controls across all connectors</li>
				</ul>
			</div>

			<div className="place-items-end">
				<div className="mask-[radial-gradient(ellipse_at_center,black,black,transparent)] relative size-90">
					{tiles.map((tile) => (
						<IntegrationCard key={`${tile.row}_${tile.col}`} {...tile} />
					))}
				</div>
			</div>
		</div>
	);
}

function IntegrationCard({ row, col, label }: TileData) {
	return (
		<div
			className={cn(
				"absolute flex size-18 items-center justify-center rounded-sm border px-2 text-center text-xs font-semibold leading-tight tracking-tight",
				label
					? "bg-card text-foreground shadow-xs dark:bg-card/60"
					: "bg-secondary/30 dark:bg-background",
			)}
			style={{
				left: col * 72,
				top: row * 72,
			}}
		>
			{label}
		</div>
	);
}

const tiles: TileData[] = [
	{ row: 0, col: 3, label: "MT5" },
	{ row: 1, col: 2, label: "cTrader" },
	{ row: 1, col: 4, label: "DXtrade" },
	{ row: 2, col: 1, label: "MT4" },
	{ row: 2, col: 3, label: "Tradovate" },
	{ row: 3, col: 2, label: "Rithmic" },
	{ row: 3, col: 4, label: "ProjectX" },
	{ row: 4, col: 1, label: "Match Trader" },
	{ row: 4, col: 3, label: "TradeLocker" },
	{ row: 0, col: 1 },
	{ row: 1, col: 0 },
	{ row: 3, col: 0 },
];
