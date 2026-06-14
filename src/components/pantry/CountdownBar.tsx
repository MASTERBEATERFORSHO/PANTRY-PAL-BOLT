import { cn } from "@/lib/utils";
import { computeCountdown } from "@/lib/pantry-utils";
import { Flame, ChevronRight } from "lucide-react";

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

  const isDanger = info.status === "expired" || info.status === "past";
  const showUseItUp =
    !!onUseItUp && (info.status === "golden" || info.status === "past" || info.status === "expired");

  // Fixed zone segments along the bar
  const total = info.totalDays;
  const goldStart = Math.max(0, info.goldenStartPct);
  const goldEnd = Math.min(100, info.goldenEndPct);
  const hasGolden = goldEnd > goldStart;
  // Red zone = last 15% of life, but at minimum begins where golden ends
  const redStart = Math.max(goldEnd, 100 - Math.max(15, Math.round((1 / Math.max(total, 1)) * 100)));
  const markerPct = Math.min(100, Math.max(0, info.pctElapsed));
  const pulseRed = info.status === "past" || info.status === "expired" || markerPct >= redStart - 5;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-card rounded-2xl border border-border p-3 flex items-center gap-3 shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="flex-shrink-0 size-12 rounded-xl bg-surface-warm flex items-center justify-center text-2xl">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <p className="font-semibold text-sm text-foreground truncate">{item.display_name}</p>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.quantity}</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-muted">
          {/* Green zone (start → golden start, or full if no golden) */}
          <div
            className="absolute inset-y-0 bg-fresh/55"
            style={{ left: 0, width: `${hasGolden ? goldStart : redStart}%` }}
          />
          {/* Golden zone */}
          {hasGolden && (
            <div
              className="absolute inset-y-0 bg-golden/70"
              style={{ left: `${goldStart}%`, width: `${Math.max(0, goldEnd - goldStart)}%` }}
            />
          )}
          {/* Red zone */}
          <div
            className={cn(
              "absolute inset-y-0 bg-danger/70",
              pulseRed && "animate-pulse",
            )}
            style={{ left: `${redStart}%`, width: `${Math.max(0, 100 - redStart)}%` }}
          />
          {/* Dim consumed portion (left of marker) */}
          <div
            className="absolute inset-y-0 left-0 bg-foreground/10"
            style={{ width: `${markerPct}%` }}
          />
          {/* Today marker */}
          <div
            className="absolute -top-0.5 -bottom-0.5 w-1 rounded-full bg-foreground shadow-md ring-2 ring-card transition-all"
            style={{ left: `calc(${markerPct}% - 2px)` }}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 min-w-[68px]">
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            isDanger ? "text-danger" : info.status === "golden" ? "text-golden-foreground" : "text-fresh",
          )}
        >
          {info.daysRemaining <= 0 ? "Expired" : `${info.daysRemaining}d`}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {info.status === "golden" ? "peak" : info.daysRemaining <= 0 ? "" : "left"}
        </span>
        {onOpenTips && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenTips();
            }}
            className="size-7 rounded-full bg-muted hover:bg-primary/15 flex items-center justify-center transition-colors"
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
              "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors",
              isDanger
                ? "bg-danger/15 text-danger hover:bg-danger/25"
                : "bg-golden/25 text-golden-foreground hover:bg-golden/40",
            )}
          >
            <Flame className="size-3" /> Use it up
          </button>
        )}
        {trailing}
      </div>
    </div>
  );
}