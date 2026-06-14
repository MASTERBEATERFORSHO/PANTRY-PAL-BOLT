import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CountdownBar } from "@/components/pantry/CountdownBar";
import { usePantry, type PantryItem } from "@/lib/pantry-store";
import { canonicalName } from "@/lib/recipe-matcher";
import { StorageTipPanel, type StorageTipData } from "@/components/pantry/StorageTipPanel";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const items = usePantry();
  const [tipsData, setTipsData] = useState<StorageTipData | null>(null);

  function openTips(it: PantryItem) {
    setTipsData({
      name: it.display_name,
      emoji: it.emoji,
      category: it.category ?? null,
      storage_tips: it.storage_tips,
      shelf_life_days: it.shelf_life_days,
      optimal_window_start_day: it.optimal_window_start_day,
      optimal_window_end_day: it.optimal_window_end_day,
      isCustom: !it.ingredient_id,
    });
  }

  return (
    <div className="px-5 pt-8 animate-in fade-in slide-in-from-right-2 duration-300">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Welcome back 🌿</p>
        <h1 className="font-display text-3xl font-semibold text-foreground mt-1">
          Your pantry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length === 0
            ? "Add your first ingredient to start tracking."
            : `${items.length} ${items.length === 1 ? "item" : "items"} on the clock.`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => navigate({ to: "/pantry", search: { add: 1 } as any })}
          className="h-auto py-4 rounded-2xl flex flex-col gap-1 bg-primary hover:bg-primary/90"
        >
          <Plus className="size-5" />
          <span className="text-sm font-semibold">Add Ingredient</span>
        </Button>
        <Button
          onClick={() => navigate({ to: "/recipes" })}
          variant="secondary"
          className="h-auto py-4 rounded-2xl flex flex-col gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <ChefHat className="size-5" />
          <span className="text-sm font-semibold">Find a Recipe</span>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 px-6 bg-card rounded-3xl border border-dashed">
          <Sparkles className="size-8 mx-auto text-accent mb-3" />
          <p className="font-medium text-foreground">Nothing in the pantry yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap “Add Ingredient” to start watching it ripen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <CountdownBar
              key={it.id}
              item={it}
              onOpenTips={() => openTips(it)}
              onUseItUp={() =>
                navigate({
                  to: "/recipes",
                  search: { useUp: canonicalName(it) } as any,
                })
              }
            />
          ))}
        </div>
      )}
      <StorageTipPanel open={!!tipsData} onClose={() => setTipsData(null)} data={tipsData} />
    </div>
  );
}