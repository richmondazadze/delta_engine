import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/PlatformIcon";
import { getPlatform } from "@/lib/platforms";
import type { PlatformDefinition } from "@/lib/platforms";

const TILE = 104;
const TILE_BOX = "h-[6.5rem] w-[6.5rem]";

type TileData = {
  row: number;
  col: number;
  platformId?: PlatformDefinition["id"];
};

export function Integrations() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 p-2 md:grid-cols-2 md:items-center md:gap-20">
      <div className="max-w-xl space-y-6">
        <h3 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Your full trading stack — connected
        </h3>
        <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
          CopyMorphic links MT4, MT5, cTrader, DXtrade, TradeLocker, and futures
          ecosystems so you configure once and operate everywhere — with symbol mapping
          when broker naming differs.
        </p>
        <ul className="space-y-3 text-base leading-relaxed text-muted-foreground md:text-lg">
          <li>Cross-platform account linking with encrypted credentials</li>
          <li>Unified copy rules, risk controls, and execution logs across connectors</li>
          <li>One dashboard for prop firms, futures desks, and multi-account traders</li>
        </ul>
      </div>

      <div className="place-items-end">
        <div
          className="mask-[radial-gradient(ellipse_at_center,black,black,transparent)] relative"
          style={{ width: TILE * 5, height: TILE * 5 }}
        >
          {tiles.map((tile) => (
            <IntegrationCard key={`${tile.row}_${tile.col}`} {...tile} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ row, col, platformId }: TileData) {
  const platform = platformId ? getPlatform(platformId) : undefined;

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center rounded-sm border p-3",
        TILE_BOX,
        platform
          ? "bg-card text-foreground shadow-xs dark:bg-card/60"
          : "bg-secondary/30 dark:bg-background",
      )}
      style={{
        left: col * TILE,
        top: row * TILE,
      }}
    >
      {platform ? (
        <PlatformIcon
          platform={platform}
          size="lg"
          iconClassName="!h-14 !w-[5.5rem] bg-transparent"
        />
      ) : null}
    </div>
  );
}

const tiles: TileData[] = [
  { row: 0, col: 3, platformId: "mt5" },
  { row: 1, col: 2, platformId: "ctrader" },
  { row: 1, col: 4, platformId: "dxtrade" },
  { row: 2, col: 1, platformId: "mt4" },
  { row: 2, col: 3, platformId: "tradovate" },
  { row: 3, col: 2, platformId: "rithmic" },
  { row: 3, col: 4, platformId: "projectx" },
  { row: 4, col: 3, platformId: "tradelocker" },
  { row: 4, col: 1, platformId: "ninjatrader" },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 3, col: 0 },
];
