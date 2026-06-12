import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { computeCountdown } from "@/lib/pantry-utils";
import { ChefHat, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recipes")({
  component: RecipesPage,
});

function RecipesPage() {
  const [filter, setFilter] = useState<"all" | "expiring">("all");
  const [extra, setExtra] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: items = [] } = useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_pantry").select("*");
      if (error) throw error;
      return data;
    },
  });

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it: any) => {
      const info = computeCountdown({
        purchaseDate: it.purchase_date,
        shelfLifeDays: it.shelf_life_days,
        optimalStart: it.optimal_window_start_day,
        optimalEnd: it.optimal_window_end_day,
      });
      return info.status === "past" || info.status === "golden" || info.status === "expired";
    });
  }, [items, filter]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="px-5 pt-8 animate-in fade-in slide-in-from-right-2 duration-300">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Find a recipe</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick ingredients to cook with.</p>
      </header>

      <div className="flex gap-2 mb-5 p-1 bg-muted rounded-full">
        {(["all", "expiring"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-full transition-all",
              filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {k === "all" ? "All Pantry Items" : "Expiring Soon"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {filter === "expiring" ? "Nothing expiring soon — good job!" : "No pantry items yet."}
          </p>
        ) : (
          visible.map((it: any) => {
            const isSel = selected.has(it.id);
            return (
              <button
                key={it.id}
                onClick={() => toggle(it.id)}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5",
                  isSel
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary/40",
                )}
              >
                <span>{it.emoji}</span>
                {it.display_name}
              </button>
            );
          })
        )}
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-foreground">Add extras (comma separated)</label>
        <Input
          placeholder="e.g. garlic, chili flakes"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <Button className="w-full h-12 rounded-2xl text-base">
        <ChefHat className="size-5 mr-2" />
        Get Recipe
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
        <Sparkles className="size-3" /> Recipe engine coming soon
      </p>
    </div>
  );
}