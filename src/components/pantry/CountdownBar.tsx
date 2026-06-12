import { cn } from "@/lib/utils";
import { computeCountdown } from "@/lib/pantry-utils";

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
}: {
  item: CountdownBarItem;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const info = computeCountdown({
    purchaseDate: item.purchase_date,
    shelfLifeDays: item.shelf_life_days,
    optimalStart: item.optimal_window_start_day,
    optimalEnd: item.optimal_window_end_day,
  });

  const isDanger = info.status === "expired" || info.status === "past";
  const remainingColor =
    info.status === "expired"
      ? "bg-danger"
      : info.status === "past"
        ? "bg-danger/80"
        : info.status === "golden"
          ? "bg-golden"
          : "bg-fresh";

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
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          {/* Golden zone */}
          <div
            className="absolute inset-y-0 bg-golden/30 border-x border-golden/60"
            style={{
              left: `${info.goldenStartPct}%`,
              width: `${Math.max(0, info.goldenEndPct - info.goldenStartPct)}%`,
            }}
          />
          {/* Remaining fill */}
          <div
            className={cn("absolute inset-y-0 left-0 transition-all rounded-r-full", remainingColor)}
            style={{ width: `${info.pctRemaining}%`, opacity: 0.85 }}
          />
          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
            style={{ left: `${info.pctElapsed}%` }}
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
        {trailing}
      </div>
    </div>
  );
}