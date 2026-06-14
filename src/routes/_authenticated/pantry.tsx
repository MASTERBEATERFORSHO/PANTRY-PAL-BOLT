import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CountdownBar } from "@/components/pantry/CountdownBar";
import { usePantry, removePantryItem, type PantryItem } from "@/lib/pantry-store";
import { canonicalName } from "@/lib/recipe-matcher";
import { AddIngredientSheet } from "@/components/pantry/AddIngredientSheet";
import { StorageTipPanel, type StorageTipData } from "@/components/pantry/StorageTipPanel";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

const searchSchema = z.object({ add: z.coerce.number().optional() });

export const Route = createFileRoute("/_authenticated/pantry")({
  validateSearch: searchSchema,
  component: PantryPage,
});

function PantryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [tipsData, setTipsData] = useState<StorageTipData | null>(null);

  useEffect(() => {
    if (search.add) {
      setAddOpen(true);
      navigate({ to: "/pantry", search: {} as any, replace: true });
    }
  }, [search.add, navigate]);

  const items = usePantry();

  function handleDelete(id: string) {
    removePantryItem(id);
    toast.success("Removed");
  }

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
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Pantry</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage what's on the shelf.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-full h-10 px-4">
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-card rounded-3xl border border-dashed">
          <p className="text-4xl mb-3">🧺</p>
          <p className="font-medium text-foreground">Your pantry is empty</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 rounded-full">
            <Plus className="size-4 mr-1" /> Add first ingredient
          </Button>
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
              trailing={
                <button
                  onClick={() => handleDelete(it.id)}
                  className="mt-1 size-7 rounded-full bg-muted hover:bg-danger/10 flex items-center justify-center"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </button>
              }
            />
          ))}
        </div>
      )}

      <AddIngredientSheet open={addOpen} onOpenChange={setAddOpen} />
      <StorageTipPanel open={!!tipsData} onClose={() => setTipsData(null)} data={tipsData} />
    </div>
  );
}