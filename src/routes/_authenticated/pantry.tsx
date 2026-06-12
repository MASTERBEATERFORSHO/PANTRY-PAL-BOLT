import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CountdownBar } from "@/components/pantry/CountdownBar";
import { AddIngredientSheet } from "@/components/pantry/AddIngredientSheet";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const searchSchema = z.object({ add: z.coerce.number().optional() });

export const Route = createFileRoute("/_authenticated/pantry")({
  validateSearch: searchSchema,
  component: PantryPage,
});

function PantryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [tipsItem, setTipsItem] = useState<any | null>(null);

  useEffect(() => {
    if (search.add) {
      setAddOpen(true);
      navigate({ to: "/pantry", search: {} as any, replace: true });
    }
  }, [search.add, navigate]);

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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_pantry").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pantry"] });
      toast.success("Removed");
    },
  });

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

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-card rounded-3xl border border-dashed">
          <p className="text-4xl mb-3">🧺</p>
          <p className="font-medium text-foreground">Your pantry is empty</p>
          <Button onClick={() => setAddOpen(true)} className="mt-4 rounded-full">
            <Plus className="size-4 mr-1" /> Add first ingredient
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it: any) => (
            <div key={it.id} className="space-y-2">
              <CountdownBar
                item={it}
                trailing={
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => setTipsItem(tipsItem?.id === it.id ? null : it)}
                      className="size-7 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center"
                    >
                      <Info className="size-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => del.mutate(it.id)}
                      className="size-7 rounded-full bg-muted hover:bg-danger/10 flex items-center justify-center"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                }
              />
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  tipsItem?.id === it.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="bg-secondary/50 border border-secondary rounded-2xl p-3 ml-14 relative">
                  <button onClick={() => setTipsItem(null)} className="absolute top-2 right-2 text-secondary-foreground/60 hover:text-secondary-foreground">
                    <X className="size-3.5" />
                  </button>
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-secondary-foreground/70 mb-1">Storage tip</p>
                  <p className="text-xs text-secondary-foreground leading-relaxed pr-5">
                    {it.storage_tips || "Store in a cool, dry place."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddIngredientSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}