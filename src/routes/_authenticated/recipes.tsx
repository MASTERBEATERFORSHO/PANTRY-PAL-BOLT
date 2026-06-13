import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePantry } from "@/lib/pantry-store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { ChefHat, ChevronDown, Clock, Flame, Sparkles, AlertCircle } from "lucide-react";
import { z } from "zod";
import { canonicalName, isExpiring, matchRecipes } from "@/lib/recipe-matcher";
import type { CookingGoal } from "@/lib/recipes-data";

const searchSchema = z.object({
  useUp: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/recipes")({
  validateSearch: searchSchema,
  component: RecipesPage,
});

const GOALS: { key: CookingGoal; label: string; emoji: string }[] = [
  { key: "snack", label: "Snack", emoji: "🥨" },
  { key: "healthy", label: "Healthy", emoji: "🥗" },
  { key: "filling", label: "Filling", emoji: "🍛" },
  { key: "quick", label: "Quick", emoji: "⚡" },
];

function RecipesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const items = usePantry();

  const [filter, setFilter] = useState<"all" | "expiring">("all");
  const [extra, setExtra] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [goals, setGoals] = useState<Set<CookingGoal>>(new Set());
  const [mode, setMode] = useState<"strict" | "flexible">("flexible");
  const [hasSearched, setHasSearched] = useState(false);
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);

  // Handle "Use it up" nudge from Home/Pantry
  useEffect(() => {
    if (!search.useUp) return;
    const target = search.useUp;
    const match = items.find(
      (it) => canonicalName(it).toLowerCase() === target.toLowerCase(),
    );
    if (match) {
      setSelectedIds(new Set([match.id]));
    } else {
      setExtraNames([target]);
      setExtra(target);
    }
    setHasSearched(true);
    navigate({ to: "/recipes", search: {} as any, replace: true });
  }, [search.useUp, items, navigate]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(isExpiring);
  }, [items, filter]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleGoal = (g: CookingGoal) =>
    setGoals((prev) => {
      const n = new Set(prev);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });

  function commitExtras(value: string) {
    setExtra(value);
    const parsed = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setExtraNames(parsed);
  }

  const selectedItems = items.filter((it) => selectedIds.has(it.id));
  const selectedNames = [
    ...selectedItems.map((it) => canonicalName(it)),
    ...extraNames,
  ];
  const expiringNames = selectedItems
    .filter(isExpiring)
    .map((it) => canonicalName(it));
  const pantryNames = items.map((it) => canonicalName(it));

  const results = useMemo(
    () =>
      hasSearched
        ? matchRecipes({
            selectedNames,
            expiringNames,
            pantryNames,
            goals: [...goals],
            mode,
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSearched, selectedIds, extraNames, goals, mode, items],
  );

  const canSearch = selectedNames.length > 0;

  return (
    <div className="px-5 pt-8 pb-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-foreground">Find a recipe</h1>
        <p className="text-sm text-muted-foreground mt-1">Cook from what you've got.</p>
      </header>

      {/* Cooking goals */}
      <section className="mb-5">
        <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
          Cooking goal
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGoals(new Set())}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              goals.size === 0
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground border-border",
            )}
          >
            Any
          </button>
          {GOALS.map((g) => {
            const on = goals.has(g.key);
            return (
              <button
                key={g.key}
                onClick={() => toggleGoal(g.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  on
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary/40",
                )}
              >
                <span className="mr-1">{g.emoji}</span>
                {g.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Mode toggle */}
      <section className="mb-5">
        <div className="flex gap-2 p-1 bg-muted rounded-full">
          {(["strict", "flexible"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-full transition-all capitalize",
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 px-1 leading-relaxed">
          {mode === "strict"
            ? "Strict: only recipes using your selected ingredients."
            : "Flexible: your selection plus other pantry items or common staples (salt, oil, spices)."}
        </p>
      </section>

      {/* Pantry chip filter */}
      <section className="mb-3">
        <div className="flex gap-2 mb-3 p-1 bg-muted/60 rounded-full">
          {(["all", "expiring"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all",
                filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {k === "all" ? "All Pantry" : "Expiring Soon"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {filter === "expiring" ? "Nothing expiring — nice." : "No pantry items yet."}
            </p>
          ) : (
            visible.map((it) => {
              const isSel = selectedIds.has(it.id);
              const expiring = isExpiring(it);
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
                  {expiring && !isSel && <Flame className="size-3 text-danger" />}
                </button>
              );
            })
          )}
        </div>
      </section>

      <div className="space-y-2 mb-5">
        <label className="text-sm font-medium text-foreground">Add extras (comma separated)</label>
        <Input
          placeholder="e.g. garlic, chili flakes"
          value={extra}
          onChange={(e) => commitExtras(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <Button
        onClick={() => setHasSearched(true)}
        disabled={!canSearch}
        className="w-full h-12 rounded-2xl text-base"
      >
        <ChefHat className="size-5 mr-2" />
        Get Recipe
      </Button>
      {!canSearch && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Pick at least one ingredient to get started.
        </p>
      )}

      {/* Results */}
      {hasSearched && canSearch && (
        <section className="mt-7">
          <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">
            {results.length === 0 ? "No matches" : `${results.length} recipe${results.length === 1 ? "" : "s"}`}
          </p>
          {results.length === 0 ? (
            <div className="text-center py-10 px-6 bg-card rounded-3xl border border-dashed">
              <p className="text-3xl mb-2">🤔</p>
              <p className="text-sm text-foreground font-medium">No recipes match yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try Flexible mode, fewer goals, or add another ingredient.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((m) => {
                const isOpen = openRecipe === m.recipe.id;
                const pct = Math.round(m.matchPct * 100);
                return (
                  <article
                    key={m.recipe.id}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-12 rounded-xl bg-surface-warm flex items-center justify-center text-2xl flex-shrink-0">
                        {m.recipe.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-base font-semibold text-foreground leading-tight">
                            {m.recipe.name}
                          </h3>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-fresh/15 text-fresh font-bold whitespace-nowrap">
                            {pct}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" /> {m.recipe.prep_time_minutes}m
                          </span>
                          {m.recipe.cooking_goal.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground capitalize"
                            >
                              {g}
                            </span>
                          ))}
                          {m.expiringUsedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger/15 text-danger font-semibold">
                              <Flame className="size-3" /> uses {m.expiringUsedCount} expiring
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Uses <strong className="text-foreground">{m.matchedRequired.length}</strong> of your{" "}
                          <strong className="text-foreground">{selectedNames.length}</strong> selected ingredient
                          {selectedNames.length === 1 ? "" : "s"}.
                        </p>
                      </div>
                    </div>

                    {m.unusedSelected.length > 0 && (
                      <div className="mt-3 bg-muted/40 rounded-xl px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">
                          Won't use in this recipe
                        </p>
                        <p className="text-xs text-foreground">{m.unusedSelected.join(", ")}</p>
                      </div>
                    )}

                    {m.missingIngredients.length > 0 && (
                      <div className="mt-2 bg-golden/10 rounded-xl px-3 py-2 flex items-start gap-2">
                        <AlertCircle className="size-3.5 text-golden-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-golden-foreground mb-0.5">
                            Also needed
                          </p>
                          <p className="text-xs text-foreground">{m.missingIngredients.join(", ")}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setOpenRecipe(isOpen ? null : m.recipe.id)}
                      className="mt-3 w-full flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{isOpen ? "Hide instructions" : "Show instructions"}</span>
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </button>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isOpen ? "max-h-[600px] opacity-100 mt-3" : "max-h-0 opacity-0",
                      )}
                    >
                      <ol className="space-y-2 text-sm text-foreground/90 list-decimal list-inside bg-surface-warm rounded-xl p-3">
                        {m.recipe.instructions.map((s, i) => (
                          <li key={i} className="leading-relaxed">{s}</li>
                        ))}
                      </ol>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Sparkles className="size-3" /> Equipment: {m.recipe.equipment_needed.join(", ")}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}