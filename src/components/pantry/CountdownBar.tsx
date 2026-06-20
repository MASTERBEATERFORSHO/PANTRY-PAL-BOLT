import { cn } from "@/lib/utils";
import { computeCountdown } from "@/lib/pantry-utils";
import { Flame, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

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
  onDiscard,
  onMarkUsed,
  debug,
}: {
  item: CountdownBarItem;
  onClick?: () => void;
  trailing?: React.ReactNode;
  onUseItUp?: () => void;
  onOpenTips?: () => void;
  onDiscard?: () => void;
  onMarkUsed?: () => void;
  debug?: boolean;
}) {
  const info = computeCountdown({
    purchaseDate: item.purchase_date,
    shelfLifeDays: item.shelf_life_days,
    optimalStart: item.optimal_window_start_day,
    optimalEnd: item.optimal_window_end_day,
  });

  const isExpired = info.daysRemaining <= 0;
  const pctRemaining = info.pctRemaining;

  // Urgency tier drives the fill color (green → orange → red as time drains)
  const urgency: "green" | "orange" | "red" =
    pctRemaining < 25 ? "red" : pctRemaining < 50 ? "orange" : "green";

  const fillColor = {
    green: "var(--color-primary, #2D5A27)",
    orange: "var(--color-warning, #E8780C)",
    red: "var(--color-danger, #D93025)",
  }[urgency];

  // The pill drains from right → left: the colored portion shrinks while the
  // lighter "spent" track is revealed behind it.
  const remainingPct = isExpired ? 0 : Math.max(6, pctRemaining);

  // Golden window overlay positioned by ingredient data
  const goldStart = Math.max(0, info.goldenStartPct);
  const goldEnd = Math.min(100, info.goldenEndPct);
  const hasGolden =
    !isExpired &&
    item.optimal_window_end_day > item.optimal_window_start_day &&
    goldEnd > goldStart + 0.5;

  const [removing, setRemoving] = useState(false);
  const handleExpiredAction = (fn?: () => void) => {
    if (!fn) return;
    setRemoving(true);
    setTimeout(fn, 280);
  };

  const showUseItUp =
    !isExpired &&
    !!onUseItUp &&
    (info.status === "golden" || info.status === "past");

  const daysLabel = `${Math.max(0, info.daysRemaining)}d`;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 transition-all duration-300",
        removing && "opacity-0 -translate-y-1 scale-[0.98]",
      )}
    >
      <div className="flex items-baseline justify-between gap-2 px-2">
        <p className="font-semibold text-sm text-foreground truncate">{item.display_name}</p>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">{item.quantity}</span>
      </div>
      <div className="flex items-center gap-2">
      <div
        onClick={onClick}
        className={cn(
          "relative flex-1 h-16 rounded-full shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)] overflow-hidden transition-all",
          onClick && "cursor-pointer hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-0.5",
        )}
        style={{
          // Lighter "spent" track — desaturated tint of current urgency color.
          background: isExpired ? "#9E9E9E" : `color-mix(in oklab, ${fillColor} 18%, white)`,
        }}
      >
        {/* Filled remaining portion — drains as time elapses */}
        {!isExpired && (
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 ease-out",
              urgency === "red" && "animate-pulse",
            )}
            style={{ width: `${remainingPct}%`, background: fillColor }}
          />
        )}

        {/* Expired: black/grey checkered overlay */}
        {isExpired && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#1A1A1A 0% 25%, #4a4a4a 0% 50%)",
              backgroundSize: "14px 14px",
              opacity: 0.55,
            }}
            aria-hidden="true"
          />
        )}

        {/* Golden zone overlay — amber band with gloss, positioned by shelf data */}
        {hasGolden && (
          <div
            className="absolute top-2 bottom-2 pointer-events-none overflow-hidden"
            style={{
              left: `${goldStart}%`,
              width: `${Math.max(3, goldEnd - goldStart)}%`,
              borderRadius: "4px",
              background: "rgba(245, 184, 0, 0.35)",
              boxShadow: "inset 0 0 0 1px rgba(245, 184, 0, 0.45)",
            }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)",
              }}
            />
          </div>
        )}

        {/* DEBUG: golden window markers + elapsed cursor */}
        {debug && (
          <>
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{ left: `${goldStart}%`, width: 2, background: "#1A1A1A" }}
              aria-hidden="true"
            />
            <div
              className="absolute -top-4 text-[9px] font-mono font-bold text-foreground bg-card px-1 rounded pointer-events-none z-20"
              style={{ left: `calc(${goldStart}% - 6px)` }}
            >
              d{item.optimal_window_start_day}
            </div>
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{ left: `${goldEnd}%`, width: 2, background: "#1A1A1A" }}
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-4 text-[9px] font-mono font-bold text-foreground bg-card px-1 rounded pointer-events-none z-20"
              style={{ left: `calc(${goldEnd}% - 6px)` }}
            >
              d{item.optimal_window_end_day}
            </div>
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{ left: `${info.pctElapsed}%`, width: 2, background: "#D93025" }}
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-4 text-[9px] font-mono font-bold text-danger bg-card px-1 rounded pointer-events-none z-20"
              style={{ left: `calc(${info.pctElapsed}% - 10px)` }}
            >
              now d{info.daysSincePurchase}/{info.totalDays}
            </div>
          </>
        )}

        {/* Circular emoji embedded at left end of pill */}
        <div className="absolute left-1.5 top-1.5 bottom-1.5 aspect-square rounded-full bg-card shadow-md flex items-center justify-center text-2xl ring-2 ring-card z-10">
          {item.emoji}
        </div>

        {/* Days remaining / Expired label — always on the right side */}
        <div
          className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1 text-white font-bold tabular-nums z-10"
          style={{
            fontSize: "14px",
            textShadow: "0px 1px 3px rgba(0,0,0,0.45)",
          }}
        >
          {isExpired ? (
            <span className="tracking-wide">Expired</span>
          ) : (
            <>
              <Clock className="size-4 text-white" />
              <span>{daysLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Trailing controls outside the pill */}
      <div className="flex items-center gap-1.5">
        {isExpired ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExpiredAction(onDiscard ?? onMarkUsed);
              }}
              className="h-8 px-3 rounded-full border border-danger/60 text-danger text-xs font-semibold hover:bg-danger/10 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExpiredAction(onMarkUsed ?? onDiscard);
              }}
              className="h-8 px-3 rounded-full border border-primary/60 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
            >
              I used it
            </button>
          </>
        ) : (
          <>
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
            className="size-8 rounded-full flex items-center justify-center shadow-sm transition-colors bg-golden/25 text-golden-foreground hover:bg-golden/40"
            aria-label="Use it up"
          >
            <Flame className="size-3.5" />
          </button>
        )}
        {trailing}
          </>
        )}
      </div>
      </div>
    </div>
  );
}