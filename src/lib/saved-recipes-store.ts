import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Listener = (ids: Set<string>) => void;
const listeners = new Set<Listener>();
let ids = new Set<string>();
let loaded = false;

function emit() { listeners.forEach((l) => l(new Set(ids))); }

export async function loadSaved() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) { ids = new Set(); loaded = true; emit(); return; }
  const { data, error } = await supabase
    .from("saved_recipes")
    .select("recipe_id")
    .eq("user_id", u.user.id);
  if (error) return;
  ids = new Set((data ?? []).map((r) => r.recipe_id));
  loaded = true;
  emit();
}

export async function toggleSaved(recipeId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  if (ids.has(recipeId)) {
    await supabase.from("saved_recipes").delete()
      .eq("user_id", u.user.id).eq("recipe_id", recipeId);
    ids.delete(recipeId);
  } else {
    await supabase.from("saved_recipes")
      .insert({ user_id: u.user.id, recipe_id: recipeId });
    ids.add(recipeId);
  }
  emit();
}

export function useSavedRecipes() {
  const [s, setS] = useState<Set<string>>(ids);
  useEffect(() => {
    const l: Listener = (next) => setS(next);
    listeners.add(l);
    if (!loaded) loadSaved();
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") loadSaved();
    if (event === "SIGNED_OUT") { ids = new Set(); emit(); }
  });
}