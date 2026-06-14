import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Clock, Star } from "lucide-react";
import { useEffect } from "react";

export interface StorageTipData {
  name: string;
  emoji?: string;
  category?: string | null;
  storage_tips?: string | null;
  shelf_life_days: number;
  optimal_window_start_day: number;
  optimal_window_end_day: number;
  isCustom?: boolean;
}

function splitSteps(text: string): string[] {
  if (!text) return [];
  // Try numbered "1. ..." first
  const numbered = text.split(/\s*\d+\.\s+/).filter(Boolean);
  if (numbered.length > 1) return numbered.map((s) => s.trim());
  // Fall back to sentence split
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatShelf(days: number): string {
  if (days >= 365) return `~${Math.round(days / 365)} year${days >= 730 ? "s" : ""}`;
  if (days >= 30) return `~${Math.round(days / 30)} month${days >= 60 ? "s" : ""}`;
  if (days >= 7) return `~${Math.round(days / 7)} week${days >= 14 ? "s" : ""}`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function StorageTipPanel({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: StorageTipData | null;
}) {
  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && data && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.aside
            key="panel"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120 || info.velocity.x > 500) onClose();
            }}
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%", transition: { duration: 0.2, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.9 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[88%] max-w-sm bg-card border-l border-border shadow-2xl rounded-l-3xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-2xl bg-surface-warm flex items-center justify-center text-2xl flex-shrink-0">
                  {data.emoji || "🥗"}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold truncate">{data.name}</p>
                  {data.category && (
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {data.category}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center flex-shrink-0"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <section>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> How to store
                </p>
                {data.isCustom || !data.storage_tips ? (
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 rounded-2xl p-3">
                    No specific storage data available — store in a cool, dry place.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {splitSteps(data.storage_tips).map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 items-start bg-muted/40 rounded-2xl p-3"
                      >
                        <span className="size-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground/85 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-border p-3 flex items-start gap-3">
                  <Clock className="size-4 text-fresh mt-0.5" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Expected shelf life
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatShelf(data.shelf_life_days)}
                    </p>
                  </div>
                </div>
                {data.optimal_window_end_day > data.optimal_window_start_day && (
                  <div className="rounded-2xl border border-border p-3 flex items-start gap-3 bg-golden/10">
                    <Star className="size-4 text-golden-foreground mt-0.5" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                        Best consumed
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        Between day {data.optimal_window_start_day || 1}–
                        {data.optimal_window_end_day} for peak nutrition and taste
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <p className="text-[11px] text-center text-muted-foreground pt-2">
                Swipe right or tap outside to close
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}