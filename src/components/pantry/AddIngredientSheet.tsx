import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Plus, Clock } from "lucide-react";
import { toISODate } from "@/lib/pantry-utils";
import { addPantryItem, searchIngredients, MANUAL_CATEGORY_PRESETS, type ManualCategory } from "@/lib/pantry-store";
import type { Ingredient } from "@/lib/ingredients-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StorageTipPanel, type StorageTipData } from "./StorageTipPanel";

const RIPENESS = ["Unripe", "Ripe", "Overripe"] as const;

export function AddIngredientSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [tipsFor, setTipsFor] = useState<StorageTipData | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState(toISODate(new Date()));
  const [ripeness, setRipeness] = useState<typeof RIPENESS[number]>("Ripe");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<ManualCategory>("produce");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch(""); setSelected(null); setTipsFor(null);
      setQuantity("1"); setPurchaseDate(toISODate(new Date()));
      setRipeness("Ripe"); setCustomMode(false); setCustomName(""); setCustomCategory("produce");
    }
  }, [open]);

  const results = useMemo(() => searchIngredients(search), [search]);

  function handleSubmit() {
    setSubmitting(true);
    try {
      if (customMode) {
        addPantryItem({
          kind: "custom",
          name: customName.trim(),
          category: customCategory,
          quantity,
          purchaseDate,
        });
      } else {
        if (!selected) return;
        addPantryItem({
          kind: "ingredient",
          ingredient: selected,
          quantity,
          purchaseDate,
          ripeness,
        });
      }
      toast.success("Added to your pantry 🌿");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not add item");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = customMode ? customName.trim().length > 0 : !!selected;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto p-0">
        <div className="p-5 pb-8">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="font-display text-2xl">Add an ingredient</SheetTitle>
          </SheetHeader>

          {!customMode && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search ingredients…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                  className="pl-9 rounded-xl h-11"
                />
              </div>

              {search && (
                <div className="space-y-2 mb-4 relative">
                  {results.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-muted/40 rounded-2xl">
                      <p className="text-sm text-muted-foreground">No matches.</p>
                      <Button variant="link" onClick={() => { setCustomMode(true); setCustomName(search); }} className="text-primary">
                        + Add “{search}” manually
                      </Button>
                    </div>
                  ) : (
                    results.map((i) => {
                      const isSel = selected?.id === i.id;
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setSelected(i)}
                          className={cn(
                            "w-full text-left bg-card border rounded-2xl p-3 flex items-stretch gap-3 transition-all animate-fade-in",
                            isSel ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border hover:border-primary/40",
                          )}
                        >
                          <div className="size-11 rounded-xl bg-surface-warm flex items-center justify-center text-2xl flex-shrink-0">
                            {i.emoji}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-foreground truncate">{i.variant_name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/25 text-accent-foreground font-medium whitespace-nowrap">
                                {i.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                              {nutritionLine(i)}
                            </p>
                            <div className="flex items-end justify-between gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                                <Clock className="size-3" /> Shelf life: {formatShelf(i.base_shelf_life_days)}
                              </span>
                            </div>
                          </div>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTipsFor({
                                name: i.variant_name,
                                emoji: i.emoji,
                                category: i.category,
                                storage_tips: i.storage_tips,
                                shelf_life_days: i.base_shelf_life_days,
                                optimal_window_start_day: i.optimal_window_start_day,
                                optimal_window_end_day: i.optimal_window_end_day,
                              });
                            }}
                            className="self-center size-8 rounded-full bg-muted hover:bg-primary/15 flex items-center justify-center transition-colors flex-shrink-0"
                            aria-label="View storage tips"
                          >
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

          {customMode && (
            <div className="space-y-3 mb-4 bg-muted/40 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Custom ingredient</p>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={customName} onChange={(e) => setCustomName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(MANUAL_CATEGORY_PRESETS) as ManualCategory[]).map((k) => {
                    const p = MANUAL_CATEGORY_PRESETS[k];
                    const active = customCategory === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCustomCategory(k)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm transition-all flex items-center gap-2",
                          active ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span className="text-lg">{p.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">{p.label}</p>
                          <p className="text-[10px] text-muted-foreground">~{p.shelf}d</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomMode(false)} className="text-muted-foreground">
                ← Back to search
              </Button>
            </div>
          )}

          {!customMode && !search && (
            <Button variant="outline" onClick={() => setCustomMode(true)} className="w-full mb-4 rounded-xl">
              <Plus className="size-4 mr-2" /> Add a custom ingredient
            </Button>
          )}

          {/* Common fields */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-xl" placeholder="e.g. 200g" />
              </div>
              <div className="space-y-1.5">
                <Label>Purchased</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            {selected?.ripeness_applicable && (
              <div className="space-y-1.5">
                <Label>Ripeness <span className="text-muted-foreground font-normal">(adjusts shelf life)</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {RIPENESS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRipeness(r)}
                      className={cn(
                        "py-2 rounded-xl text-sm font-medium border transition-all",
                        ripeness === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full h-12 rounded-2xl text-base"
          >
            {submitting ? "Adding…" : "Add to pantry"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    <StorageTipPanel open={!!tipsFor} onClose={() => setTipsFor(null)} data={tipsFor} />
    </>
  );
}

function formatShelf(days: number): string {
  if (days >= 365) return `~${Math.round(days / 365)} year${days >= 730 ? "s" : ""}`;
  if (days >= 30) return `~${Math.round(days / 30)} month${days >= 60 ? "s" : ""}`;
  if (days >= 7) return `~${Math.round(days / 7)} week${days >= 14 ? "s" : ""}`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

function nutritionLine(i: Ingredient): string {
  const parts: string[] = [];
  if (i.basic_nutrition_info?.calories) parts.push(`${i.basic_nutrition_info.calories} kcal`);
  const vits = (i.basic_nutrition_info?.vitamins || []).slice(0, 2);
  for (const v of vits) parts.push(v);
  return parts.length ? parts.join(" · ") : "Whole food";
}