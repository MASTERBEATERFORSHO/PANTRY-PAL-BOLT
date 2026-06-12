import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CountdownBar } from "@/components/pantry/CountdownBar";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_pantry")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
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
            <CountdownBar key={it.id} item={it as any} />
          ))}
        </div>
      )}
    </div>
  );
}