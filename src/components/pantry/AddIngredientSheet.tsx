import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronRight, Plus, Sparkles } from "lucide-react";
import { addDays, toISODate } from "@/lib/pantry-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Ingredient = {
  id: string;
  name: string;
  variant_name: string;
  emoji: string;
  category: string;
  base_shelf_life_days: number;
  optimal_window_start_day: number;
  optimal_window_end_day: number;
  storage_tips: string;
  basic_nutrition_info: any;
  ripeness_applicable: boolean;
};

const RIPENESS = ["Unripe", "Ripe", "Overripe"] as const;

export function AddIngredientSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [tipsFor, setTipsFor] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState(toISODate(new Date()));
  const [ripeness, setRipeness] = useState<typeof RIPENESS[number]>("Ripe");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customShelf, setCustomShelf] = useState("7");

  useEffect(() => {
    if (!open) {
      setSearch(""); setSelected(null); setTipsFor(null);
      setQuantity("1"); setPurchaseDate(toISODate(new Date()));
      setRipeness("Ripe"); setCustomMode(false); setCustomName(""); setCustomShelf("7");
    }
  }, [open]);

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  const results = useMemo(() => {
    if (!search.trim()) return [] as Ingredient[];
    const q = search.toLowerCase();
    return ingredients.filter(
      (i) => i.name.toLowerCase().includes(q) || i.variant_name.toLowerCase().includes(q),
    );
  }, [ingredients, search]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      let payload: any;
      if (customMode) {
        const shelf = Math.max(1, parseInt(customShelf) || 7);
        payload = {
          user_id: userId,
          ingredient_id: null,
          custom_name: customName.trim(),
          display_name: customName.trim(),
          emoji: "🥗",
          quantity,
          purchase_date: purchaseDate,
          shelf_life_days: shelf,
          optimal_window_start_day: Math.floor(shelf * 0.2),
          optimal_window_end_day: Math.floor(shelf * 0.7),
          expiry_date: toISODate(addDays(new Date(purchaseDate), shelf)),
          storage_tips: "Store in a cool, dry place.",
        };
      } else {
        if (!selected) throw new Error("Pick an ingredient");
        let shelf = selected.base_shelf_life_days;
        let startW = selected.optimal_window_start_day;
        let endW = selected.optimal_window_end_day;
        if (selected.ripeness_applicable) {
          if (ripeness === "Overripe") shelf = Math.max(1, Math.floor(shelf * 0.4));
          else if (ripeness === "Ripe") shelf = Math.max(1, Math.floor(shelf * 0.7));
        }
        payload = {
          user_id: userId,
          ingredient_id: selected.id,
          display_name: selected.variant_name,
          emoji: selected.emoji,
          quantity,
          purchase_date: purchaseDate,
          ripeness: selected.ripeness_applicable ? ripeness : null,
          shelf_life_days: shelf,
          optimal_window_start_day: Math.min(startW, shelf - 1),
          optimal_window_end_day: Math.min(endW, shelf),
          expiry_date: toISODate(addDays(new Date(purchaseDate), shelf)),
          storage_tips: selected.storage_tips,
        };
      }

      const { error } = await supabase.from("user_pantry").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pantry"] });
      toast.success("Added to your pantry 🌿");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add item"),
  });

  const canSubmit = customMode ? customName.trim().length > 0 : !!selected;

  return (
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
                      const isTipOpen = tipsFor?.id === i.id;
                      return (
                        <div key={i.id} className="relative">
                          <button
                            type="button"
                            onClick={() => setSelected(i)}
                            className={cn(
                              "w-full text-left bg-card border rounded-2xl p-3 flex items-start gap-3 transition-all",
                              isSel ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border hover:border-primary/40",
                            )}
                          >
                            <div className="size-11 rounded-xl bg-surface-warm flex items-center justify-center text-2xl flex-shrink-0">
                              {i.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{i.variant_name}</p>
                              <p className="text-xs text-muted-foreground mb-1.5">{i.category}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {i.basic_nutrition_info?.calories && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                                    {i.basic_nutrition_info.calories} cal
                                  </span>
                                )}
                                {(i.basic_nutrition_info?.vitamins || []).slice(0, 2).map((v: string) => (
                                  <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-full bg-fresh/15 text-fresh">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-[10px] px-2 py-1 rounded-full bg-golden/20 text-golden-foreground font-semibold whitespace-nowrap">
                                {formatShelf(i.base_shelf_life_days)}
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); setTipsFor(isTipOpen ? null : i); }}
                                className="size-7 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                              >
                                <ChevronRight className={cn("size-4 transition-transform", isTipOpen && "rotate-90")} />
                              </span>
                            </div>
                          </button>
                          {/* Storage tip side card */}
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-300 ease-out",
                              isTipOpen ? "max-h-40 mt-2 opacity-100 scale-100" : "max-h-0 opacity-0 scale-95",
                            )}
                          >
                            <div className="bg-secondary/60 border border-secondary rounded-2xl p-3 ml-14">
                              <p className="text-[10px] uppercase tracking-wide text-secondary-foreground/70 font-semibold mb-1 flex items-center gap-1">
                                <Sparkles className="size-3" /> Storage tip
                              </p>
                              <p className="text-xs text-secondary-foreground leading-relaxed">{i.storage_tips}</p>
                            </div>
                          </div>
                        </div>
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
                <Label>Shelf life (days)</Label>
                <Input type="number" min={1} value={customShelf} onChange={(e) => setCustomShelf(e.target.value)} className="rounded-xl" />
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
                <Label>Ripeness</Label>
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
            onClick={() => addMutation.mutate()}
            disabled={!canSubmit || addMutation.isPending}
            className="w-full h-12 rounded-2xl text-base"
          >
            {addMutation.isPending ? "Adding…" : "Add to pantry"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatShelf(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)} yr`;
  if (days >= 30) return `${Math.round(days / 30)} mo`;
  if (days >= 7) return `${Math.round(days / 7)} wk`;
  return `${days} d`;
}