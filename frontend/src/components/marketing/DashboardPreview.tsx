import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Branded CopyMorphic dashboard mock — labels match the live app shell. */
export function DashboardPreview({ className, compact = false }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border bg-card shadow-sm",
        compact ? "text-[10px]" : "text-xs sm:text-sm",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-red-400/80 md:size-2.5" />
          <span className="size-2 rounded-full bg-amber-400/80 md:size-2.5" />
          <span className="size-2 rounded-full bg-emerald-400/80 md:size-2.5" />
        </div>
        <div className="ml-2 flex items-center gap-2">
          <Image
            src="/logo-mark.svg"
            alt=""
            width={18}
            height={18}
            className="size-4 opacity-90 md:size-[18px]"
          />
          <span className="font-semibold tracking-tight text-foreground/90">
            Dashboard
          </span>
        </div>
        <span className="ml-auto rounded-sm border border-dashed px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground md:text-[0.7rem]">
          Preview
        </span>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-[9rem_1fr] md:gap-4 md:p-4 lg:grid-cols-[10rem_1fr]">
        <aside className="hidden space-y-1.5 md:block">
          {[
            "Dashboard",
            "Accounts",
            "Copy engine",
            "Copy log",
            "Performance",
            "Settings",
          ].map((item, i) => (
            <div
              key={item}
              className={cn(
                "rounded-sm px-2.5 py-1.5 font-medium",
                i === 0
                  ? "bg-[var(--brand)]/12 text-[var(--brand-press)]"
                  : "text-muted-foreground",
              )}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[
              { label: "Daily P&L", value: "+$842" },
              { label: "Copies today", value: "24" },
              { label: "Accounts linked", value: "6" },
              { label: "Avg latency", value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-sm border bg-background/80 p-2.5 md:p-3"
              >
                <p className="text-[0.65rem] text-muted-foreground md:text-[0.7rem]">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-base font-semibold tracking-tight md:text-lg">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-sm border bg-background/80 p-2.5 md:p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-foreground">Recent copy events</p>
              <span className="text-[0.65rem] text-muted-foreground md:text-[0.7rem]">
                Today
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { pair: "EURUSD · Master → Prop-3", status: "Copied", ms: "—" },
                { pair: "XAUUSD · Master → Eval-7", status: "Copied", ms: "—" },
                { pair: "NAS100 · Master → Funded-2", status: "Copied", ms: "—" },
              ].map((row) => (
                <div
                  key={row.pair}
                  className="flex items-center justify-between rounded-sm bg-muted/35 px-2 py-1.5 md:px-2.5"
                >
                  <span className="truncate pr-2 text-[0.65rem] md:text-[0.75rem]">
                    {row.pair}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-medium text-emerald-700 dark:text-emerald-400 md:text-[0.65rem]">
                      {row.status}
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground md:text-[0.65rem]">
                      {row.ms}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
