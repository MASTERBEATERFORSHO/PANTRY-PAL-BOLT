import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChefHat, Heart, Utensils, Settings, LogOut, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState<string>("");
  const [strict, setStrict] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sections = [
    { icon: Utensils, label: "Kitchen Equipment", hint: "Pots, pans, appliances" },
    { icon: Heart, label: "Dietary Preferences", hint: "Allergies, diets, dislikes" },
    { icon: ChefHat, label: "Saved Recipes", hint: "Your cookbook" },
  ];

  return (
    <div className="px-5 pt-8 animate-in fade-in slide-in-from-right-2 duration-300">
      <header className="mb-6 flex items-center gap-4">
        <div className="size-14 rounded-full bg-gradient-to-br from-primary to-fresh flex items-center justify-center text-primary-foreground font-display text-2xl font-semibold">
          {email.charAt(0).toUpperCase() || "🥗"}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold text-foreground truncate">{email || "You"}</h1>
          <p className="text-xs text-muted-foreground">PantryPal member</p>
        </div>
      </header>

      <div className="bg-card rounded-2xl border border-border p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            <Settings className="size-4" /> Default Mode
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {strict ? "Strict — only use pantry items" : "Flexible — suggest a few extras"}
          </p>
        </div>
        <Switch checked={strict} onCheckedChange={setStrict} />
      </div>

      <div className="bg-card rounded-2xl border border-border divide-y divide-border mb-6">
        {sections.map((s) => (
          <button
            key={s.label}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
          >
            <div className="size-9 rounded-xl bg-surface-warm flex items-center justify-center text-primary">
              <s.icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Button onClick={signOut} variant="ghost" className="w-full rounded-2xl h-12 text-danger hover:text-danger hover:bg-danger/10">
        <LogOut className="size-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}