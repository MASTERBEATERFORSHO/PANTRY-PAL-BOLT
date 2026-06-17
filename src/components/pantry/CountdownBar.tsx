import { cn } from "@/lib/utils";
import { computeCountdown } from "@/lib/pantry-utils";
import { Flame, ChevronRight, Clock, Trash2 } from "lucide-react";

export interface CountdownBarItem {
  id: string;
  display_name: string;
  emoji: string;
  quantity: string;
  purchase_date: string;
  shelf_life_days: number;
  optimal_window_start_day: number;
  optimal_window_end_day: number;
  storage_tips?: string | null;
}

export function CountdownBar({
  item,
  onClick,
  trailing,
  onUseItUp,
  onOpenTips,
}: {
  item: CountdownBarItem;
  onClick?: () => void;
  trailing?: React.ReactNode;
  onUseItUp?: () => void;
  onOpenTips?: () => void;
}) {
  const info = computeCountdown({
    purchaseDate: item.purchase_date,
    shelfLifeDays: item.shelf_life_days,
    optimalStart: item.optimal_window_start_day,
    optimalEnd: item.optimal_window_end_day,
  });

  // Urgency color based on REMAINING shelf life
  const pctRemaining = info.pctRemaining;
  const urgency: "green" | "orange" | "red" =
    info.daysRemaining <= 0 || pctRemaining < 25
      ? "red"
      : pctRemaining < 50
      ? "orange"
      : "green";

  const fillStyles = {
    green: { fill: "bg-[color:var(--color-primary)]", track: "bg-[color:var(--color-accent)]/25" },
    orange: { fill: "bg-[color:var(--color-warning)]", track: "bg-[color:var(--color-warning)]/20" },
    red: { fill: "bg-[color:var(--color-danger)]", track: "bg-[color:var(--color-danger)]/15" },
  }[urgency];

  // Fill width = elapsed % (so urgency fills the pill as time passes)
  const fillPct = Math.min(100, Math.max(8, info.pctElapsed));

  // Golden window overlay positioned by actual ingredient data
  const goldStart = Math.max(0, info.goldenStartPct);
  const goldEnd = Math.min(100, info.goldenEndPct);
  const hasGolden = goldEnd > goldStart + 1;

  const isDanger = urgency === "red";
  const showUseItUp =
    !!onUseItUp && (info.status === "golden" || info.status === "past" || info.status === "expired");

  const daysLabel = info.daysRemaining <= 0 ? "0d" : `${info.daysRemaining}d`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 px-2">
        <p className="font-semibold text-sm text-foreground truncate">{item.display_name}</p>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">{item.quantity}</span>
      </div>
      <div className="flex items-center gap-2">
      <div
        onClick={onClick}
        className={cn(
          "relative flex-1 h-16 rounded-full shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] overflow-hidden transition-all",
          fillStyles.track,
          onClick && "cursor-pointer hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-0.5",
        )}
      >
        {/* Filled urgency portion */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
            fillStyles.fill,
            isDanger && "animate-pulse",
          )}
          style={{ width: `${fillPct}%` }}
        />

        {/* Golden zone overlay (positioned by real shelf data) */}
        {hasGolden && (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full golden-shimmer opacity-80 mix-blend-screen pointer-events-none"
            style={{
              left: `${goldStart}%`,
              width: `${Math.max(2, goldEnd - goldStart)}%`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Circular emoji embedded at left end of pill */}
        <div className="absolute left-1.5 top-1.5 bottom-1.5 aspect-square rounded-full bg-card shadow-md flex items-center justify-center text-2xl ring-2 ring-card z-10">
          {item.emoji}
        </div>

        {/* Days remaining inside fill, right-edge of fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 text-white font-bold text-sm tabular-nums drop-shadow z-10"
          style={{ left: `calc(max(${fillPct}%, 72px) - 52px)` }}
        >
          <Clock className="size-3.5" />
          <span>{daysLabel}</span>
        </div>
      </div>

      {/* Trailing controls outside the pill */}
      <div className="flex items-center gap-1.5">
        {onOpenTips && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenTips();
            }}
            className="size-8 rounded-full bg-card border border-border hover:bg-primary/10 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Storage tips"
          >
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}
        {showUseItUp && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseItUp?.();
            }}
            className={cn(
              "size-8 rounded-full flex items-center justify-center shadow-sm transition-colors",
              isDanger
                ? "bg-danger/15 text-danger hover:bg-danger/25"
                : "bg-golden/25 text-golden-foreground hover:bg-golden/40",
            )}
            aria-label="Use it up"
          >
            <Flame className="size-3.5" />
          </button>
        )}
        {trailing}
      </div>
      </div>
    </div>
  );
}