import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EquipmentKey, DietaryTag } from "@/lib/preferences-data";
import type { CookingGoal } from "@/lib/recipes-data";

export interface Profile {
  id: string;
  email: string | null;
  equipment: EquipmentKey[];
  dietary_preferences: DietaryTag[];
  default_cooking_goals: CookingGoal[];
  default_mode: "strict" | "flexible";
}

type Listener = (p: Profile | null) => void;
const listeners = new Set<Listener>();
let current: Profile | null = null;
let loading = false;

function emit() {
  listeners.forEach((l) => l(current));
}

export async function loadProfile(): Promise<Profile | null> {
  if (loading) return current;
  loading = true;
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      current = null; emit(); return null;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      // Auto-create (trigger should handle this, but be defensive)
      const { data: ins } = await supabase
        .from("profiles")
        .insert({ id: u.user.id, email: u.user.email })
        .select()
        .single();
      current = ins as any;
    } else {
      current = data as any;
    }
    emit();
    return current;
  } finally {
    loading = false;
  }
}

export async function updateProfile(patch: Partial<Omit<Profile, "id" | "email">>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", u.user.id)
    .select()
    .single();
  if (error) throw error;
  current = data as any;
  emit();
}

export function useProfile() {
  const [p, setP] = useState<Profile | null>(current);
  useEffect(() => {
    const l: Listener = (np) => setP(np);
    listeners.add(l);
    if (!current) loadProfile();
    return () => { listeners.delete(l); };
  }, []);
  const refresh = useCallback(() => loadProfile(), []);
  return { profile: p, refresh };
}

// Hook into auth changes — reload on sign-in, clear on sign-out
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED") loadProfile();
    if (event === "SIGNED_OUT") { current = null; emit(); }
  });
}